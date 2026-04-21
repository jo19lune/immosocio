package com.projet.immobiliersocial.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Corps de requête pour la création d'une réservation (POST /api/reservations).
 */
@Data
public class ReservationRequest {

    /** Identifiant de l'annonce à réserver. */
    @NotNull(message = "L'identifiant de l'annonce est obligatoire")
    private Long annonceId;

    /** Date de début du séjour (≥ aujourd'hui). */
    @NotNull(message = "La date de début est obligatoire")
    @FutureOrPresent(message = "La date de début ne peut pas être dans le passé")
    private LocalDate dateDebut;

    /** Date de fin du séjour (doit être après dateDebut — vérifiée dans le contrôleur). */
    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    /** Nombre d'unités ou pièces réservées. */
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantite = 1;

    /** Message optionnel du locataire au propriétaire (max 500 caractères). */
    @Size(max = 500, message = "Le message ne peut pas dépasser 500 caractères")
    private String message;
}
