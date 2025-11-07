package utils

import (
	"archive/zip"
	"bytes"
	"io"
	"os"
	"path/filepath"
)

func CreateZipFromFiles(filePaths []string) (*bytes.Buffer, error) {
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)
	defer zipWriter.Close()

	for _, path := range filePaths {
		file, err := os.Open(path)
		if err != nil {
			return nil, err
		}
		defer file.Close()

		// Get file info for the header
		info, err := file.Stat()
		if err != nil {
			return nil, err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return nil, err
		}

		// Use base name for the file in the ZIP
		header.Name = filepath.Base(path)
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return nil, err
		}

		_, err = io.Copy(writer, file)
		if err != nil {
			return nil, err
		}
	}

	return buf, nil
}
