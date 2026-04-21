package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.service.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Contrôleur REST pour l'upload d'images (stockage local).
 *
 * <p>Endpoint unique :</p>
 * <pre>
 *   POST /api/upload/image?type=publication|profil|annonce
 * </pre>
 *
 * <p>Retourne :</p>
 * <pre>
 *   { "url": "http://localhost:8080/images/{sous-dossier}/{uuid}.{ext}" }
 * </pre>
 *
 * <p>Pour le type {@code profil}, l'URL est automatiquement enregistrée
 * sur le profil de l'utilisateur connecté et l'ancienne image est supprimée.</p>
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SuppressWarnings("null")
public class FileUploadController {

    private final LocalFileStorageService storageService;
    private final UtilisateurRepository utilisateurRepository;

    // ─── POST /api/upload/image ───────────────────────────────────────────────

    /**
     * Uploade une image en local et retourne son URL publique.
     *
     * <p>Types acceptés :</p>
     * <ul>
     *   <li>{@code publication} (défaut) — images du fil d'actualité</li>
     *   <li>{@code profil} — photo de profil (mise à jour automatique)</li>
     *   <li>{@code annonce} — photos d'annonces immobilières</li>
     * </ul>
     *
     * @param file        fichier image (champ multipart {@code file})
     * @param type        catégorie de l'image (détermine le sous-dossier)
     * @param userDetails utilisateur connecté (injection Spring Security)
     * @return {@code { "url": "..." }} ou une erreur JSON
     */
    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploaderImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "publication") String type,
            @AuthenticationPrincipal UserDetails userDetails) {

        String sousDossier = normaliserSousDossier(type);

        try {
            String url = storageService.sauvegarderImage(file, sousDossier);

            // Mise à jour automatique de la photo de profil
            if ("profils".equals(sousDossier)) {
                mettreAJourPhotoProfil(userDetails.getUsername(), url);
            }

            return ResponseEntity.ok(Map.of("url", url));

        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de la sauvegarde de l'image : " + e.getMessage());
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private String normaliserSousDossier(String type) {
        return switch (type.toLowerCase()) {
            case "profil", "profils", "avatar" -> "profils";
            case "annonce", "annonces", "logement" -> "annonces";
            default -> "publications";
        };
    }

    private void mettreAJourPhotoProfil(String email, String nouvelleUrl) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        // Supprimer l'ancienne image locale avant remplacement
        if (user.getPhoto() != null) {
            storageService.supprimerImage(user.getPhoto());
        }

        user.setPhoto(nouvelleUrl);
        utilisateurRepository.save(user);
    }
}
