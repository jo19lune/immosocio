package com.projet.immobiliersocial.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitaires pour {@link BusinessException}.
 */
@SuppressWarnings("null")
class BusinessExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        // Arrange
        String expectedMessage = "Opération non autorisée";

        // Act
        BusinessException exception = new BusinessException(expectedMessage);

        // Assert
        assertEquals(expectedMessage, exception.getMessage());
    }

    @Test
    void exception_shouldBeRuntimeException() {
        // Assert
        assertTrue(new BusinessException("test") instanceof RuntimeException);
    }

    @Test
    void constructor_shouldHandleNullMessage() {
        // Act
        BusinessException exception = new BusinessException(null);

        // Assert
        assertNull(exception.getMessage());
    }

    @Test
    void constructor_shouldHandleEmptyMessage() {
        // Act
        BusinessException exception = new BusinessException("");

        // Assert
        assertEquals("", exception.getMessage());
    }
}