package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

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
}
