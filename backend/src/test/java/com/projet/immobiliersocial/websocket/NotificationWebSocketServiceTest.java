package com.projet.immobiliersocial.websocket;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour {@link NotificationWebSocketService}.
 */
@ExtendWith(MockitoExtension.class)
class NotificationWebSocketServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationWebSocketService service;

    @Test
    void envoyerNotification_shouldSendToUserQueue() {
        // Arrange
        String email = "user@test.com";
        Map<String, String> payload = Map.of("type", "NEW_MESSAGE", "content", "Hello");

        // Act
        service.envoyerNotification(email, payload);

        // Assert
        verify(messagingTemplate).convertAndSendToUser(
            eq(email),
            eq("/queue/notifications"),
            eq(payload)
        );
    }

    @Test
    void envoyerNotification_shouldHandleMessagingException() {
        // Arrange
        String email = "user@test.com";
        doThrow(new RuntimeException("WS error")).when(messagingTemplate)
            .convertAndSendToUser(any(), any(), any());

        // Act & Assert - should not throw
        assertDoesNotThrow(() ->
            service.envoyerNotification(email, Map.of("test", "value"))
        );
    }

    @Test
    void diffuser_shouldSendToTopic() {
        // Arrange
        String topic = "/topic/annonces";
        Map<String, Object> payload = Map.of("id", 1L, "title", "New Announcement");

        // Act
        service.diffuser(topic, payload);

        // Assert
        verify(messagingTemplate).convertAndSend(eq(topic), eq(payload));
    }

    @Test
    void diffuser_shouldHandleMessagingException() {
        // Arrange
        String topic = "/topic/test";
        doThrow(new RuntimeException("WS error")).when(messagingTemplate)
            .convertAndSend(any(String.class), any(Object.class));

        // Act & Assert - should not throw
        assertDoesNotThrow(() ->
            service.diffuser(topic, Map.of("test", "value"))
        );
    }

    @Test
    void envoyerNotification_withNullPayload_shouldWork() {
        // Arrange
        String email = "user@test.com";

        // Act & Assert
        assertDoesNotThrow(() -> service.envoyerNotification(email, null));
    }

    @Test
    void diffuser_withEmptyTopic_shouldAttemptSend() {
        // Arrange
        String topic = "";

        // Act
        service.diffuser(topic, "test");

        // Assert - verify attempt to send (even with empty topic)
        verify(messagingTemplate).convertAndSend(eq(""), any(Object.class));
    }
}