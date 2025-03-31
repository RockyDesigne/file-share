package com.titu.file_share.controllers;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.models.FileData;
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
    public ResponseEntity<String> publishFile(@RequestBody FileDataDTO fileDataDTO) {
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

    @DeleteMapping("/remove-file")
    public ResponseEntity<String> removeFile(@RequestBody FileDataDTO fileDataDTO) {
        try {
            fileService.removeFile(fileDataDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity
                .ok("File: " +
                        fileDataDTO.getName() +
                        " was successfully removed!");
    }

    @PutMapping("/update-file")
    public ResponseEntity<String> updateFile(@RequestBody FileDataDTO fileDataDTO) {
        try {
            fileService.updateFile(fileDataDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity
                .ok("File: " +
                        fileDataDTO.getName() +
                        " was successfully updated!");
    }

    @GetMapping("/files")
    @Operation(description = "returns all the files that a user has published")
    public ResponseEntity<List<FileDataDTO>> getUserFiles(@RequestParam(name = "username") String username) {
        return ResponseEntity.ok(fileService.getUserFiles(username));
    }

    @GetMapping("/get-pusblished-files")
    public ResponseEntity<List<FileDataDTO>> getFiles() {
        return ResponseEntity.ok(
            fileService.getFiles().stream().map(f -> FileDataDTO.builder()
                .name(f.getName())
                .size(f.getSize())
                .type(f.getType())
                .lastModified(f.getLastModified())
                .userName(f.getUser().getUsername())
                .build()).toList());
    }

}
