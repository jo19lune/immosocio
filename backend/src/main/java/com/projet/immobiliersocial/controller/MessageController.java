package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Message;
import com.projet.immobiliersocial.entity.Notification;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.NotificationRepository;
import com.projet.immobiliersocial.repository.MessageRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la messagerie privée entre utilisateurs.
 *
 * <p>Tous les endpoints nécessitent une authentification.</p>
 *
 * <ul>
 *   <li>GET   /api/messages/conversations          — liste des conversations récentes</li>
 *   <li>GET   /api/messages/non-lus                — compteur de messages non lus</li>
 *   <li>GET   /api/messages/{userId}               — messages d'une conversation (paginés)</li>
 *   <li>POST  /api/messages/{userId}               — envoyer un message</li>
 *   <li>PATCH /api/messages/{userId}/lu            — marquer la conversation comme lue</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SuppressWarnings("null")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService wsService;

    // ─── GET /api/messages/conversations ─────────────────────────────────────

    /**
     * Retourne le dernier message de chaque conversation de l'utilisateur connecté,
     * triés par date d'envoi décroissante.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<Message>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = resolveUtilisateur(userDetails);
        return ResponseEntity.ok(messageRepository.findDerniersMessages(moi.getId()));
    }

    // ─── GET /api/messages/non-lus ────────────────────────────────────────────

    /**
     * Retourne le nombre total de messages non lus reçus par l'utilisateur connecté.
     */
    @GetMapping("/non-lus")
    public ResponseEntity<Map<String, Long>> getNonLus(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = resolveUtilisateur(userDetails);
        long count = messageRepository.countByDestinataireAndLuFalse(moi);
        return ResponseEntity.ok(Map.of("nonLus", count));
    }

    // ─── GET /api/messages/{userId} ───────────────────────────────────────────

    /**
     * Retourne les messages échangés avec un interlocuteur donné, paginés par date croissante.
     * Marque automatiquement comme lus les messages reçus de cet interlocuteur.
     *
     * @param userId identifiant de l'interlocuteur
     * @throws ApiException 404 si l'interlocuteur est introuvable
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Page<Message>> getConversation(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = resolveUtilisateur(userDetails);
        Utilisateur interlocuteur = resolveUtilisateurParId(userId);

        // Marquer les messages reçus comme lus lors de la consultation
        messageRepository.marquerConversationLue(moi, interlocuteur);

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateEnvoi").ascending());
        return ResponseEntity.ok(messageRepository.findConversation(moi, interlocuteur, pageable));
    }

    // ─── POST /api/messages/{userId} ──────────────────────────────────────────

    /**
     * Envoie un message à un autre utilisateur. Retourne HTTP 201 Created.
     *
     * <p>Le corps de la requête doit contenir {@code contenu} (obligatoire)
     * et optionnellement {@code mediaUrl}.</p>
     *
     * <p>Une notification WebSocket est envoyée en temps réel au destinataire.</p>
     *
     * @param userId identifiant du destinataire
     * @param body   {@code { "contenu": "...", "mediaUrl": "..." (optionnel) }}
     * @throws ApiException 400 si le contenu est vide ou si l'utilisateur s'envoie un message,
     *                      404 si le destinataire est introuvable
     */
    @PostMapping("/{userId}")
    public ResponseEntity<Message> envoyerMessage(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu du message est obligatoire");
        }

        Utilisateur expediteur = resolveUtilisateur(userDetails);
        Utilisateur destinataire = resolveUtilisateurParId(userId);

        if (expediteur.getId().equals(destinataire.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vous ne pouvez pas vous envoyer un message à vous-même");
        }

        Message message = Message.builder()
                .contenu(contenu)
                .mediaUrl(body != null ? body.get("mediaUrl") : null)
                .expediteur(expediteur)
                .destinataire(destinataire)
                .build();

        Message saved = messageRepository.save(message);

        Notification notification = Notification.builder()
                .destinataire(destinataire)
                .message(expediteur.getPrenom() + " " + expediteur.getNom() + " vous a envoyé un message")
                .type(com.projet.immobiliersocial.entity.TypeNotification.MESSAGE)
                .build();
        notification = notificationRepository.save(notification);

        wsService.envoyerNotification(destinataire.getEmail(), Map.of(
                "type", "MESSAGE",
                "message", notification.getMessage(),
                "id", notification.getId(),
                "expediteurId", expediteur.getId(),
                "messageId", saved.getId()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── PATCH /api/messages/{userId}/lu ──────────────────────────────────────

    /**
     * Marque comme lus tous les messages reçus de l'interlocuteur spécifié.
     *
     * @param userId identifiant de l'interlocuteur dont on a reçu des messages
     */
    @PatchMapping("/{userId}/lu")
    public ResponseEntity<Map<String, String>> marquerLu(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = resolveUtilisateur(userDetails);
        Utilisateur interlocuteur = resolveUtilisateurParId(userId);
        messageRepository.marquerConversationLue(moi, interlocuteur);
        return ResponseEntity.ok(Map.of("message", "Conversation marquée comme lue"));
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private Utilisateur resolveUtilisateurParId(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Utilisateur introuvable (id=" + id + ")"));
    }
}
