package com.projet.immobiliersocial.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Corps de requête pour l'authentification (POST /api/auth/login).
 */
@Data
public class AuthRequest {

    /** Adresse email de l'utilisateur. */
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    /** Mot de passe en clair (sera comparé au hash BCrypt). */
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
}
