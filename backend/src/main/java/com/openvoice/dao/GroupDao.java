package com.openvoice.dao;

import com.openvoice.model.Group;
import com.openvoice.util.IdGenerator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class GroupDao {

    private final JdbcTemplate jdbcTemplate;
    private final IdGenerator idGenerator;

    public GroupDao(JdbcTemplate jdbcTemplate, IdGenerator idGenerator) {
        this.jdbcTemplate = jdbcTemplate;
        this.idGenerator = idGenerator;
    }

    public List<Group> findAll() {
        return jdbcTemplate.query(
                "SELECT id, name, created_at FROM chat_groups ORDER BY created_at DESC",
                (rs, rowNum) -> {
                    Group group = new Group();
                    group.setId(rs.getLong("id"));
                    group.setName(rs.getString("name"));
                    group.setCreatedAt(rs.getTimestamp("created_at").toInstant());
                    return group;
                }
        );
    }

    public Group create(String name) {
        Instant now = Instant.now();
        long id = idGenerator.next();

        int inserted = jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO chat_groups(id, name, created_at) VALUES (?, ?, ?)"
            );
            ps.setLong(1, id);
            ps.setString(2, name);
            ps.setTimestamp(3, Timestamp.from(now));
            return ps;
        });

        if (inserted == 0) {
            throw new IllegalStateException("Unable to create group");
        }

        Group group = new Group();
        group.setId(id);
        group.setName(name);
        group.setCreatedAt(now);
        return group;
    }
}