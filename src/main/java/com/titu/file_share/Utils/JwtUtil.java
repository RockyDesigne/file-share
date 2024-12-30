package com.titu.file_share.Utils;

import com.titu.file_share.models.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.util.Date;

public class JwtUtil {

    private static final String SECRET = "secret_key_1234";

    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 8; // 8 hours

    public static String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(Keys.hmacShaKeyFor(user.getPassword().getBytes()))
                .compact();
    }
}
