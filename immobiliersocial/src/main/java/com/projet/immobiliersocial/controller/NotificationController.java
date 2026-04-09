package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.repository.*;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * GET /api/notifications
     * Notifications de l'utilisateur connecté
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Notification>> mesNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationRepository.findByDestinataireOrderByDateCreationDesc(user, pageable));
    }

    /**
     * GET /api/notifications/count
     * Nombre de notifications non lues
     */
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> countNonLues(@AuthenticationPrincipal UserDetails userDetails) {
        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        long count = notificationRepository.countByDestinataireAndLueFalse(user);
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    /**
     * PATCH /api/notifications/{id}/lire
     * Marquer une notification comme lue
     */
    @PatchMapping("/{id}/lire")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> marquerLue(@PathVariable @NonNull Long id) {
        Notification notif = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification introuvable"));
        notif.setLue(true);
        return ResponseEntity.ok(notificationRepository.save(notif));
    }
}
