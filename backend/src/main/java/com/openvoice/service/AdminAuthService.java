package com.openvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminAuthService {

    private static final Duration TOKEN_TTL = Duration.ofHours(12);

    @Value("${openvoice.admin.username}")
    private String adminUsername;

    @Value("${openvoice.admin.password}")
    private String adminPassword;

    private final Map<String, Instant> activeTokens = new ConcurrentHashMap<>();

    public String login(String username, String password) {
        String normalizedUser = username == null ? "" : username.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        if (!adminUsername.equals(normalizedUser) || !adminPassword.equals(normalizedPassword)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials");
        }

        String token = UUID.randomUUID().toString();
        activeTokens.put(token, Instant.now().plus(TOKEN_TTL));
        return token;
    }

    public void requireAdmin(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        Instant expiresAt = activeTokens.get(token);
        if (expiresAt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin login required");
        }
        if (Instant.now().isAfter(expiresAt)) {
            activeTokens.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin session expired");
        }
    }

    public void logout(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        activeTokens.remove(token);
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authorization token");
        }
        String prefix = "Bearer ";
        if (!authorizationHeader.startsWith(prefix) || authorizationHeader.length() <= prefix.length()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization header");
        }
        return authorizationHeader.substring(prefix.length()).trim();
    }
}
