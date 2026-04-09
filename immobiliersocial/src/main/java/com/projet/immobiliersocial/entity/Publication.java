package com.projet.immobiliersocial.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "publications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @ElementCollection
    private List<String> medias;

    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @JoinColumn(name = "annonce_id")
    private Annonce annonce; // Publication liée à une annonce (optionnel)

    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Commentaire> commentaires;

    @OneToMany(mappedBy = "publication", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Like> likes;
}
