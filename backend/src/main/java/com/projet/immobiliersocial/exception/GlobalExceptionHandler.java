package com.projet.immobiliersocial.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestionnaire centralisé des exceptions de l'API REST.
 *
 * <p>Intercepte les exceptions levées dans les contrôleurs et les transforme
 * en réponses JSON cohérentes avec le format :</p>
 * <pre>{@code
 * {
 *   "timestamp": "2025-04-11T10:30:00",
 *   "statut":    404,
 *   "erreur":    "Annonce introuvable"
 * }
 * }</pre>
 *
 * <p>Les exceptions de validation retournent en plus un champ {@code "champs"}
 * détaillant les erreurs par champ.</p>
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─── ApiException (erreurs métier explicites) ─────────────────────────────

    /**
     * Gère les {@link ApiException} levées explicitement dans le code métier.
     * Le statut HTTP est celui défini lors de la construction de l'exception.
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex) {
        log.debug("ApiException [{}] : {}", ex.getStatut(), ex.getMessage());
        return buildResponse(ex.getStatut(), ex.getMessage());
    }

    // ─── Validation (@Valid) ──────────────────────────────────────────────────

    /**
     * Gère les erreurs de validation des corps de requête annotés {@code @Valid}.
     * Retourne un statut 400 et la liste des champs invalides.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> champsErreur = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Valeur invalide",
                        (a, b) -> a  // en cas de doublon, garder le premier message
                ));

        Map<String, Object> corps = buildCorps(HttpStatus.BAD_REQUEST, "Données invalides");
        corps.put("champs", champsErreur);
        return ResponseEntity.badRequest().body(corps);
    }

    // ─── Sécurité ─────────────────────────────────────────────────────────────

    /**
     * Gère les accès refusés par Spring Security (rôles insuffisants).
     * Retourne un 403 générique pour ne pas exposer les détails d'autorisation.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Accès refusé : {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, "Accès refusé");
    }

    // ─── Erreurs imprévues ────────────────────────────────────────────────────

    /**
     * Filet de sécurité pour toute exception non gérée explicitement.
     * Retourne un 500 et log l'exception complète.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Erreur interne inattendue", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur interne s'est produite. Veuillez réessayer.");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(buildCorps(statut, message));
    }

    private Map<String, Object> buildCorps(HttpStatus statut, String message) {
        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("timestamp", LocalDateTime.now().toString());
        corps.put("statut", statut.value());
        corps.put("erreur", message);
        return corps;
    }
}
