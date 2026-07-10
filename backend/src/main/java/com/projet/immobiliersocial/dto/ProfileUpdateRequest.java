package com.projet.immobiliersocial.dto;

import lombok.Data;

/**
 * Corps de la requête PUT /api/auth/profile.
 * Les champs null sont ignorés (mise à jour partielle).
 */
@Data
public class ProfileUpdateRequest {
    private String nom;
    private String prenom;
    private String telephone;
}
