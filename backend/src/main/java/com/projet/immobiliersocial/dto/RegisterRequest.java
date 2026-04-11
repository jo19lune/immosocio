package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Corps de requête pour l'inscription d'un nouvel utilisateur (POST /api/auth/register).
 *
 * <p>Seuls les rôles {@code LOCATAIRE} et {@code PROPRIETAIRE} sont acceptables
 * à l'inscription publique. Le rôle {@code ADMIN} ne peut pas être auto-attribué.</p>
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 80, message = "Le nom ne peut pas dépasser 80 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 80, message = "Le prénom ne peut pas dépasser 80 caractères")
    private String prenom;

    @Pattern(regexp = "^(\\+?[0-9\\s\\-]{7,15})?$", message = "Format de téléphone invalide")
    private String telephone;

    /**
     * Rôle demandé : LOCATAIRE ou PROPRIETAIRE uniquement.
     * La valeur ADMIN est refusée dans {@code AuthController}.
     */
    @NotNull(message = "Le rôle est obligatoire")
    private Role role;
}
