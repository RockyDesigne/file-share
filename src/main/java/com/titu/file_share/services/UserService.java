package com.titu.file_share.services;

import com.titu.file_share.Utils.JwtUtil;
import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.handlers.WebRTCSignallingHandler;
import com.titu.file_share.models.User;
import com.titu.file_share.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final WebRTCSignallingHandler webRTCSignallingHandler;

    public List<String> getAllActiveUsers() {
        return webRTCSignallingHandler.getRegisteredSessions().keySet().stream().toList();
    }

    @Transactional(readOnly = true)
    public User getUser(String username) {
        return userRepository.getReferenceById(username);
    }

    @Transactional(readOnly = true)
    public List<String> getAllUserNames() {
        return userRepository.getAllUsernames();
    }

    @Transactional
    public void registerUser(UserDTO userDTO) {
        if (userRepository.existsById(userDTO.getUsername())) {
            throw new RuntimeException("Error: username already exists!");
        }
        try {
            userRepository.save(User.builder()
                    .password(bCryptPasswordEncoder.encode(userDTO.getPassword()))
                    .username(userDTO.getUsername())
                    .build());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String authenticate(UserDTO userDTO) {
        User user = null;
        try {
            user = userRepository.getReferenceById(userDTO.getUsername());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        if (!bCryptPasswordEncoder.matches(userDTO.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return JwtUtil.generateToken(user);
    }

}
