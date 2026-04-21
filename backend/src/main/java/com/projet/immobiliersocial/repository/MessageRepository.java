package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Message;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Messages d'une conversation entre deux utilisateurs, paginés.
     * L'ORDER BY est retiré de la requête pour laisser le Pageable gérer
     * le tri — sinon Hibernate 6 lève une erreur de double ORDER BY.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE (m.expediteur = :u1 AND m.destinataire = :u2)
        OR (m.expediteur = :u2 AND m.destinataire = :u1)
    """)
    Page<Message> findConversation(
            @Param("u1") Utilisateur u1,
            @Param("u2") Utilisateur u2,
            Pageable pageable);

    /**
     * Dernier message de chaque conversation de l'utilisateur.
     * Requête JPQL avec sous-requête corrélée — compatible H2 et PostgreSQL.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE (m.expediteur.id = :userId OR m.destinataire.id = :userId)
        AND m.dateEnvoi = (
            SELECT MAX(m2.dateEnvoi) FROM Message m2
            WHERE (
                (m2.expediteur.id = m.expediteur.id AND m2.destinataire.id = m.destinataire.id)
                OR
                (m2.expediteur.id = m.destinataire.id AND m2.destinataire.id = m.expediteur.id)
            )
        )
        ORDER BY m.dateEnvoi DESC
    """)
    List<Message> findDerniersMessages(@Param("userId") Long userId);

    /**
     * Nombre de messages non lus envoyés par un expéditeur précis.
     */
    long countByDestinataireAndExpediteurAndLuFalse(
            Utilisateur destinataire, Utilisateur expediteur);

    /**
     * Nombre total de messages non lus pour un utilisateur.
     */
    long countByDestinataireAndLuFalse(Utilisateur destinataire);

    /**
     * Marquer tous les messages d'une conversation comme lus.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Message m SET m.lu = true
        WHERE m.destinataire = :destinataire
        AND m.expediteur = :expediteur
        AND m.lu = false
    """)
    void marquerConversationLue(
            @Param("destinataire") Utilisateur destinataire,
            @Param("expediteur") Utilisateur expediteur);
}
