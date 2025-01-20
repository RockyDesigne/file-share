package com.titu.file_share.dtos;

import lombok.Data;

@Data
public class WebSocketMessage {
    private String type;
    private String username;
}
