CREATE TABLE IF NOT EXISTS chat_groups (
    id BIGINT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    alias_name VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL,
    CONSTRAINT fk_chat_messages_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blocked_users_global (
    alias_name VARCHAR(120) PRIMARY KEY,
    created_at TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_users_group (
    group_id BIGINT NOT NULL,
    alias_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL,
    PRIMARY KEY (group_id, alias_name),
    CONSTRAINT fk_blocked_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE
);