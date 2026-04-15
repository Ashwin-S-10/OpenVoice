package com.openvoice.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openvoice.model.ChatMessage;
import com.openvoice.model.Message;
import com.openvoice.service.BlockService;
import com.openvoice.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private static final int SEND_TIME_LIMIT_MS = 20000;
    private static final int SEND_BUFFER_SIZE_BYTES = 512 * 1024;

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final BlockService blockService;

    private final ConcurrentHashMap<Long, Set<WebSocketSession>> groupSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> sessionGroups = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, WebSocketSession> safeSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> sessionAliases = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ObjectMapper objectMapper, MessageService messageService, BlockService blockService) {
        this.objectMapper = objectMapper;
        this.messageService = messageService;
        this.blockService = blockService;
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        unregisterSession(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) {
        try {
            ChatMessage payload = objectMapper.readValue(textMessage.getPayload(), ChatMessage.class);
            if (payload.getType() == null) {
                return;
            }

            logger.info("WS {} session={} group={}", payload.getType(), session.getId(), payload.getGroupId());

            switch (payload.getType()) {
                case JOIN_GROUP -> handleJoin(session, payload);
                case LEAVE_GROUP -> unregisterSession(session);
                case SEND_MESSAGE -> handleSend(session, payload);
            }
        } catch (Exception ex) {
            logger.warn("Failed to process WebSocket message for session {}", session.getId(), ex);
        }
    }

    private void handleJoin(WebSocketSession session, ChatMessage payload) {
        if (payload.getGroupId() == null) {
            return;
        }

        String alias = resolveAliasForSession(session, payload.getAlias());
        if (blockService.isBlocked(payload.getGroupId(), alias)) {
            sendError(session, "USER_BLOCKED", "You are blocked from this group");
            return;
        }

        unregisterSession(session);
        WebSocketSession safeSession = safeSessions.computeIfAbsent(
                session.getId(),
                key -> new ConcurrentWebSocketSessionDecorator(session, SEND_TIME_LIMIT_MS, SEND_BUFFER_SIZE_BYTES)
        );
        long groupId = payload.getGroupId();
        groupSessions.computeIfAbsent(groupId, key -> ConcurrentHashMap.newKeySet()).add(safeSession);
        sessionGroups.put(session.getId(), groupId);
        sessionAliases.put(session.getId(), alias);
    }

    private void handleSend(WebSocketSession session, ChatMessage payload) throws IOException {
        Long groupId = payload.getGroupId();
        if (groupId == null) {
            groupId = sessionGroups.get(session.getId());
        }
        if (groupId == null) {
            return;
        }

        String alias = resolveAliasForSession(session, payload.getAlias());
        if (blockService.isBlocked(groupId, alias)) {
            sendError(session, "USER_BLOCKED", "You are blocked from this group");
            return;
        }

        payload.setGroupId(groupId);
        payload.setAlias(alias);
        Message message = messageService.processIncoming(payload);
        if (message == null) {
            return;
        }

        String out = objectMapper.writeValueAsString(message);
        TextMessage outbound = new TextMessage(out);
        for (WebSocketSession groupSession : groupSessions.getOrDefault(groupId, Set.of())) {
            if (groupSession.isOpen()) {
                try {
                    groupSession.sendMessage(outbound);
                } catch (IOException ex) {
                    logger.warn("Failed to send message to session {}", groupSession.getId(), ex);
                    unregisterSession(groupSession);
                }
            }
        }
    }

    private void unregisterSession(WebSocketSession session) {
        String sessionId = session.getId();
        WebSocketSession safeSession = safeSessions.remove(sessionId);
        sessionAliases.remove(sessionId);
        Long previousGroup = sessionGroups.remove(sessionId);
        if (previousGroup != null) {
            Set<WebSocketSession> sessions = groupSessions.get(previousGroup);
            if (sessions != null) {
                if (safeSession != null) {
                    sessions.remove(safeSession);
                }
                sessions.remove(session);
                sessions.removeIf(candidate -> sessionId.equals(candidate.getId()));
                if (sessions.isEmpty()) {
                    groupSessions.remove(previousGroup);
                }
            }
        }
    }

    public void broadcastAdminEvent(String event, Object data) {
        Map<String, Object> payload = Map.of(
                "type", "ADMIN_EVENT",
                "event", event,
                "data", data
        );
        broadcastToAll(payload);
    }

    private void broadcastToAll(Map<String, Object> payload) {
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (IOException ex) {
            logger.warn("Failed to serialize admin event payload", ex);
            return;
        }

        TextMessage outbound = new TextMessage(json);
        for (WebSocketSession safeSession : safeSessions.values()) {
            if (!safeSession.isOpen()) {
                unregisterSession(safeSession);
                continue;
            }
            try {
                safeSession.sendMessage(outbound);
            } catch (IOException ex) {
                logger.warn("Failed to send admin event to session {}", safeSession.getId(), ex);
                unregisterSession(safeSession);
            }
        }
    }

    private void sendError(WebSocketSession session, String code, String message) {
        WebSocketSession safeSession = safeSessions.getOrDefault(session.getId(), session);
        if (!safeSession.isOpen()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "type", "ERROR",
                    "code", code,
                    "message", message
            ));
            safeSession.sendMessage(new TextMessage(json));
        } catch (IOException ex) {
            logger.warn("Failed to send websocket error to session {}", session.getId(), ex);
        }
    }

    private String resolveAliasForSession(WebSocketSession session, String incomingAlias) {
        String normalized = blockService.normalizeAlias(incomingAlias);
        if (!normalized.isEmpty()) {
            return normalized;
        }
        String fromSession = sessionAliases.get(session.getId());
        if (fromSession != null && !fromSession.isBlank()) {
            return fromSession;
        }
        String fallback = "guest-" + session.getId();
        return blockService.normalizeAlias(fallback);
    }
}