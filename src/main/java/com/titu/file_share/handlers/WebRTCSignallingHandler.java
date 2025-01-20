package com.titu.file_share.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.titu.file_share.dtos.WebSocketMessage;
import lombok.Getter;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

@Component
@Log4j2
public class WebRTCSignallingHandler extends TextWebSocketHandler {

    @Getter
    private final ConcurrentHashMap<String, WebSocketSession> registeredSessions;
    //private final ConcurrentHashMap<String, WebSocketSession> unregisteredSessions;

    public WebRTCSignallingHandler() {
        this.registeredSessions = new ConcurrentHashMap<>();
        //this.unregisteredSessions = new ConcurrentHashMap<>();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        //unregisteredSessions.put(session.getId(), session);
        log.info("Unregistered Client: {} connected!", session.getId());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {

        ObjectMapper objectMapper = new ObjectMapper();
        WebSocketMessage webSocketMessage;

        try {
            webSocketMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
        } catch (Exception e) {
            log.error("Error parsing ws message: {}", e.toString());
            return;
        }

        if (webSocketMessage.getType().equals("register")) {
            registeredSessions.put(webSocketMessage.getUsername(), session);
            //unregisteredSessions.remove(session.getId());
        }

//        registeredSessions.forEach((key, value) -> {
//            if (!key.equals(session.getId())) {
//                try {
//                    value.sendMessage(message);
//                } catch (IOException ex) {
//                    throw new RuntimeException(ex);
//                }
//            }
//        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        registeredSessions.remove(session.getId());
        log.info("Client: {} disconected", session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        registeredSessions.remove(session.getId());
        log.info("Transport error: {}", exception.toString());
    }
}
