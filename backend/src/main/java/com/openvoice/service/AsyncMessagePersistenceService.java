package com.openvoice.service;

import com.openvoice.dao.MessageDao;
import com.openvoice.model.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AsyncMessagePersistenceService {

    private static final Logger logger = LoggerFactory.getLogger(AsyncMessagePersistenceService.class);

    private final MessageDao messageDao;

    public AsyncMessagePersistenceService(MessageDao messageDao) {
        this.messageDao = messageDao;
    }

    @Async("messagePersistenceExecutor")
    public void persist(Message message) {
        try {
            messageDao.save(message);
        } catch (Exception ex) {
            logger.error("Failed to persist message for group {}", message.getGroupId(), ex);
        }
    }
}
