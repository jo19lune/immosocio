package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.CommentaireAnnonce;
import com.projet.immobiliersocial.entity.Annonce;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentaireAnnonceRepository extends JpaRepository<CommentaireAnnonce, Long> {

    /** Tous les commentaires d'une annonce (tri date croissante). */
    Page<CommentaireAnnonce> findByAnnonceOrderByDateCreationAsc(Annonce annonce, Pageable pageable);

    /** Commentaires de premier niveau uniquement (sans parent). */
    Page<CommentaireAnnonce> findByAnnonceAndParentIsNullOrderByDateCreationAsc(Annonce annonce, Pageable pageable);

    /** Réponses directes d'un commentaire parent. */
    List<CommentaireAnnonce> findByParentOrderByDateCreationAsc(CommentaireAnnonce parent);

    /** Nombre total de commentaires (tous niveaux) d'une annonce. */
    long countByAnnonce(Annonce annonce);

    /** Nombre de réponses directes d'un commentaire. */
    long countByParent(CommentaireAnnonce parent);
}
