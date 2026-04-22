package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AnnonceRepository
        extends JpaRepository<Annonce, Long>,
                JpaSpecificationExecutor<Annonce> {           // ← ajout

    Page<Annonce> findByStatut(StatutAnnonce statut, Pageable pageable);

    Page<Annonce> findByProprietaire(Utilisateur proprietaire, Pageable pageable);

    Page<Annonce> findByStatutIn(Collection<StatutAnnonce> statuts, Pageable pageable);

    // ── SUPPRIMÉE : rechercher() JPQL — remplacée par Specification dans le contrôleur ──

    /**
     * Annonces adaptées aux étudiants : studios et petits appartements à prix réduit.
     */
    @Query("""
        SELECT a FROM Annonce a WHERE a.statut IN :statuts
        AND a.typeLogement IN (com.projet.immobiliersocial.entity.TypeLogement.STUDIO,
                               com.projet.immobiliersocial.entity.TypeLogement.APPARTEMENT)
        AND a.prix <= :prixMaxEtudiants
        ORDER BY a.prix ASC, a.dateCreation DESC
    """)
    Page<Annonce> findAnnoncesEtudiants(
        @Param("prixMaxEtudiants") BigDecimal prixMaxEtudiants,
        @Param("statuts") Collection<StatutAnnonce> statuts,
        Pageable pageable
    );

    /**
     * Annonces pour touristes/vacanciers : chambres meublées premium.
     */
    @Query("""
        SELECT a FROM Annonce a WHERE a.statut IN :statuts
        AND a.typeLogement = com.projet.immobiliersocial.entity.TypeLogement.CHAMBRE
        ORDER BY a.prix DESC, a.dateCreation DESC
    """)
    Page<Annonce> findAnnoncesTouristes(
        @Param("statuts") Collection<StatutAnnonce> statuts,
        Pageable pageable
    );

    /**
     * Annonces pour colocation : appartements avec plusieurs pièces.
     */
    @Query("""
        SELECT a FROM Annonce a WHERE a.statut IN :statuts
        AND a.typeLogement = com.projet.immobiliersocial.entity.TypeLogement.APPARTEMENT
        AND a.nombrePieces >= :minPieces
        ORDER BY a.dateCreation DESC
    """)
    Page<Annonce> findAnnoncesColocation(
        @Param("minPieces") Integer minPieces,
        @Param("statuts") Collection<StatutAnnonce> statuts,
        Pageable pageable
    );

    /** Top annonces récentes pour la page publique. */
    List<Annonce> findTop6ByStatutOrderByDateCreationDesc(StatutAnnonce statut);

    /** Annonces disponibles avec stock > 0. */
    @Query("""
        SELECT a FROM Annonce a WHERE a.statut = :statut
        AND a.quantiteDisponible > 0
        ORDER BY a.dateCreation DESC
    """)
    Page<Annonce> findAvailableByStatut(
        @Param("statut") StatutAnnonce statut,
        Pageable pageable
    );

    /** Annonces suivies par un utilisateur. */
    @Query("""
        SELECT a FROM Annonce a WHERE :utilisateur MEMBER OF a.followers
        ORDER BY a.dateCreation DESC
    """)
    Page<Annonce> findFollowedByUtilisateur(
        @Param("utilisateur") Utilisateur utilisateur,
        Pageable pageable
    );

    /** Nombre d'annonces d'un propriétaire par statut. */
    @Query("SELECT COUNT(a) FROM Annonce a WHERE a.proprietaire = :proprietaire AND a.statut = :statut")
    long countByProprietaireAndStatut(
        @Param("proprietaire") Utilisateur proprietaire,
        @Param("statut") StatutAnnonce statut
    );

    /** Détail complet avec JOIN FETCH pour éviter N+1. */
    @Query("""
        SELECT DISTINCT a FROM Annonce a
        LEFT JOIN FETCH a.proprietaire
        LEFT JOIN FETCH a.followers
        WHERE a.id = :id
    """)
    Optional<Annonce> findByIdWithDetails(@Param("id") Long id);
}
