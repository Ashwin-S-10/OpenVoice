package com.openvoice.service;

import com.openvoice.dao.MessageDao;
import com.openvoice.model.ChatMessage;
import com.openvoice.model.Message;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class MessageService {

    private static final int CACHE_LIMIT = 50;

    private final MessageDao messageDao;
    private final AliasService aliasService;
    private final AsyncMessagePersistenceService asyncMessagePersistenceService;

    private final Map<Long, Deque<Message>> recentMessages = new ConcurrentHashMap<>();
    private final Set<Long> initializedGroups = ConcurrentHashMap.newKeySet();

    public MessageService(
            MessageDao messageDao,
            AliasService aliasService,
            AsyncMessagePersistenceService asyncMessagePersistenceService
    ) {
        this.messageDao = messageDao;
        this.aliasService = aliasService;
        this.asyncMessagePersistenceService = asyncMessagePersistenceService;
    }

    public List<Message> getMessagesForGroup(long groupId) {
        if (!initializedGroups.contains(groupId)) {
            List<Message> fromDb = messageDao.findByGroupIdLimit(groupId, CACHE_LIMIT);
            Deque<Message> deque = new ConcurrentLinkedDeque<>(fromDb);
            recentMessages.put(groupId, deque);
            initializedGroups.add(groupId);
        }
        Deque<Message> cached = recentMessages.getOrDefault(groupId, new ConcurrentLinkedDeque<>());
        return new ArrayList<>(cached);
    }

    public Message processIncoming(ChatMessage chatMessage) {
        if (chatMessage.getGroupId() == null) {
            return null;
        }
        String content = chatMessage.getContent() == null ? "" : chatMessage.getContent().trim();
        if (content.isEmpty()) {
            return null;
        }

        Message message = new Message();
        message.setGroupId(chatMessage.getGroupId());
        message.setAliasName(resolveAlias(chatMessage.getAlias()));
        message.setContent(content);
        message.setCreatedAt(Instant.now());

        addToCache(message);
        asyncMessagePersistenceService.persist(message);
        return message;
    }

    private void addToCache(Message message) {
        Deque<Message> deque = recentMessages.computeIfAbsent(message.getGroupId(), key -> new ConcurrentLinkedDeque<>());
        deque.addLast(message);
        while (deque.size() > CACHE_LIMIT) {
            deque.pollFirst();
        }
        initializedGroups.add(message.getGroupId());
    }

    private String resolveAlias(String incomingAlias) {
        String alias = incomingAlias == null ? "" : incomingAlias.trim();
        return alias.isEmpty() ? aliasService.generateAlias() : alias;
    }
}