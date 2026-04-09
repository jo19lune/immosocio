package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface AnnonceRepository extends JpaRepository<Annonce, Long> {

    Page<Annonce> findByStatut(StatutAnnonce statut, Pageable pageable);

    Page<Annonce> findByProprietaire(Utilisateur proprietaire, Pageable pageable);

    @Query("""
        SELECT a FROM Annonce a WHERE a.statut = 'DISPONIBLE'
        AND (:ville IS NULL OR LOWER(a.ville) LIKE LOWER(CONCAT('%', :ville, '%')))
        AND (:type IS NULL OR a.typeLogement = :type)
        AND (:prixMin IS NULL OR a.prix >= :prixMin)
        AND (:prixMax IS NULL OR a.prix <= :prixMax)
    """)
    Page<Annonce> rechercher(
        @Param("ville") String ville,
        @Param("type") TypeLogement type,
        @Param("prixMin") BigDecimal prixMin,
        @Param("prixMax") BigDecimal prixMax,
        Pageable pageable
    );

    List<Annonce> findTop6ByStatutOrderByDateCreationDesc(StatutAnnonce statut);
}
