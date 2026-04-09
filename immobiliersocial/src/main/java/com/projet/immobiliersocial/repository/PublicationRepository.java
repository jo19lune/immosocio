package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Publication;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicationRepository extends JpaRepository<Publication, Long> {
    Page<Publication> findAllByOrderByDateCreationDesc(Pageable pageable);
    Page<Publication> findByAuteurOrderByDateCreationDesc(Utilisateur auteur, Pageable pageable);
}
