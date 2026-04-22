package com.projet.immobiliersocial.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "annonce_commentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentaireAnnonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "annonces", "reservations", "publications", "motDePasse",
            "tokenVerificationEmail", "tokenReinitialisationMdp",
            "suivisProprietaires"})
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "annonce_id", nullable = false)
    private Annonce annonce;

    /**
     * Référence vers le commentaire parent (null si c'est un commentaire principal).
     * Permet les réponses imbriquées (un seul niveau).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "parent_id")
    private CommentaireAnnonce parent;

    /**
     * ID du commentaire parent — exposé en JSON pour le frontend.
     * null si c'est un commentaire principal.
     */
    @JsonProperty("parentId")
    public Long getParentId() {
        return parent != null ? parent.getId() : null;
    }

    /**
     * Nombre de réponses — champ transient rempli par le contrôleur.
     */
    @Transient
    private Long reponseCount;
}
