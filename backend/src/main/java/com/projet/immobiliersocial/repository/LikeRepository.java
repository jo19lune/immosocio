package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Like;
import com.projet.immobiliersocial.entity.Publication;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUtilisateurAndPublication(Utilisateur utilisateur, Publication publication);
    boolean existsByUtilisateurAndPublication(Utilisateur utilisateur, Publication publication);
    long countByPublication(Publication publication);
}
