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
     * Messages d'une conversation entre deux utilisateurs (ordre chronologique).
     */
    @Query("""
        SELECT m FROM Message m
        WHERE (m.expediteur = :u1 AND m.destinataire = :u2)
           OR (m.expediteur = :u2 AND m.destinataire = :u1)
        ORDER BY m.dateEnvoi ASC
    """)
    Page<Message> findConversation(
            @Param("u1") Utilisateur u1,
            @Param("u2") Utilisateur u2,
            Pageable pageable);

    /**
     * Liste des conversations récentes de l'utilisateur :
     * retourne le dernier message de chaque interlocuteur distinct.
     */
    @Query(value = """
        SELECT DISTINCT ON (
            LEAST(m.expediteur_id, m.destinataire_id),
            GREATEST(m.expediteur_id, m.destinataire_id)
        ) m.*
        FROM messages m
        WHERE m.expediteur_id = :userId OR m.destinataire_id = :userId
        ORDER BY
            LEAST(m.expediteur_id, m.destinataire_id),
            GREATEST(m.expediteur_id, m.destinataire_id),
            m.date_envoi DESC
    """, nativeQuery = true)
    List<Message> findDerniersMessages(@Param("userId") Long userId);

    /**
     * Nombre de messages non lus envoyés par un expéditeur précis.
     */
    long countByDestinataireAndExpediteureAndLuFalse(
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
