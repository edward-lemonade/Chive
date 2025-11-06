#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>
#include <unordered_map>

using namespace std;

int main(int argc, char* argv[]) {
	unordered_map<std::string, std::string> args;

    for (int i = 1; i < argc - 1; i += 2) {
        string key = argv[i];
        string value = argv[i + 1];
        args[key] = value;
    }
}