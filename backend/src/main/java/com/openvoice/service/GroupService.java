package com.openvoice.service;

import com.openvoice.dao.GroupDao;
import com.openvoice.model.Group;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService {

    private final GroupDao groupDao;

    public GroupService(GroupDao groupDao) {
        this.groupDao = groupDao;
    }

    public List<Group> getGroups() {
        return groupDao.findAll();
    }

    public Group createGroup(String name) {
        String trimmedName = name == null ? "" : name.trim();
        if (trimmedName.isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }
        return groupDao.create(trimmedName);
    }

    public boolean deleteGroup(long groupId) {
        return groupDao.deleteById(groupId);
    }
}