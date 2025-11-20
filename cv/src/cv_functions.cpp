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

using namespace std;

cv::Mat blur(const cv::Mat& input, int size) {
    if (input.empty()) {
        cerr << "Error: empty image passed" << endl;
        return {};
    }

    if (size <= 0) {
        cerr << "Error: blur size must be > 0" << endl;
        return input.clone();
    }

    cv::Mat output;
    cv::blur(input, output, cv::Size(size, size));
    return output;
}

cv::Mat deepfry(const cv::Mat& input) {
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
