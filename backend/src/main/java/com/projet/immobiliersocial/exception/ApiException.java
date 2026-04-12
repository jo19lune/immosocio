package com.projet.immobiliersocial.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception métier générique de l'API.
 *
 * <p>Levée dans les contrôleurs et services lorsqu'une règle métier n'est pas
 * respectée. Le {@link GlobalExceptionHandler} la transforme automatiquement
 * en réponse HTTP avec le statut et le message appropriés.</p>
 *
 * <p>Exemples d'utilisation :</p>
 * <pre>{@code
 *   throw new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable");
 *   throw new ApiException(HttpStatus.FORBIDDEN, "Accès refusé");
 *   throw new ApiException(HttpStatus.CONFLICT, "Ces dates sont déjà réservées");
 * }</pre>
 */
public class ApiException extends RuntimeException {

    /** Statut HTTP à retourner au client. */
    private final HttpStatus statut;

    /**
     * Crée une exception avec un statut HTTP et un message lisible par le client.
     *
     * @param statut  code HTTP (ex: {@code HttpStatus.NOT_FOUND})
     * @param message message d'erreur renvoyé dans le corps de la réponse
     */
    public ApiException(HttpStatus statut, String message) {
        super(message);
        this.statut = statut;
    }

    /** @return le statut HTTP associé à cette exception */
    public HttpStatus getStatut() {
        return statut;
    }
}
