package com.titu.file_share.services;

import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.models.User;
import com.titu.file_share.repositories.FileRepository;
import com.titu.file_share.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class UserService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public String getUserPublicKey(String username) {
        return userRepository.findById(username).orElseThrow().getPublicKey();
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllActiveUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    return UserDTO.builder()
                            .username(u.getUsername())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllActiveUsers(Pageable pageable) {
        return new PageImpl<UserDTO>(userRepository.findAll(pageable).stream()
                .map(u -> {
                    return UserDTO.builder()
                            .username(u.getUsername())
                            .build();
                })
                .toList());
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
                    .publicKey(userDTO.getPublicKey())
                    .registerDate(System.currentTimeMillis())
                    .role(userDTO.getRole())
                    .build());
        } catch (Exception e) {
            log.error(e);
            throw new RuntimeException(e);
        }
    }

    @Transactional
    public void updateUser(UserDTO userDTO) {
        try {
            userRepository.save(User.builder()
                    .password(bCryptPasswordEncoder.encode(userDTO.getPassword()))
                    .username(userDTO.getUsername())
                    .publicKey(userDTO.getPublicKey())
                    .registerDate(System.currentTimeMillis())
                    .role(userDTO.getRole())
                    .build());
        } catch (Exception e) {
            log.error(e);
            throw new RuntimeException(e);
        }
    }

    @Transactional(readOnly = true)
    public String authenticate(UserDTO userDTO) {
        User user;
        try {
            user = userRepository.getReferenceById(userDTO.getUsername());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        if (!bCryptPasswordEncoder.matches(userDTO.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return jwtService.generateToken(user);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void purgeOldUsers() {
        log.info("Purging old users...");
        long cutoff = System.currentTimeMillis() - Duration.ofDays(1).toMillis();
        fileRepository.deleteByUsersOlderThan(cutoff);
        userRepository.deleteByRegisterDateLessThanEqual(cutoff);
    }

}
