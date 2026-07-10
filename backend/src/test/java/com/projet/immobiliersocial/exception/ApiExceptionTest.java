package com.projet.immobiliersocial.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitaires pour {@link ApiException}.
 */
class ApiExceptionTest {

    @Test
    void constructor_shouldSetMessageAndStatus() {
        // Arrange
        HttpStatus expectedStatus = HttpStatus.NOT_FOUND;
        String expectedMessage = "Ressource introuvable";

        // Act
        ApiException exception = new ApiException(expectedStatus, expectedMessage);

        // Assert
        assertEquals(expectedMessage, exception.getMessage());
        assertEquals(expectedStatus, exception.getStatut());
    }

    @Test
    void constructor_shouldHandleDifferentHttpStatuses() {
        // Test BAD_REQUEST
        ApiException badRequest = new ApiException(HttpStatus.BAD_REQUEST, "Requête invalide");
        assertEquals(HttpStatus.BAD_REQUEST, badRequest.getStatut());
        assertEquals("Requête invalide", badRequest.getMessage());

        // Test FORBIDDEN
        ApiException forbidden = new ApiException(HttpStatus.FORBIDDEN, "Accès refusé");
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatut());

        // Test CONFLICT
        ApiException conflict = new ApiException(HttpStatus.CONFLICT, "Conflit de données");
        assertEquals(HttpStatus.CONFLICT, conflict.getStatut());

        // Test INTERNAL_SERVER_ERROR
        ApiException internalError = new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur serveur");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, internalError.getStatut());
    }

    @Test
    void exception_shouldBeRuntimeException() {
        // Assert
        assertTrue(new ApiException(HttpStatus.OK, "test") instanceof RuntimeException);
    }

    @Test
    void getStatut_shouldReturnImmutableStatus() {
        // Arrange
        ApiException exception = new ApiException(HttpStatus.UNAUTHORIZED, "Non autorisé");

        // Act
        HttpStatus status = exception.getStatut();

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, status);
        assertSame(status, exception.getStatut()); // Verify immutability
    }
}