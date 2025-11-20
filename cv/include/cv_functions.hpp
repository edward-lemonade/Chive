#ifndef NODE_FUNCTIONS_H
#define NODE_FUNCTIONS_H

#include <opencv2/opencv.hpp>

cv::Mat blur(const cv::Mat& input, int size);
cv::Mat deepfry(const cv::Mat& input);

#endif