package com.projet.immobiliersocial.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "utilisateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String motDePasse;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String telephone;
    private String photo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    // ─── Vérification email ───────────────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerifie = false;

    @Column(unique = true)
    @JsonIgnore
    private String tokenVerificationEmail;

    @JsonIgnore
    private LocalDateTime tokenVerificationEmailExpiration;

    // ─── Réinitialisation mot de passe ────────────────────────────────────────
    @Column(unique = true)
    @JsonIgnore
    private String tokenReinitialisationMdp;

    @JsonIgnore
    private LocalDateTime tokenReinitialisationMdpExpiration;

    // ─── Préférences ─────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Theme theme = Theme.SYSTEME;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VisibilitePublication visibiliteParDefaut = VisibilitePublication.PUBLIC;

    @Column(nullable = false)
    @Builder.Default
    private boolean notificationsEmail = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean notificationsPush = true;

    // ─── Dates ───────────────────────────────────────────────────────────────
    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    // ─── Relations ───────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "auteur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Publication> publications;

    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Annonce> annonces;

    @OneToMany(mappedBy = "locataire", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reservation> reservations;

    /**
     * Comptes (propriétaires) que cet utilisateur suit.
     * Quand un suivi publie une annonce, ses abonnés sont notifiés.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "utilisateur_suivis",
        joinColumns = @JoinColumn(name = "suiveur_id"),
        inverseJoinColumns = @JoinColumn(name = "suivi_id")
    )
    @JsonIgnore
    @Builder.Default
    private Set<Utilisateur> suivisProprietaires = new HashSet<>();

    /**
     * Indique si l'utilisateur connecté suit ce compte — champ transient rempli
     * par le contrôleur ou endpoint de vérification.
     */
    @Transient
    private Boolean suivi;
}
