package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.*;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireRepository commentaireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ReactionCommentaireRepository reactionCommentaireRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService wsService;

    @PostMapping("/{id}/reponses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Commentaire> repondre(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu de la réponse est obligatoire");
        }

        Commentaire parent = commentaireRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire parent introuvable"));

        Utilisateur auteur = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        Commentaire reponse = Commentaire.builder()
                .contenu(contenu)
                .auteur(auteur)
                .publication(parent.getPublication())
                .parent(parent)
                .build();

        Commentaire saved = commentaireRepository.save(reponse);

        // Envoyer une notification au parent si ce n'est pas lui-même
        if (!parent.getAuteur().getEmail().equals(auteur.getEmail())) {
            Notification notification = Notification.builder()
                    .destinataire(parent.getAuteur())
                    .message(auteur.getNom() + " a répondu à votre commentaire")
                    .type(TypeNotification.NOUVEAU_COMMENTAIRE) // Reuse type
                    .routeCible("/profil/" + parent.getPublication().getAuteur().getId() + "?publicationId=" + parent.getPublication().getId())
                    .build();
            notification = notificationRepository.save(notification);

            wsService.envoyerNotification(parent.getAuteur().getEmail(), Map.of(
                    "type", "NOUVEAU_COMMENTAIRE",
                    "message", notification.getMessage(),
                    "id", notification.getId(),
                    "publicationId", parent.getPublication().getId(),
                    "dateCreation", notification.getDateCreation(),
                    "routeCible", notification.getRouteCible()
            ));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/reactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> reagir(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String type = body != null ? body.get("type") : null;
        if (type == null || type.isBlank()) {
            type = "LIKE"; // Default
        }

        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire introuvable"));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        reactionCommentaireRepository.findByCommentaireIdAndUtilisateurId(commentaire.getId(), utilisateur.getId())
                .ifPresentOrElse(
                        reaction -> {
                            // If same type, toggle off (delete)
                            if (reaction.getType().equals(body.get("type"))) {
                                reactionCommentaireRepository.delete(reaction);
                            } else {
                                // Change type
                                reaction.setType(body.get("type"));
                                reactionCommentaireRepository.save(reaction);
                            }
                        },
                        () -> {
                            ReactionCommentaire reaction = ReactionCommentaire.builder()
                                    .commentaire(commentaire)
                                    .utilisateur(utilisateur)
                                    .type(body.get("type") != null ? body.get("type") : "LIKE")
                                    .build();
                            reactionCommentaireRepository.save(reaction);
                        }
                );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Réaction mise à jour"
        ));
    }
}
