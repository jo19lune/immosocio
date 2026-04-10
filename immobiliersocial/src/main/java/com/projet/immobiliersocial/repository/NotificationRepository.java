package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.Notification;
import com.projet.immobiliersocial.entity.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByDestinataireOrderByDateCreationDesc(Utilisateur destinataire, Pageable pageable);
    long countByDestinataireAndLueFalse(Utilisateur destinataire);
    List<Notification> findByDestinataireAndLueFalse(Utilisateur destinataire);
}
