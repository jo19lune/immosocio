package com.projet.immobiliersocial.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitaires pour {@link ResourceNotFoundException}.
 */
class ResourceNotFoundExceptionTest {

    @Test
    void constructor_withMessage_shouldSetMessage() {
        // Arrange
        String expectedMessage = "Ressource non trouvée";

        // Act
        ResourceNotFoundException exception = new ResourceNotFoundException(expectedMessage);

        // Assert
        assertEquals(expectedMessage, exception.getMessage());
    }

    @Test
    void constructor_withEntityAndId_shouldFormatMessage() {
        // Act
        ResourceNotFoundException exception = new ResourceNotFoundException("Annonce", 42L);

        // Assert
        assertEquals("Annonce introuvable avec l'id : 42", exception.getMessage());
    }

    @Test
    void constructor_withEntityAndId_shouldHandleDifferentEntities() {
        // Test Utilisateur
        ResourceNotFoundException userEx = new ResourceNotFoundException("Utilisateur", 1L);
        assertEquals("Utilisateur introuvable avec l'id : 1", userEx.getMessage());

        // Test Publication
        ResourceNotFoundException pubEx = new ResourceNotFoundException("Publication", 99L);
        assertEquals("Publication introuvable avec l'id : 99", pubEx.getMessage());
    }

    @Test
    void exception_shouldBeRuntimeException() {
        // Assert
        assertTrue(new ResourceNotFoundException("test") instanceof RuntimeException);
    }

    @Test
    void constructor_withZeroId_shouldWork() {
        // Act
        ResourceNotFoundException exception = new ResourceNotFoundException("Test", 0L);

        // Assert
        assertEquals("Test introuvable avec l'id : 0", exception.getMessage());
    }
}