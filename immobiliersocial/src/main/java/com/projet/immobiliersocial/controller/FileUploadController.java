package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.service.GoogleDriveService;
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
 * Contrôleur REST pour l'upload d'images vers Google Drive.
 *
 * <p>Endpoint unique :</p>
 * <pre>
 *   POST /api/upload/image?type=publication|profil|annonce
 * </pre>
 *
 * <p>Retourne :</p>
 * <pre>
 *   { "url": "https://drive.google.com/uc?export=view&id=..." }
 * </pre>
 *
 * <p>Cas particulier du type {@code profil} : l'URL est automatiquement
 * enregistrée sur le profil de l'utilisateur connecté, et l'ancienne photo
 * éventuellement hébergée sur Drive est supprimée.</p>
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FileUploadController {

    private final GoogleDriveService driveService;
    private final UtilisateurRepository utilisateurRepository;

    // ─── POST /api/upload/image ───────────────────────────────────────────────

    /**
     * Upload une image vers Google Drive et retourne son URL publique.
     *
     * <p>Types acceptés :</p>
     * <ul>
     *   <li>{@code publication} (défaut) — images pour les publications du fil</li>
     *   <li>{@code profil} — photo de profil utilisateur (mise à jour automatique)</li>
     *   <li>{@code annonce} — photos pour les annonces immobilières</li>
     * </ul>
     *
     * @param file le fichier image (champ multipart {@code file})
     * @param type catégorie de l'image (détermine le sous-dossier Drive)
     * @return {@code { "url": "..." }} ou une erreur JSON
     * @throws ApiException 400 si le fichier est invalide, 500 en cas d'erreur Drive
     */
    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploaderImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "publication") String type,
            @AuthenticationPrincipal UserDetails userDetails) {

        String sousDossier = normaliserSousDossier(type);

        try {
            String url = driveService.uploaderImage(file, sousDossier);

            // Pour une photo de profil, mettre à jour l'entité utilisateur en base
            if ("profils".equals(sousDossier)) {
                mettreAJourPhotoProfil(userDetails.getUsername(), url);
            }

            return ResponseEntity.ok(Map.of("url", url));

        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de l'upload vers Google Drive : " + e.getMessage());
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    /**
     * Normalise le paramètre {@code type} en un nom de sous-dossier Drive cohérent.
     *
     * @param type valeur brute du paramètre de requête
     * @return sous-dossier Drive : {@code "profils"}, {@code "annonces"} ou {@code "publications"}
     */
    private String normaliserSousDossier(String type) {
        return switch (type.toLowerCase()) {
            case "profil", "profils", "avatar" -> "profils";
            case "annonce", "annonces", "logement" -> "annonces";
            default -> "publications";
        };
    }

    /**
     * Met à jour la photo de profil de l'utilisateur, en supprimant l'ancienne
     * image Drive si elle existe.
     *
     * @param email email de l'utilisateur connecté
     * @param nouvelleUrl URL Drive de la nouvelle photo
     */
    private void mettreAJourPhotoProfil(String email, String nouvelleUrl) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        // Supprimer l'ancienne photo Drive avant de la remplacer
        if (user.getPhoto() != null && user.getPhoto().contains("drive.google.com")) {
            driveService.supprimerImage(user.getPhoto());
        }

        user.setPhoto(nouvelleUrl);
        utilisateurRepository.save(user);
    }
}
