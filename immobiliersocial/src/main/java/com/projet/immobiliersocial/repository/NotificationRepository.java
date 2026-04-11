package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Notification;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repository JPA pour les notifications utilisateur.
 *
 * <p>La méthode {@link #marquerToutesLues(Utilisateur)} utilise une requête
 * {@code UPDATE} en lot pour éviter le problème N+1 que causerait un parcours
 * en boucle avec {@code save()} individuel.</p>
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Notifications d'un utilisateur, les plus récentes en premier.
     *
     * @param destinataire utilisateur propriétaire des notifications
     * @param pageable     paramètres de pagination
     * @return page de notifications triées par date décroissante
     */
    Page<Notification> findByDestinataireOrderByDateCreationDesc(
            Utilisateur destinataire, Pageable pageable);

    /**
     * Compte les notifications non lues d'un utilisateur.
     *
     * @param destinataire utilisateur cible
     * @return nombre de notifications avec {@code lue = false}
     */
    long countByDestinataireAndLueFalse(Utilisateur destinataire);

    /**
     * Marque en une seule requête SQL toutes les notifications non lues
     * d'un utilisateur comme lues.
     *
     * <p>Cette approche en lot est préférable à une boucle {@code save()}
     * qui générerait autant de requêtes UPDATE que de notifications.</p>
     *
     * @param destinataire utilisateur dont on marque les notifications
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lue = true WHERE n.destinataire = :dest AND n.lue = false")
    void marquerToutesLues(@Param("dest") Utilisateur destinataire);
}
