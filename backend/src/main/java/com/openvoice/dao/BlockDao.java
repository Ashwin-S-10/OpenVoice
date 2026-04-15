package com.openvoice.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;

@Repository
public class BlockDao {

    private final JdbcTemplate jdbcTemplate;

    public BlockDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void setGlobalBlocked(String alias, boolean blocked) {
        if (blocked) {
            jdbcTemplate.update(
                    "INSERT INTO blocked_users_global(alias_name, created_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE alias_name = alias_name",
                    alias,
                    Timestamp.from(Instant.now())
            );
        } else {
            jdbcTemplate.update("DELETE FROM blocked_users_global WHERE alias_name = ?", alias);
        }
    }

    public void setGroupBlocked(long groupId, String alias, boolean blocked) {
        if (blocked) {
            jdbcTemplate.update(
                    "INSERT INTO blocked_users_group(group_id, alias_name, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE alias_name = alias_name",
                    groupId,
                    alias,
                    Timestamp.from(Instant.now())
            );
        } else {
            jdbcTemplate.update("DELETE FROM blocked_users_group WHERE group_id = ? AND alias_name = ?", groupId, alias);
        }
    }

    public boolean isGlobalBlocked(String alias) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM blocked_users_global WHERE alias_name = ?",
                Integer.class,
                alias
        );
        return count != null && count > 0;
    }

    public boolean isGroupBlocked(long groupId, String alias) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM blocked_users_group WHERE group_id = ? AND alias_name = ?",
                Integer.class,
                groupId,
                alias
        );
        return count != null && count > 0;
    }
}
