package com.titu.file_share.controllers;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.models.FileData;
import com.titu.file_share.services.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/user-management")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/publish-file")
    public ResponseEntity<String> publishFile(FileDataDTO fileDataDTO) {
        FileData fileData = null;
        try {
            fileData = fileService.publishFile(fileDataDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity
                .ok("File: " +
                        fileData.getName() +
                        " was successfully published!");
    }

    @GetMapping("/get-pusblished-files")
    public ResponseEntity<List<FileData>> getFiles() {
        List<FileData> files = null;
        try {
            files = fileService.getFiles();
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(null);
        }

        return ResponseEntity.ok(files);
    }

}
