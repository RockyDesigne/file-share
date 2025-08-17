package com.titu.file_share.controllers;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.services.FileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/file-management")
@RequiredArgsConstructor
@Log4j2
public class FileController {

    private final FileService fileService;

    @PostMapping("/add-file")
    public ResponseEntity<String> publishFile(@RequestBody List<FileDataDTO> fileDataDTO) {
        try {
            return ResponseEntity.ok(fileService.publishFiles(fileDataDTO));
        } catch (Exception e) {
            log.error(e);
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }
    }

    @DeleteMapping("/remove-file")
    public ResponseEntity<String> removeFile(@RequestBody List<FileDataDTO> fileDataDTO) {
        try {
            fileDataDTO
            .forEach(fileService::removeFile);
        } catch (Exception e) {
            log.error(e);
            return ResponseEntity
                    .internalServerError()
                    .body(e.getMessage());
        }

        return ResponseEntity
                .ok("file list removed success...");
    }

    @GetMapping("/files")
    @Operation(description = "returns all the files that a user has published")
    public ResponseEntity<List<FileDataDTO>> getUserFiles(@RequestParam(name = "username") String username) {
        return ResponseEntity.ok(fileService.getUserFiles(username));
    }

    @GetMapping("/get-published-files")
    public ResponseEntity<List<FileDataDTO>> getFiles(@RequestParam String reg) {
        return ResponseEntity.ok(fileService.getUserFiles(reg));
    }

    @DeleteMapping("/delete-all-files")
    public ResponseEntity<String> deleteAllFiles() {
        fileService.deleteAllFiles();
        return ResponseEntity.ok("ok");
    }

}
