package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String motDePasse;
    private String nom;
    private String prenom;
    private String telephone;
    private Role role; // LOCATAIRE ou PROPRIETAIRE
}
