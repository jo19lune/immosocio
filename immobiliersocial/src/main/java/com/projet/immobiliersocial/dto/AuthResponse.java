package com.projet.immobiliersocial.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String role;

    public AuthResponse(String token, Long id, String email, String nom, String prenom, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
    }
}
