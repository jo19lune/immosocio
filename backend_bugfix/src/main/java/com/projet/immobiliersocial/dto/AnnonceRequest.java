package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.TypeLogement;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * Corps de requête pour la création ou la modification d'une annonce immobilière.
 * Les champs marqués {@code @NotBlank} / {@code @NotNull} sont obligatoires.
 */
@Data
public class AnnonceRequest {

    /** Titre affiché dans les résultats de recherche — 5 à 120 caractères. */
    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 5, max = 120, message = "Le titre doit contenir entre 5 et 120 caractères")
    private String titre;

    /** Description détaillée du logement (facultatif, max 2000 caractères). */
    @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères")
    private String description;

    /** Adresse physique complète. */
    @NotBlank(message = "L'adresse est obligatoire")
    private String adresse;

    private String ville;
    private String pays;

    /** Prix mensuel ou de vente — doit être strictement positif. */
    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
    private BigDecimal prix;

    /** Nombre de pièces (≥ 1 si renseigné). */
    @Min(value = 1, message = "Le nombre de pièces doit être au moins 1")
    private Integer nombrePieces;

    /** Superficie en m² (≥ 1 si renseignée). */
    @DecimalMin(value = "1.0", message = "La superficie doit être au moins 1 m²")
    private Double superficie;

    /** Nombre de pièces/unités disponibles à la réservation. */
    @Min(value = 1, message = "La quantité disponible doit être au moins 1")
    private Integer quantiteDisponible = 1;

    /** Type de logement : MAISON, APPARTEMENT ou STUDIO. */
    private TypeLogement typeLogement;

    /** URLs des photos (stockage local). */
    private List<String> photos;
}
