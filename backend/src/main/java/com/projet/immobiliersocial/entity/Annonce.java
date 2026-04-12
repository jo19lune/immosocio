package com.projet.immobiliersocial.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "annonces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String adresse;

    private String ville;

    private String pays;

    @Column(nullable = false)
    private BigDecimal prix;

    private Integer nombrePieces;

    private Double superficie; // en m²

    @Enumerated(EnumType.STRING)
    private TypeLogement typeLogement; // MAISON, APPARTEMENT, STUDIO

    @ElementCollection
    private List<String> photos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutAnnonce statut = StatutAnnonce.DISPONIBLE;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateMiseAJour;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateMiseAJour = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proprietaire_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Utilisateur proprietaire;

    @OneToMany(mappedBy = "annonce", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reservation> reservations;
}
