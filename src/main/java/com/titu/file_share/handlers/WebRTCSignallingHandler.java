package com.titu.file_share.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.titu.file_share.dtos.WebSocketMessage;
import lombok.Getter;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.CloseStatus;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Log4j2
@Component
public class WebRTCSignallingHandler extends TextWebSocketHandler {

    @Getter
    private final ConcurrentHashMap<String, WebSocketSession> registeredSessions;
    private final ObjectMapper objectMapper;
    private final Object sendLock = new Object(); // Lock for synchronizing message sending

    public WebRTCSignallingHandler() {
        this.registeredSessions = new ConcurrentHashMap<>();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("Unregistered Client: {} connected!", session.getId());
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            WebSocketMessage webSocketMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            String type = webSocketMessage.getType();
            log.info("Received message type: {} from: {}", type, webSocketMessage.getSenderUsername());

            switch (type) {
                case "register":
                    handleRegister(webSocketMessage, session);
                    break;
                case "offer":
                    forwardToReceiver(webSocketMessage);
                    break;
                case "answer":
                    forwardToReceiver(webSocketMessage);
                    break;
                case "iceCandidate":
                    forwardToReceiver(webSocketMessage);
                    break;
                default:
                    log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error handling message: {}", message.getPayload(), e);
        }
    }

    private void handleRegister(WebSocketMessage message, WebSocketSession session) {
        registeredSessions.put(message.getSenderUsername(), session);
        log.info("User {} registered", message.getSenderUsername());
    }

    private void forwardToReceiver(WebSocketMessage message) throws IOException {
        WebSocketSession receiverSession = registeredSessions.get(message.getReceiverUsername());
        if (receiverSession != null && receiverSession.isOpen()) {
            String messageJson = objectMapper.writeValueAsString(message);
            synchronized (sendLock) {
                receiverSession.sendMessage(new TextMessage(messageJson));
            }
            log.info("Forwarded {} message from {} to {}", 
                    message.getType(), 
                    message.getSenderUsername(), 
                    message.getReceiverUsername());
        } else {
            log.warn("Receiver {} not found or connection closed", message.getReceiverUsername());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Remove the session from registeredSessions
        registeredSessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
        log.info("Client: {} disconnected", session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.info("Transport error: {}", exception.getMessage());
        // Remove the session from registeredSessions
        registeredSessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
        log.info("Client: {} disconnected", session.getId());
    }
}
