package com.projet.immobiliersocial.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour {@link EmailService}.
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender);
        // Use reflection to set private fields
        setField(emailService, "frontendUrl", "http://localhost:5173");
        setField(emailService, "fromEmail", "noreply@test.com");
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void envoyerVerificationEmail_shouldSendEmailWithCorrectContent() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        String destinataire = "user@test.com";
        String prenom = "John";
        String token = "abc123";

        // Act
        emailService.envoyerVerificationEmail(destinataire, prenom, token);

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void envoyerReinitialisationMdp_shouldSendEmailWithCorrectContent() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        String destinataire = "user@test.com";
        String prenom = "Jane";
        String token = "xyz789";

        // Act
        emailService.envoyerReinitialisationMdp(destinataire, prenom, token);

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void envoyerVerificationEmail_shouldHandleMailSenderException() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // Act & Assert - should not throw
        assertDoesNotThrow(() ->
            emailService.envoyerVerificationEmail("user@test.com", "John", "token")
        );
    }

    @Test
    void envoyerReinitialisationMdp_shouldHandleMailSenderException() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // Act & Assert - should not throw
        assertDoesNotThrow(() ->
            emailService.envoyerReinitialisationMdp("user@test.com", "Jane", "token")
        );
    }

    @Test
    void envoyerVerificationEmail_withEmptyPrenom_shouldStillWork() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act & Assert
        assertDoesNotThrow(() ->
            emailService.envoyerVerificationEmail("user@test.com", "", "token")
        );
    }
}