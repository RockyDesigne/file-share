package com.titu.file_share.services;

import com.titu.file_share.models.TurnProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TurnCredentialService {

    public record IceServer(List<String> urls, String username, String credential) {}
    public record IceResponse(List<IceServer> iceServers, long expiresAtEpoch) {}

    private final TurnProperties props;

    public IceResponse buildIceResponse(String subjectOrNonce) {
        long exp = Instant.now().getEpochSecond() + props.getTtlSeconds();
        String username = exp + ":" + subjectOrNonce;
        String credential = hmacSha1Base64(username, props.getSecret());

        List<IceServer> iceServers = List.of(
                new IceServer(List.of("stun:" + props.getHost() + ":" + props.getUdpPort()), null, null),
                new IceServer(List.of("stuns:" + props.getHost() + ":" + props.getTlsPort()), null, null),
                new IceServer(List.of(
                        "turn:"  + props.getHost() + ":" + props.getUdpPort() + "?transport=udp",
                        "turn:"  + props.getHost() + ":" + props.getUdpPort() + "?transport=tcp",
                        "turns:" + props.getHost() + ":" + props.getTlsPort() + "?transport=tcp"
                ), username, credential)
        );

        return new IceResponse(iceServers, exp);
    }

    private String hmacSha1Base64(String message, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC", e);
        }
    }
}
