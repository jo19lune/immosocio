package com.projet.immobiliersocial.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests unitaires pour {@link GlobalExceptionHandler}.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler handler;

    @Test
    void handleApiException_shouldReturnCorrectStatusAndMessage() {
        // Arrange
        ApiException ex = new ApiException(HttpStatus.NOT_FOUND, "Ressource introuvable");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleApiException(ex);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(404, body.get("statut"));
        assertEquals("Ressource introuvable", body.get("erreur"));
        assertNotNull(body.get("timestamp"));
    }

    @Test
    void handleApiException_shouldHandleDifferentStatuses() {
        // Test FORBIDDEN
        ApiException forbiddenEx = new ApiException(HttpStatus.FORBIDDEN, "Accès interdit");
        ResponseEntity<Map<String, Object>> forbiddenResponse = handler.handleApiException(forbiddenEx);
        assertEquals(HttpStatus.FORBIDDEN, forbiddenResponse.getStatusCode());

        // Test CONFLICT
        ApiException conflictEx = new ApiException(HttpStatus.CONFLICT, "Conflit");
        ResponseEntity<Map<String, Object>> conflictResponse = handler.handleApiException(conflictEx);
        assertEquals(HttpStatus.CONFLICT, conflictResponse.getStatusCode());
    }

    @Test
    void handleValidation_shouldReturnBadRequestWithFieldErrors() {
        // Arrange
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "objectName");
        bindingResult.addError(new FieldError("objectName", "email", "Email invalide"));
        bindingResult.addError(new FieldError("objectName", "nom", "Nom requis"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(400, body.get("statut"));
        assertNotNull(body.get("champs"));
        @SuppressWarnings("unchecked")
        Map<String, String> champs = (Map<String, String>) body.get("champs");
        assertEquals("Email invalide", champs.get("email"));
        assertEquals("Nom requis", champs.get("nom"));
    }

    @Test
    void handleAccessDenied_shouldReturnForbidden() {
        // Arrange
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleAccessDenied(ex);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(403, body.get("statut"));
        assertEquals("Accès refusé", body.get("erreur"));
    }

    @Test
    void handleUnexpected_shouldReturnInternalServerError() {
        // Arrange
        Exception ex = new RuntimeException("Unexpected error");

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleUnexpected(ex);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(500, body.get("statut"));
        assertEquals("Une erreur interne s'est produite. Veuillez réessayer.", body.get("erreur"));
    }

    @Test
    void handleValidation_withEmptyErrors_shouldReturnEmptyChamps() {
        // Arrange
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "objectName");
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        // Act
        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body.get("champs"));
    }
}