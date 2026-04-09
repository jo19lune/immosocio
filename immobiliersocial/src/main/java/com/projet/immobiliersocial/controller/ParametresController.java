package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.ParametresRequest;
import com.projet.immobiliersocial.dto.ParametresResponse;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parametres")
@RequiredArgsConstructor
public class ParametresController {

    private final UtilisateurRepository utilisateurRepository;

    /**
     * GET /api/parametres
     * Récupère les préférences de l'utilisateur connecté
     */
    @GetMapping
    public ResponseEntity<ParametresResponse> getParametres(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        return ResponseEntity.ok(ParametresResponse.builder()
                .theme(user.getTheme())
                .visibiliteParDefaut(user.getVisibiliteParDefaut())
                .notificationsEmail(user.isNotificationsEmail())
                .notificationsPush(user.isNotificationsPush())
                .emailVerifie(user.isEmailVerifie())
                .build());
    }

    /**
     * PUT /api/parametres
     * Met à jour les préférences de l'utilisateur connecté
     * Les champs null sont ignorés (mise à jour partielle)
     */
    @PutMapping
    public ResponseEntity<ParametresResponse> updateParametres(
            @RequestBody ParametresRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (request.getTheme() != null) {
            user.setTheme(request.getTheme());
        }
        if (request.getVisibiliteParDefaut() != null) {
            user.setVisibiliteParDefaut(request.getVisibiliteParDefaut());
        }
        if (request.getNotificationsEmail() != null) {
            user.setNotificationsEmail(request.getNotificationsEmail());
        }
        if (request.getNotificationsPush() != null) {
            user.setNotificationsPush(request.getNotificationsPush());
        }

        utilisateurRepository.save(user);

        return ResponseEntity.ok(ParametresResponse.builder()
                .theme(user.getTheme())
                .visibiliteParDefaut(user.getVisibiliteParDefaut())
                .notificationsEmail(user.isNotificationsEmail())
                .notificationsPush(user.isNotificationsPush())
                .emailVerifie(user.isEmailVerifie())
                .build());
    }
}
