package com.openvoice.util;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
public class IdGenerator {
    private static final long MULTIPLIER = 1_000L;
    private final AtomicLong sequence = new AtomicLong(System.currentTimeMillis() * MULTIPLIER);

    public long next() {
        return sequence.getAndIncrement();
    }
}