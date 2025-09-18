package com.titu.file_share.controllers;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.services.FileService;
import com.titu.file_share.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.SortDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/main-controller")
@RequiredArgsConstructor
@Log4j2
public class MainController {
    private final UserService userService;
    private final FileService fileService;
    @PostMapping("/register-user")
    @Operation(description = "registers a user and saves him to the db")
    public ResponseEntity<String> registerUser(@RequestBody UserDTO userDTO) {
        try {
            userService.registerUser(userDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.getMessage());
        }

        return ResponseEntity.ok("User: " + userDTO.getUsername() + " registered successfully");
    }

    @PostMapping("/update-user")
    @Operation(description = "registers a user and saves him to the db")
    public ResponseEntity<String> updateUser(@RequestBody UserDTO userDTO) {
        try {
            userService.updateUser(userDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.getMessage());
        }

        return ResponseEntity.ok("User: " + userDTO.getUsername() + " registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserDTO userDTO) {

        String token = null;

        try {
            token = userService.authenticate(userDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity.ok(token);
    }
    @Operation(summary = "Upload a file")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "File uploaded success!"),
            @ApiResponse(responseCode = "500", description = "Error uploading file!")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> upload(
            @Parameter(description = "The file to upload", required = true)
            @RequestParam("file") MultipartFile file,
            @RequestParam("username") String username) {
        try {
            log.info("Received file {}", file.getResource().getFilename());
            fileService.upload(file, username);
            log.info("Finished uploading file {}", file.getResource().getFilename());
            return new ResponseEntity<>("File processed successfully.", HttpStatus.OK);
        } catch (Exception e) {
            log.error(e);
            return new ResponseEntity<>("Error processing file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @Operation(summary = "Downloads a file or list of files")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "File(s) downloaded success!"),
            @ApiResponse(responseCode = "500", description = "Error downloading file!")
    })
    @GetMapping(
            value = "/download",
            produces = MediaType.APPLICATION_OCTET_STREAM_VALUE
    )
    public ResponseEntity<byte[]> download(
            @Parameter(description = "The file to download", required = true)
            @RequestParam("file_name") String fileName,
            @Parameter(description = "The user to which the file belongs", required = true)
            @RequestParam("user_name") String userName) throws IOException {
        try {
            log.info("Downloading file: {}...", fileName);
            try (var out = fileService.download(fileName, userName)) {
                return ResponseEntity.ok().body(out.readAllBytes());
            }
        } catch (Exception e) {
            log.error(e);
            throw e;
        }
    }
    @GetMapping("/published-files-page")
    public ResponseEntity<Page<FileDataDTO>> getFiles(@RequestParam String username, @SortDefault(sort = "name", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(fileService.getUserFiles(username, pageable));
    }
    @GetMapping("/user-list-page")
    public ResponseEntity<Page<UserDTO>> getUserList(@SortDefault(sort = "username", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllActiveUsers(pageable));
    }

}
