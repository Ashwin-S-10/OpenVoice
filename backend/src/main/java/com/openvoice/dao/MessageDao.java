package com.openvoice.dao;

import com.openvoice.model.Message;
import com.openvoice.util.IdGenerator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Repository
public class MessageDao {

    private final JdbcTemplate jdbcTemplate;
    private final IdGenerator idGenerator;

    public MessageDao(JdbcTemplate jdbcTemplate, IdGenerator idGenerator) {
        this.jdbcTemplate = jdbcTemplate;
        this.idGenerator = idGenerator;
    }

    public void save(Message message) {
        long id = idGenerator.next();

        int inserted = jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement(
                "INSERT INTO chat_messages(id, group_id, alias_name, content, created_at) VALUES (?, ?, ?, ?, ?)"
            );
            ps.setLong(1, id);
            ps.setLong(2, message.getGroupId());
            ps.setString(3, message.getAliasName());
            ps.setString(4, message.getContent());
            ps.setTimestamp(5, Timestamp.from(message.getCreatedAt()));
            return ps;
        });

        if (inserted == 0) {
            throw new IllegalStateException("Unable to create message");
        }
        message.setId(id);
    }

    public List<Message> findByGroupIdLimit(long groupId, int limit) {
        List<Message> rows = jdbcTemplate.query(
                "SELECT id, group_id, alias_name, content, created_at " +
                "FROM chat_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT ?",
                (rs, rowNum) -> {
                    Message message = new Message();
                    message.setId(rs.getLong("id"));
                    message.setGroupId(rs.getLong("group_id"));
                    message.setAliasName(rs.getString("alias_name"));
                    message.setContent(rs.getString("content"));
                    message.setCreatedAt(rs.getTimestamp("created_at").toInstant());
                    return message;
                },
                groupId,
                limit
            );

            List<Message> chronological = new ArrayList<>(rows);
            Collections.reverse(chronological);
            return chronological;
    }
}