package com.openvoice.controller;

import com.openvoice.model.Group;
import com.openvoice.model.Message;
import com.openvoice.service.GroupService;
import com.openvoice.service.MessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class GroupController {

    private final GroupService groupService;
    private final MessageService messageService;

    public GroupController(GroupService groupService, MessageService messageService) {
        this.groupService = groupService;
        this.messageService = messageService;
    }

    @GetMapping("/groups")
    public List<Group> getGroups() {
        return groupService.getGroups();
    }

    @GetMapping("/messages/{groupId}")
    public List<Message> getMessages(@PathVariable long groupId) {
        return messageService.getMessagesForGroup(groupId);
    }
}