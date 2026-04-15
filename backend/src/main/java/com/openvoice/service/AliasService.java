package com.openvoice.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AliasService {

    private static final String[] ADJECTIVES = {
            "Swift", "Bright", "Calm", "Bold", "Clever", "Quiet", "Rapid", "Lucky"
    };

    private static final String[] NOUNS = {
            "Falcon", "Fox", "Comet", "River", "Pine", "Echo", "Leaf", "Nova"
    };

    private final AtomicInteger counter = new AtomicInteger(100);

    public String generateAlias() {
        String adjective = ADJECTIVES[ThreadLocalRandom.current().nextInt(ADJECTIVES.length)];
        String noun = NOUNS[ThreadLocalRandom.current().nextInt(NOUNS.length)];
        return adjective + noun + counter.getAndIncrement();
    }
}