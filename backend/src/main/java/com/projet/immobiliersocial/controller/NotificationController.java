package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Notification;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.NotificationRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur REST pour les notifications utilisateur.
 *
 * <ul>
 *   <li>GET   /api/notifications              — liste paginée des notifications</li>
 *   <li>GET   /api/notifications/count        — nombre de notifications non lues</li>
 *   <li>PATCH /api/notifications/{id}/lire    — marquer une notification comme lue</li>
 *   <li>PATCH /api/notifications/tout-lire    — marquer toutes les notifications comme lues</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SuppressWarnings("null")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ─── GET /api/notifications ───────────────────────────────────────────────

    /**
     * Retourne les notifications de l'utilisateur connecté, paginées et triées
     * par date décroissante (les plus récentes en premier).
     *
     * @param page numéro de page (défaut : 0)
     * @param size éléments par page (défaut : 20)
     */
    @GetMapping
    public ResponseEntity<Page<Notification>> mesNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Utilisateur user = resolveUtilisateur(userDetails);
        return ResponseEntity.ok(
            notificationRepository.findByDestinataireOrderByDateCreationDesc(
                user, PageRequest.of(page, size))
        );
    }

    // ─── GET /api/notifications/count ─────────────────────────────────────────

    /**
     * Retourne le nombre de notifications non lues de l'utilisateur connecté.
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countNonLues(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = resolveUtilisateur(userDetails);
        long count = notificationRepository.countByDestinataireAndLueFalse(user);
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    // ─── PATCH /api/notifications/{id}/lire ──────────────────────────────────

    /**
     * Marque une notification spécifique comme lue.
     *
     * <p>Vérifie que la notification appartient bien à l'utilisateur connecté
     * avant toute modification.</p>
     *
     * @param id identifiant de la notification
     * @throws ApiException 404 si introuvable, 403 si la notification appartient à quelqu'un d'autre
     */
    @PatchMapping("/{id}/lire")
    public ResponseEntity<Notification> marquerLue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification introuvable"));

        if (!notif.getDestinataire().getEmail().equals(userDetails.getUsername())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        notif.setLue(true);
        return ResponseEntity.ok(notificationRepository.save(notif));
    }

    // ─── PATCH /api/notifications/tout-lire ──────────────────────────────────

    /**
     * Marque toutes les notifications non lues de l'utilisateur comme lues
     * en une seule requête SQL UPDATE (évite le problème N+1).
     */
    @PatchMapping("/tout-lire")
    public ResponseEntity<Map<String, String>> toutMarquerLu(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = resolveUtilisateur(userDetails);
        notificationRepository.marquerToutesLues(user);
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications marquées comme lues"));
    }

    /**
     * PATCH /api/notifications/marquer-lus-par-route?routeCible=/path
     * Marque comme lues les notifications d'un utilisateur pour une route spécifique
     * (ex: auto-read pour chat /messages/123 actif).
     */
    @PatchMapping("/marquer-lus-par-route")
    public ResponseEntity<Map<String, String>> marquerLusParRoute(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String routeCible) {

        Utilisateur user = resolveUtilisateur(userDetails);
        notificationRepository.marquerLuesParRoute(user, routeCible);
        return ResponseEntity.ok(Map.of("message", "Notifications de cette route marquées comme lues"));
    }

    // ─── Helper privé ─────────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }
}
