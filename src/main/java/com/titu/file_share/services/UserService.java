package com.titu.file_share.services;

import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.titu.file_share.Utils.JwtUtil;
import com.titu.file_share.dtos.UserDTO;
import com.titu.file_share.handlers.WebRTCSignallingHandler;
import com.titu.file_share.models.User;
import com.titu.file_share.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.codec.binary.Base64OutputStream;
import org.springframework.jdbc.datasource.embedded.OutputStreamFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Log4j2
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final WebRTCSignallingHandler webRTCSignallingHandler;
    private final TOTPService totpService;
    private final QRCodeService qrCodeService;

    public String getUserPublicKey(String username) {
        return userRepository.findById(username).orElseThrow().getPublicKey();
    }

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
    public User registerUser(UserDTO userDTO) {
        if (userRepository.existsById(userDTO.getUsername())) {
            throw new RuntimeException("Error: username already exists!");
        }
        try {
            return userRepository.save(User.builder()
                    .password(bCryptPasswordEncoder.encode(userDTO.getPassword()))
                    .username(userDTO.getUsername())
                    .publicKey(userDTO.getPublicKey())
                    .totpSecretKey(totpService.generateSecretKey())
                    .build());
        } catch (Exception e) {
            log.error(e);
            throw new RuntimeException(e);
        }
    }

    @Transactional
    public void updateUser(UserDTO userDTO) {
        try {
            User user = userRepository.getReferenceById(userDTO.getUsername());
            user.setPublicKey(userDTO.getPublicKey());
            userRepository.save(user);
        } catch (Exception e) {
            log.error(e);
            throw new RuntimeException(e);
        }
    }

    @Transactional(readOnly = true)
    public String getUserSecretCode(String username) throws NoSuchElementException {
        User user = userRepository.findById(username).orElseThrow();
        return totpService.getTOTPCode(user.getTotpSecretKey());
    }

    @Transactional(readOnly = true)
    public String getUserSecretKey(String username) {
        User user = userRepository.findById(username).orElseThrow();
        return user.getTotpSecretKey();
    }

    public void authenticateCredentials(UserDTO userDTO) {
        User user = null;
        try {
            user = userRepository.getReferenceById(userDTO.getUsername());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        if (!bCryptPasswordEncoder.matches(userDTO.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
    }

    @Transactional(readOnly = true)
    public String getToken(String username) throws NoSuchElementException {
        return JwtUtil.generateToken(
                userRepository.findById(username).orElseThrow()
        );
    }

    public String getQrCode(String username) throws IOException {
        String secretKey = getUserSecretKey(username);

        String barCodeData = totpService.getGoogleAuthenticatorBarCodeData(secretKey, username, TOTPService.ISSUER);

        BitMatrix bitMatrix = qrCodeService.getQrCode(barCodeData, 200, 200);

        return qrCodeService.qrCodeImageToBase64String(bitMatrix, "png");

    }

}
