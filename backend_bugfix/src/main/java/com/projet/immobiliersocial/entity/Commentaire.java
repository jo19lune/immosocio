package com.projet.immobiliersocial.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    // Evite la sérialisation du proxy Hibernate → 500 "No serializer found"
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "publications", "annonces", "reservations",
            "motDePasse", "tokenVerificationEmail", "tokenReinitialisationMdp"})
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id", nullable = false)
    // Ne pas inclure la publication dans la réponse (évite la récursion infinie)
    @JsonIgnore
    private Publication publication;
}
