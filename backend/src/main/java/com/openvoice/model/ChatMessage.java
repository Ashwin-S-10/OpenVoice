package com.openvoice.model;

public class ChatMessage {

    public enum Type {
        JOIN_GROUP,
        SEND_MESSAGE,
        LEAVE_GROUP
    }

    private Type type;
    private Long groupId;
    private String alias;
    private String content;

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}