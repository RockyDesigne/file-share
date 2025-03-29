package com.titu.file_share.dtos;

import com.titu.file_share.enums.MessageType;
import lombok.Data;

@Data
public class WebSocketMessage {
    private String type;
    private String senderUsername;
    private String receiverUsername;
    private String message;
}
