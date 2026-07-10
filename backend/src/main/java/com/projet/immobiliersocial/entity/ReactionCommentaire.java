package com.projet.immobiliersocial.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reaction_commentaires", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"commentaire_id", "utilisateur_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionCommentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String type; // e.g., "LIKE", "LOVE", "HAHA"

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commentaire_id", nullable = false)
    @JsonIgnore
    private Commentaire commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "publications", "annonces", "reservations",
            "motDePasse", "tokenVerificationEmail", "tokenReinitialisationMdp"})
    private Utilisateur utilisateur;
}
