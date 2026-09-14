package com.manabihub.refund.job;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
public class AutomaticRefundSchedulingConfig {
    @Bean
    public ThreadPoolTaskScheduler automaticRefundScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("automatic-refund-");
        return scheduler;
    }
}
