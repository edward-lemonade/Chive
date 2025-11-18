#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <unordered_map>
#include <filesystem>
#include <chrono>

#include <opencv2/opencv.hpp>

using namespace std;
namespace fs = std::filesystem;

// usage .\cv.exe --output <outputDir> --input <image1> [image2 ...]

cv::Mat deepfryImage(const cv::Mat& input) {
    if (input.empty()) {
        cerr << "Error: empty image passed" << endl;
        return {};
    }

    cv::Mat deepfried;
    input.convertTo(deepfried, -1, 2, 50); // increase contrast and brightness

    cv::Mat kernel = (cv::Mat_<float>(3, 3) <<
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0);
    cv::filter2D(deepfried, deepfried, deepfried.depth(), kernel); // sharpen

    cv::Mat hsv;
    cv::cvtColor(deepfried, hsv, cv::COLOR_BGR2HSV);
    std::vector<cv::Mat> channels;
    cv::split(hsv, channels);
    channels[1] = channels[1] * 2; // double saturation
    cv::merge(channels, hsv);
    cv::cvtColor(hsv, deepfried, cv::COLOR_HSV2BGR);

    deepfried = deepfried / 64 * 64 + 32; // posterization effect

    return deepfried;
}

int main(int argc, char* argv[]) {
	auto startTime = chrono::high_resolution_clock::now();

	string outputDir;
	vector<string> imagePaths;

	for (int i = 1; i < argc; i++) {
        string arg = argv[i];

        if (arg == "--output" && i + 1 < argc) {
            outputDir = argv[++i];
        } else if (arg == "--input") {
            for (int j = i + 1; j < argc; j++) {
                imagePaths.push_back(argv[j]);
            }
            break;
        }
    }

	for (int i = 0; i < imagePaths.size(); i++) {
		cout << imagePaths[i] << endl;
	}

    // input validation
    if (outputDir.empty() || imagePaths.empty()) {
        cerr << "Usage: program --output <outputDir> --input <image1> [image2 ...]" << endl;
        return 1;
    }
    if (!fs::exists(outputDir)) {fs::create_directories(outputDir);}

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

        cv::Mat result = deepfryImage(image);

        if (!cv::imwrite(outputPath, result)) {
            cerr << "Failed to save: " << outputPath << endl;
        }
    }

	return 0;
}