package com.titu.file_share.controllers;

import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-management")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/user-list")
    @Operation(description = "returns a list of all usernames")
    public ResponseEntity<List<String>> getAllUsernames() {
        return ResponseEntity.ok(userService.getAllUserNames());
    }

    @PostMapping("/register-user")
    @Operation(description = "registers a user and saves him to the db")
    public ResponseEntity<String> registerUser(@RequestBody UserDTO userDTO) {
        try {
            userService.registerUser(userDTO);
        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .body(e.toString());
        }

        return ResponseEntity.ok("User: " + userDTO.getUsername() + " registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(UserDTO userDTO) {

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


}
