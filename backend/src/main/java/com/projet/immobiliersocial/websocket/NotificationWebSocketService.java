package com.projet.immobiliersocial.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Envoie une notification personnelle à un utilisateur précis.
     * Le client doit s'abonner à /user/queue/notifications
     *
     * @param email   email de l'utilisateur destinataire (= username Spring Security)
     * @param payload objet à sérialiser en JSON
     */
    public void envoyerNotification(String email, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(email, "/queue/notifications", payload);
            log.debug("Notification WS envoyée à {}", email);
        } catch (Exception e) {
            log.error("Erreur envoi notification WS à {} : {}", email, e.getMessage());
        }
    }

    /**
     * Diffuse un message à tous les abonnés d'un topic public.
     * Exemple : /topic/annonces — nouvelle annonce publiée
     *
     * @param topic   chemin du topic (ex: "/topic/annonces")
     * @param payload objet à diffuser
     */
    public void diffuser(String topic, Object payload) {
        try {
            messagingTemplate.convertAndSend(topic, payload);
            log.debug("Diffusion WS sur {}", topic);
        } catch (Exception e) {
            log.error("Erreur diffusion WS sur {} : {}", topic, e.getMessage());
        }
    }
}
