package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.VisibilitePublication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

/**
 * Corps de requête pour la création d'une publication (POST /api/publications).
 */
@Data
public class PublicationRequest {

    /** Texte principal de la publication — obligatoire, max 2000 caractères. */
    @NotBlank(message = "Le contenu de la publication est obligatoire")
    @Size(max = 2000, message = "Le contenu ne peut pas dépasser 2000 caractères")
    private String contenu;

    /** URLs des médias (images) associés à cette publication. */
    private List<String> medias;

    /** Visibilité : PUBLIC, MEMBRES ou PRIVE. Par défaut la préférence de l'utilisateur. */
    private VisibilitePublication visibilite;

    /** Identifiant d'une annonce à lier à cette publication (facultatif). */
    private Long annonceId;
}
