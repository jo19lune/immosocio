package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Commentaire;
import com.projet.immobiliersocial.entity.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    Page<Commentaire> findByPublicationOrderByDateCreationAsc(Publication publication, Pageable pageable);
    long countByPublication(Publication publication);
}
