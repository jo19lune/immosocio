package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Publication;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.entity.VisibilitePublication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PublicationRepository extends JpaRepository<Publication, Long> {

    Page<Publication> findAllByOrderByDateCreationDesc(Pageable pageable);

    Page<Publication> findByAuteurOrderByDateCreationDesc(Utilisateur auteur, Pageable pageable);

    /** Filtre par liste de visibilités (PUBLIC seul, ou PUBLIC+MEMBRES) */
    Page<Publication> findByVisibiliteInOrderByDateCreationDesc(
            List<VisibilitePublication> visibilites, Pageable pageable);
}
