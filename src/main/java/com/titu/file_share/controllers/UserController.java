package com.titu.file_share.controllers;

import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.models.FileData;
import com.titu.file_share.models.User;
import com.titu.file_share.repositories.FileRepository;
import com.titu.file_share.repositories.UserRepository;
import com.titu.file_share.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/user-management")
@RequiredArgsConstructor
@Log4j2
public class UserController {

    private final UserService userService;
//    private final UserRepository userRepository;
//    private final FileRepository fileRepository;

//    @GetMapping("/active-user-list")
//    @Operation(description = "returns a list of all online users")
//    public ResponseEntity<List<String>> getAllActiveUsers() {
//        return ResponseEntity.ok(userService.getAllActiveUsers());
//    }
//
//    @GetMapping("/user-list")
//    @Operation(description = "returns a list of all usernames")
//    public ResponseEntity<List<String>> getAllUsernames() {
//        return ResponseEntity.ok(userService.getAllUserNames());
//    }

    @GetMapping("/user-key")
    @Operation(description = "returns the user's public key")
    public ResponseEntity<String> getUserPublicKey(@RequestParam(name = "username") String username) {
        try {
            return ResponseEntity.ok(userService.getUserPublicKey(username));
        } catch (Exception e) {
            log.error(e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

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

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserDTO userDTO) {

        String token = null;

        try {
            token = userService.authenticate(userDTO);
            userService.updateUser(userDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity.ok(token);
    }

//    @PostMapping("/test")
//    public void test() {
//        try {
//            User u = userRepository.save(User.builder()
//                    .password("test")
//                    .username("test")
//                    .publicKey("test")
//                    .registerDate(System.currentTimeMillis() - Duration.ofDays(1).toMillis())
//                    .build());
//            FileData f = fileRepository.save(FileData.builder()
//                    .name("testFile")
//                    .user(u)
//                    .size(123L)
//                    .hash("123")
//                    .lastModified(123L)
//                    .sharedAt(System.currentTimeMillis())
//                    .signature("123")
//                    .filesRegistrationNumber("123")
//                    .build());
//        } catch (Exception e) {
//            log.error(e);
//            throw new RuntimeException(e);
//        }
//    }
//    @PostMapping("purgeTest")
//    public void t() {
//        userService.purgeOldUsers();
//    }
}
