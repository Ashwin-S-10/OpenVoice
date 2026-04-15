package com.openvoice.controller;

import com.openvoice.model.Group;
import com.openvoice.service.AdminAuthService;
import com.openvoice.service.BlockService;
import com.openvoice.service.GroupService;
import com.openvoice.service.MessageService;
import com.openvoice.websocket.ChatWebSocketHandler;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final GroupService groupService;
    private final MessageService messageService;
    private final BlockService blockService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    public AdminController(
            AdminAuthService adminAuthService,
            GroupService groupService,
            MessageService messageService,
            BlockService blockService,
            ChatWebSocketHandler chatWebSocketHandler
    ) {
        this.adminAuthService = adminAuthService;
        this.groupService = groupService;
        this.messageService = messageService;
        this.blockService = blockService;
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> payload) {
        String username = payload.getOrDefault("username", "");
        String password = payload.getOrDefault("password", "");
        String token = adminAuthService.login(username, password);
        return Map.of("token", token, "role", "ADMIN");
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestHeader("Authorization") String authorizationHeader) {
        adminAuthService.logout(authorizationHeader);
        return Map.of("status", "ok");
    }

    @PostMapping("/groups")
    public Group createGroup(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, String> payload
    ) {
        adminAuthService.requireAdmin(authorizationHeader);
        String groupName = payload.getOrDefault("name", "").trim();
        Group group = groupService.createGroup(groupName);
        chatWebSocketHandler.broadcastAdminEvent("GROUP_CREATED", Map.of("group", group));
        return group;
    }

    @DeleteMapping("/groups/{groupId}")
    public Map<String, Object> deleteGroup(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable long groupId
    ) {
        adminAuthService.requireAdmin(authorizationHeader);
        boolean deleted = groupService.deleteGroup(groupId);
        if (!deleted) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        messageService.clearGroupCache(groupId);
        chatWebSocketHandler.broadcastAdminEvent("GROUP_DELETED", Map.of("groupId", groupId));
        return Map.of("groupId", groupId, "deleted", true);
    }

    @PostMapping("/blocks/global")
    public Map<String, Object> setGlobalBlock(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, Object> payload
    ) {
        adminAuthService.requireAdmin(authorizationHeader);
        String alias = String.valueOf(payload.getOrDefault("alias", "")).trim();
        boolean blocked = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("blocked", true)));

        blockService.setGlobalBlocked(alias, blocked);

        Map<String, Object> eventData = Map.of(
                "scope", "GLOBAL",
                "alias", blockService.normalizeAlias(alias),
                "blocked", blocked
        );
        chatWebSocketHandler.broadcastAdminEvent("USER_BLOCK_UPDATED", eventData);
        return eventData;
    }

    @PostMapping("/blocks/group")
    public Map<String, Object> setGroupBlock(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, Object> payload
    ) {
        adminAuthService.requireAdmin(authorizationHeader);

        Object groupIdRaw = payload.get("groupId");
        if (groupIdRaw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupId is required");
        }

        long groupId;
        try {
            groupId = Long.parseLong(String.valueOf(groupIdRaw));
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid groupId");
        }

        String alias = String.valueOf(payload.getOrDefault("alias", "")).trim();
        boolean blocked = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("blocked", true)));

        blockService.setGroupBlocked(groupId, alias, blocked);

        Map<String, Object> eventData = Map.of(
                "scope", "GROUP",
                "groupId", groupId,
                "alias", blockService.normalizeAlias(alias),
                "blocked", blocked
        );
        chatWebSocketHandler.broadcastAdminEvent("USER_BLOCK_UPDATED", eventData);
        return eventData;
    }
}
