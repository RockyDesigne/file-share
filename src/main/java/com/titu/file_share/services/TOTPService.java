package com.titu.file_share.services;

import de.taimos.totp.TOTP;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.binary.Base32;
import org.apache.commons.codec.binary.Hex;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

@RequiredArgsConstructor
public class TOTPService {
    public static final int KEY_LEN = 20;
    public static final String ISSUER = "TITU";
    private final SecureRandom secureRandom;
    private final Base32 base32;

    public String generateSecretKey() {
        byte[] bytes = new byte[KEY_LEN];
        secureRandom.nextBytes(bytes);
        return base32.encodeToString(bytes);
    }

    public String getTOTPCode(String secretKey) {
        byte[] bytes = base32.decode(secretKey);
        String hexKey = Hex.encodeHexString(bytes);
        return TOTP.getOTP(hexKey);
    }

    public String getGoogleAuthenticatorBarCodeData(String secretKey, String account, String issuer) {
        return "otpauth://totp/"
                + URLEncoder.encode(issuer + ":" + account, StandardCharsets.UTF_8).replace("+", "%20")
                + "?secret=" + URLEncoder.encode(secretKey, StandardCharsets.UTF_8).replace("+", "%20")
                + "&issuer=" + URLEncoder.encode(issuer, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
