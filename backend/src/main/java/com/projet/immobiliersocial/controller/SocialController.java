package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;

/**
 * Contrôleur REST pour les interactions sociales entre utilisateurs.
 *
 * <ul>
 *   <li>POST /api/utilisateurs/{id}/suivre  — s'abonner / se désabonner d'un compte</li>
 *   <li>GET  /api/utilisateurs/{id}/suivi   — vérifier si on suit ce compte</li>
 * </ul>
 *
 * Quand un utilisateur s'abonne à un propriétaire, il reçoit une notification
 * chaque fois que ce dernier publie une nouvelle annonce (géré dans AnnonceController).
 */
@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@Slf4j
public class SocialController {

    private final UtilisateurRepository utilisateurRepository;

    /**
     * Bascule l'abonnement au compte d'un autre utilisateur (follow / unfollow).
     *
     * @param id          identifiant du compte à suivre
     * @param userDetails utilisateur connecté
     * @return {@code suivi: true/false} + message
     */
    @PostMapping("/{id}/suivre")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> suivreUtilisateur(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur suiveur = resolveUtilisateur(userDetails);

        if (Objects.equals(suiveur.getId(), id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas vous abonner à votre propre compte");
        }

        Utilisateur cible = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        boolean estSuivi = suiveur.getSuivisProprietaires().stream()
                .anyMatch(u -> Objects.equals(u.getId(), id));

        if (estSuivi) {
            suiveur.getSuivisProprietaires().removeIf(u -> Objects.equals(u.getId(), id));
        } else {
            suiveur.getSuivisProprietaires().add(cible);
        }
        utilisateurRepository.save(suiveur);

        boolean nowSuivi = !estSuivi;
        log.info("Utilisateur {} {} le compte {}", suiveur.getId(), nowSuivi ? "suit" : "ne suit plus", id);

        return ResponseEntity.ok(Map.of(
                "suivi", nowSuivi,
                "message", nowSuivi
                        ? "Vous suivez maintenant " + cible.getPrenom() + " " + cible.getNom()
                        : "Vous ne suivez plus " + cible.getPrenom() + " " + cible.getNom()
        ));
    }

    /**
     * Vérifie si l'utilisateur connecté suit le compte donné.
     *
     * @param id identifiant du compte
     * @return {@code suivi: true/false}
     */
    @GetMapping("/{id}/suivi")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkSuivi(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur suiveur = resolveUtilisateur(userDetails);
        boolean estSuivi = suiveur.getSuivisProprietaires().stream()
                .anyMatch(u -> Objects.equals(u.getId(), id));

        return ResponseEntity.ok(Map.of("suivi", estSuivi));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }
}
