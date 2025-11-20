#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <filesystem>
#include <chrono>
#include <sstream>

#include <opencv2/opencv.hpp>
#include <nlohmann/json.hpp>

#include <cv_functions.hpp>

using json = nlohmann::json;

using namespace std;
namespace fs = std::filesystem;

// usage .\cv.exe --output <outputDir> --input <image1> [image2 ...] [--pipeline <pipelineJson>]

enum class CvNodeType {
    Source = 0,
    Output = 1,
    Blur = 2,
    DeepFry = 3
};

struct PipelineNode {
    string id;
    CvNodeType cvNodeType;
    unordered_map<string, string> params; // Store params as string key-value pairs
};
struct PipelineEdge {
    string source;
    string target;
};

// ====================================================================================================
// SETUP

bool parsePipeline(const string& jsonStr, vector<PipelineNode>& nodes, vector<PipelineEdge>& edges) {
    try {
        json j = json::parse(jsonStr);

        if (j.contains("nodes") && j["nodes"].is_array()) {
            for (const auto& nodeJson : j["nodes"]) {
                PipelineNode node;
                
                if (!nodeJson.contains("id") || !nodeJson["id"].is_string()) {
                    continue;
                }
                node.id = nodeJson["id"].get<string>();
                
                if (nodeJson.contains("data") && nodeJson["data"].is_object()) {
                    const auto& data = nodeJson["data"];
                    
                    if (data.contains("cvNodeType") && data["cvNodeType"].is_number()) {
                        int cvNodeTypeInt = data["cvNodeType"].get<int>();
                        node.cvNodeType = static_cast<CvNodeType>(cvNodeTypeInt);
                    }
                    
                    if (data.contains("params") && data["params"].is_object()) {
                        const auto& params = data["params"];

                        for (auto it = params.begin(); it != params.end(); ++it) {
                            string key = it.key();
                            string value;
                            
                            // kinda hacky i think
                            if (it.value().is_number_integer()) {
                                value = to_string(it.value().get<int>());
                            } else if (it.value().is_number_float()) {
                                value = to_string(it.value().get<double>());
                            } else if (it.value().is_string()) {
                                value = it.value().get<string>();
                            } else if (it.value().is_boolean()) {
                                value = it.value().get<bool>() ? "true" : "false";
                            } else {
                                value = it.value().dump();
                            }
                            
                            node.params[key] = value;
                        }
                    }
                }
                
                nodes.push_back(node);
            }
        }
        
        if (j.contains("edges") && j["edges"].is_array()) {
            for (const auto& edgeJson : j["edges"]) {
                PipelineEdge edge;
                
                if (edgeJson.contains("source") && edgeJson["source"].is_string() &&
                    edgeJson.contains("target") && edgeJson["target"].is_string()) {
                    edge.source = edgeJson["source"].get<string>();
                    edge.target = edgeJson["target"].get<string>();
                    edges.push_back(edge);
                }
            }
        }
        
        return !nodes.empty();
    } catch (const json::parse_error& e) {
        cerr << "JSON parse error: " << e.what() << endl;
        return false;
    } catch (const json::type_error& e) {
        cerr << "JSON type error: " << e.what() << endl;
        return false;
    } catch (const exception& e) {
        cerr << "Error parsing pipeline JSON: " << e.what() << endl;
        return false;
    }
}

unordered_map<string, vector<string>> buildGraph(const vector<PipelineNode>& nodes, const vector<PipelineEdge>& edges) {
	// takes nodes list and edges list, and then constructs a graph
    unordered_map<string, vector<string>> graph;
    
    for (const auto& node : nodes) {
        graph[node.id] = vector<string>();
    }
    
    for (const auto& edge : edges) {
        if (graph.find(edge.source) != graph.end()) {
            graph[edge.source].push_back(edge.target);
        }
    }
    
    return graph;
}

unordered_map<string, PipelineNode> buildNodeMap(const vector<PipelineNode>& nodes) {
    unordered_map<string, PipelineNode> nodeMap;
    for (const auto& node : nodes) {
        nodeMap[node.id] = node;
    }
    return nodeMap;
}

string findStartNode(const unordered_map<string, PipelineNode>& nodeMap, const vector<PipelineEdge>& edges) {
    // collect all target nodes (nodes that have incoming edges)
    unordered_set<string> targets;
    for (const auto& edge : edges) {
        targets.insert(edge.target);
    }
    
    // find the first node that's not a target (has no incoming edges)
	// in the future, we might want to consider multiple sources
    for (const auto& [id, node] : nodeMap) {
        if (targets.find(id) == targets.end()) {
            return id;
        }
    }
    
	// fallback, shouldn't ever happen
    if (!nodeMap.empty()) {
        return nodeMap.begin()->first;
    }
    
    return "";
}

// ====================================================================================================
// EXECUTION

cv::Mat executeCvOperation(const PipelineNode& node, const cv::Mat& input) {
    switch (node.cvNodeType) {
        case CvNodeType::Source:
            return input.clone();
        case CvNodeType::Blur: {
            int size = stoi(node.params.at("size"));
            return blur(input, size);
        }
        case CvNodeType::DeepFry:
            return deepfry(input);
        case CvNodeType::Output:
            return input.clone();
        default:
            return input.clone();
    }
}

cv::Mat processNode(
    const string& nodeId,
    const cv::Mat& input,
    const unordered_map<string, PipelineNode>& nodeMap,
    const unordered_map<string, vector<string>>& graph
) {
    if (nodeMap.find(nodeId) == nodeMap.end()) {
        cerr << "Warning: Node " << nodeId << " not found, returning input" << endl;
        return input.clone();
    }
    
    const auto& node = nodeMap.at(nodeId);
    
    cv::Mat output = executeCvOperation(node, input);
    
    // if this is an output node, return the result
    if (node.cvNodeType == CvNodeType::Output) {
        return output;
    }
    
    // recursively process all outgoing edges (target nodes)
    if (graph.find(nodeId) != graph.end()) {
        const auto& outgoingEdges = graph.at(nodeId);
        
        if (!outgoingEdges.empty()) {
            // default behavior is use the last output's result, prob change this in the future
            cv::Mat finalOutput = output;
            for (const auto& targetNodeId : outgoingEdges) {
                finalOutput = processNode(targetNodeId, output, nodeMap, graph);
            }
            return finalOutput;
        }
    }
    
    // No outgoing edges, return the processed output
    return output;
}


int main(int argc, char* argv[]) {
	auto startTime = chrono::high_resolution_clock::now();

	string outputDir;
	vector<string> imagePaths;
	string pipelineJson;

	// parse input and output directories
	for (int i = 1; i < argc; i++) {
        string arg = argv[i];

        if (arg == "--output" && i + 1 < argc) {
            outputDir = argv[++i];
        } else if (arg == "--input") {
            for (int j = i + 1; j < argc; j++) {
                string nextArg = argv[j];
                if (nextArg == "--pipeline" || nextArg == "--output") {
                    break;
                }
                imagePaths.push_back(nextArg);
            }
        } else if (arg == "--pipeline" && i + 1 < argc) {
            pipelineJson = argv[++i];
        }
    }

    if (outputDir.empty() || imagePaths.empty()) {
        cerr << "Usage: program --output <outputDir> --input <image1> [image2 ...] [--pipeline <pipelineJson>]" << endl;
        return 1;
    }
    if (!fs::exists(outputDir)) {fs::create_directories(outputDir);}

	// parse pipeline
    vector<PipelineNode> nodes;
    vector<PipelineEdge> edges;
    unordered_map<string, PipelineNode> nodeMap;
    unordered_map<string, vector<string>> graph;
    string startNodeId;

	if (parsePipeline(pipelineJson, nodes, edges)) {
		nodeMap = buildNodeMap(nodes);
		graph = buildGraph(nodes, edges);
		startNodeId = findStartNode(nodeMap, edges);
		cout << "Pipeline parsed: " << nodes.size() << " nodes, " << edges.size() << " edges" << endl;
		cout << "Starting from node: " << startNodeId << endl;
	} else {
		cerr << "Warning: Failed to parse pipeline JSON, falling back to default processing" << endl;
	}
    
	// run pipeline
	for (const auto& imagePath : imagePaths) {
        fs::path inputPath(imagePath);
        string filename = inputPath.filename().string();
        string outputPath = (fs::path(outputDir) / filename).string();

        cout << "Processing: " << imagePath << " -> " << outputPath << endl;

        cv::Mat image = cv::imread(imagePath);
        if (image.empty()) {
            cerr << "Failed to read image: " << imagePath << endl;
            continue;
        }

        cv::Mat result;
        
        if (!startNodeId.empty() && nodeMap.find(startNodeId) != nodeMap.end()) {
            result = processNode(startNodeId, image.clone(), nodeMap, graph);
        }

        if (!cv::imwrite(outputPath, result)) {
            cerr << "Failed to save: " << outputPath << endl;
        }
    }

	return 0;
}