package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.ReactionCommentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReactionCommentaireRepository extends JpaRepository<ReactionCommentaire, Long> {
    Optional<ReactionCommentaire> findByCommentaireIdAndUtilisateurId(Long commentaireId, Long utilisateurId);
}
