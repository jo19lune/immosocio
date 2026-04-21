package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.ParametresRequest;
import com.projet.immobiliersocial.dto.ParametresResponse;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour les préférences personnelles de l'utilisateur.
 *
 * <ul>
 *   <li>GET /api/parametres — lire les préférences de l'utilisateur connecté</li>
 *   <li>PUT /api/parametres — mettre à jour les préférences (mise à jour partielle : les champs null sont ignorés)</li>
 * </ul>
 *
 * <p>Tous les endpoints nécessitent une authentification.</p>
 */
@RestController
@RequestMapping("/api/parametres")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SuppressWarnings("null")
public class ParametresController {

    private final UtilisateurRepository utilisateurRepository;

    // ─── GET /api/parametres ──────────────────────────────────────────────────

    /**
     * Retourne les préférences actuelles de l'utilisateur connecté.
     *
     * @return thème, visibilité par défaut, préférences de notifications et statut email
     */
    @GetMapping
    public ResponseEntity<ParametresResponse> getParametres(
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = resolveUtilisateur(userDetails);
        return ResponseEntity.ok(toResponse(user));
    }

    // ─── PUT /api/parametres ──────────────────────────────────────────────────

    /**
     * Met à jour les préférences de l'utilisateur connecté.
     *
     * <p>La mise à jour est partielle : seuls les champs non-null du corps de la
     * requête sont appliqués, les autres conservent leur valeur actuelle.</p>
     *
     * @param request préférences à mettre à jour (les champs null sont ignorés)
     * @return les préférences mises à jour
     */
    @PutMapping
    public ResponseEntity<ParametresResponse> updateParametres(
            @RequestBody ParametresRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = resolveUtilisateur(userDetails);

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
        return ResponseEntity.ok(toResponse(user));
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    /**
     * Convertit un {@link Utilisateur} en {@link ParametresResponse} DTO.
     *
     * @param user entité utilisateur source
     * @return DTO prêt à être sérialisé en JSON
     */
    private ParametresResponse toResponse(Utilisateur user) {
        return ParametresResponse.builder()
                .theme(user.getTheme())
                .visibiliteParDefaut(user.getVisibiliteParDefaut())
                .notificationsEmail(user.isNotificationsEmail())
                .notificationsPush(user.isNotificationsPush())
                .emailVerifie(user.isEmailVerifie())
                .build();
    }
}
