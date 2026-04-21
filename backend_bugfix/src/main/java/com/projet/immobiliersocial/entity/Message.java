package com.projet.immobiliersocial.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un message privé entre deux utilisateurs.
 * La conversation est identifiée par la paire (expediteur_id, destinataire_id).
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_message_expediteur", columnList = "expediteur_id"),
    @Index(name = "idx_message_destinataire", columnList = "destinataire_id"),
    @Index(name = "idx_message_date", columnList = "date_envoi")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    /** URL d'une image jointe au message (stockage local). */
    private String mediaUrl;

    @Builder.Default
    private boolean lu = false;

    @Column(name = "date_envoi", updatable = false)
    private LocalDateTime dateEnvoi;

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "publications", "annonces", "reservations", "motDePasse"})
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Utilisateur expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "publications", "annonces", "reservations", "motDePasse"})
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;
}
