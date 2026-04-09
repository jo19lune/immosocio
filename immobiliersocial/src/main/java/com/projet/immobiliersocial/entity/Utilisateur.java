package com.projet.immobiliersocial.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String telephone;

    private String photo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // LOCATAIRE, PROPRIETAIRE, ADMIN

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    // Relations sociales
    @OneToMany(mappedBy = "auteur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Publication> publications;

    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Annonce> annonces;

    @OneToMany(mappedBy = "locataire", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reservation> reservations;
}
