package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.LikeAnnonce;
import com.projet.immobiliersocial.entity.Annonce;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LikeAnnonceRepository extends JpaRepository<LikeAnnonce, Long> {
    Optional<LikeAnnonce> findByUtilisateurAndAnnonce(Utilisateur utilisateur, Annonce annonce);
    boolean existsByUtilisateurAndAnnonce(Utilisateur utilisateur, Annonce annonce);
    long countByAnnonce(Annonce annonce);
}
