package com.projet.immobiliersocial.config;

import com.projet.immobiliersocial.websocket.WebSocketAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;
    private final AppProperties appProperties;

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        String[] origins = (appProperties.getUrls() != null) 
                ? appProperties.getUrls().toArray(String[]::new)
                : new String[]{"*"};
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS()
                // Augmenter le délai de disconnect (ms) — utile sur réseau lent
                .setDisconnectDelay(30_000)
                // Activer le heartbeat côté SockJS
                .setHeartbeatTime(25_000);
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        // Scheduler dédié pour le heartbeat STOMP (évite les blocages)
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();

        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{25_000, 25_000}) // send, receive (ms)
                .setTaskScheduler(scheduler);
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        // Augmenter les threads pour absorber les pics de connexion
        registration.taskExecutor()
                .corePoolSize(4)
                .maxPoolSize(8)
                .keepAliveSeconds(60);
        registration.interceptors(authChannelInterceptor);
    }

    @Override
    public void configureClientOutboundChannel(@NonNull ChannelRegistration registration) {
        registration.taskExecutor()
                .corePoolSize(4)
                .maxPoolSize(8)
                .keepAliveSeconds(60);
    }
}

