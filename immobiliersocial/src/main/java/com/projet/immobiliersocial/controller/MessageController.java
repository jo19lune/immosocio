package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Message;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.repository.MessageRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur de messagerie privée.
 *
 * Endpoints :
 *   GET    /api/messages/conversations         → liste des conversations récentes
 *   GET    /api/messages/{userId}?page=&size=  → messages d'une conversation
 *   POST   /api/messages/{userId}              → envoyer un message
 *   PATCH  /api/messages/{userId}/lu           → marquer conversation comme lue
 *   GET    /api/messages/non-lus               → nombre de messages non lus
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationWebSocketService wsService;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/messages/conversations
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/conversations")
    public ResponseEntity<List<Message>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = getUtilisateur(userDetails);
        return ResponseEntity.ok(messageRepository.findDerniersMessages(moi.getId()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/messages/non-lus
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/non-lus")
    public ResponseEntity<Map<String, Long>> getNonLus(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = getUtilisateur(userDetails);
        long count = messageRepository.countByDestinataireAndLuFalse(moi);
        return ResponseEntity.ok(Map.of("nonLus", count));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/messages/{userId}?page=0&size=30
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/{userId}")
    public ResponseEntity<Page<Message>> getConversation(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = getUtilisateur(userDetails);
        Utilisateur interlocuteur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Marquer les messages reçus de cet interlocuteur comme lus
        messageRepository.marquerConversationLue(moi, interlocuteur);

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageRepository.findConversation(moi, interlocuteur, pageable));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/messages/{userId}
    // Body : { "contenu": "...", "mediaUrl": "..." (optionnel) }
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/{userId}")
    public ResponseEntity<?> envoyerMessage(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (body == null || body.get("contenu") == null || body.get("contenu").isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Le contenu du message est requis"));
        }

        Utilisateur expediteur = getUtilisateur(userDetails);
        Utilisateur destinataire = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Destinataire introuvable"));

        if (expediteur.getId().equals(destinataire.getId())) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Vous ne pouvez pas vous envoyer un message"));
        }

        Message message = Message.builder()
                .contenu(body.get("contenu"))
                .mediaUrl(body.get("mediaUrl"))
                .expediteur(expediteur)
                .destinataire(destinataire)
                .build();

        Message saved = messageRepository.save(message);

        // Notification WebSocket temps réel au destinataire
        wsService.envoyerNotification(destinataire.getEmail(), Map.of(
                "type", "NOUVEAU_MESSAGE",
                "message", expediteur.getPrenom() + " " + expediteur.getNom() + " vous a envoyé un message",
                "expediteurId", expediteur.getId(),
                "messageId", saved.getId()
        ));

        return ResponseEntity.ok(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/messages/{userId}/lu
    // ─────────────────────────────────────────────────────────────────────────
    @PatchMapping("/{userId}/lu")
    public ResponseEntity<Map<String, String>> marquerLu(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur moi = getUtilisateur(userDetails);
        Utilisateur interlocuteur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        messageRepository.marquerConversationLue(moi, interlocuteur);
        return ResponseEntity.ok(Map.of("message", "Conversation marquée comme lue"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    private Utilisateur getUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }
}
