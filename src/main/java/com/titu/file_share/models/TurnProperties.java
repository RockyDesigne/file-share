package com.titu.file_share.models;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "turn")
@Getter
@Setter
public class TurnProperties {
    private String host;
    private String secret;
    private int udpPort;
    private int tlsPort;
    private long ttlSeconds;
}
