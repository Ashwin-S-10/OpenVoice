package com.openvoice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class OpenVoiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpenVoiceApplication.class, args);
    }
}