package com.openvoice.service;

import com.openvoice.dao.BlockDao;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class BlockService {

    private final BlockDao blockDao;

    public BlockService(BlockDao blockDao) {
        this.blockDao = blockDao;
    }

    public void setGlobalBlocked(String alias, boolean blocked) {
        String normalized = normalizeAlias(alias);
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Alias is required");
        }
        blockDao.setGlobalBlocked(normalized, blocked);
    }

    public void setGroupBlocked(long groupId, String alias, boolean blocked) {
        String normalized = normalizeAlias(alias);
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Alias is required");
        }
        blockDao.setGroupBlocked(groupId, normalized, blocked);
    }

    public boolean isBlocked(Long groupId, String alias) {
        String normalized = normalizeAlias(alias);
        if (normalized.isEmpty()) {
            return false;
        }
        if (blockDao.isGlobalBlocked(normalized)) {
            return true;
        }
        return groupId != null && blockDao.isGroupBlocked(groupId, normalized);
    }

    public String normalizeAlias(String alias) {
        if (alias == null) {
            return "";
        }
        return alias.trim().toLowerCase(Locale.ROOT);
    }
}
