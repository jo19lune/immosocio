package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Utilisateur> findByTokenVerificationEmail(String token);
    Optional<Utilisateur> findByTokenReinitialisationMdp(String token);

    /**
     * Retourne tous les utilisateurs qui suivent le propriétaire donné.
     * Utile pour notifier les abonnés lors d'une nouvelle annonce.
     */
    @Query("SELECT u FROM Utilisateur u JOIN u.suivisProprietaires sp WHERE sp.id = :proprietaireId")
    List<Utilisateur> findFollowersDuProprietaire(@Param("proprietaireId") Long proprietaireId);

    @Query("SELECT u FROM Utilisateur u WHERE " +
        "LOWER(u.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
        "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Utilisateur> rechercher(@Param("q") String q, org.springframework.data.domain.Pageable pageable);
}
