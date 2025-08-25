package com.titu.file_share.services;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {
    private static final long EXPIRATION_MS = 8 * 60 * 60 * 1000L; // 8h

    private final Key signingKey; // computed once

    public JwtService(@Value("${security.jwt.hmac-secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .header().type("JWT").and()
                .issuer("https://secure-file-share.dedyn.io")
                .audience().add("fileshare-api").and()
                .subject(username)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(new Date(now.toEpochMilli() + EXPIRATION_MS))
                .claims(Map.of("scope", "fileshare"))
                .signWith(signingKey) // reused, not recomputed
                .compact();
    }
}
