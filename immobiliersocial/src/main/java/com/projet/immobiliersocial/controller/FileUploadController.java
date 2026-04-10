package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.service.GoogleDriveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Contrôleur d'upload d'images vers Google Drive.
 *
 * Endpoints :
 *   POST /api/upload/image?type=publication  → upload image de publication
 *   POST /api/upload/image?type=profil       → upload photo de profil (met aussi à jour l'utilisateur)
 *   POST /api/upload/image?type=annonce      → upload photo d'annonce
 *
 * Retourne : { "url": "https://drive.google.com/uc?export=view&id=..." }
 */
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final GoogleDriveService driveService;
    private final UtilisateurRepository utilisateurRepository;

    public FileUploadController(GoogleDriveService driveService, UtilisateurRepository utilisateurRepository) {
        this.driveService = driveService;
        this.utilisateurRepository = utilisateurRepository;
    }

    /**
     * Upload d'une image.
     *
     * @param file  Le fichier image (multipart/form-data, champ "file")
     * @param type  Catégorie : "publication" | "profil" | "annonce"  (défaut: "publication")
     */
    @PostMapping("/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploaderImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "publication") String type,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Normaliser le type pour en faire un sous-dossier Drive
        String sousDossier = normaliserSousDossier(type);

        try {
            String url = driveService.uploaderImage(file, sousDossier);

            // Si c'est une photo de profil, mettre à jour l'utilisateur directement
            if ("profils".equals(sousDossier)) {
                Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

                // Supprimer l'ancienne photo si elle était sur Drive
                if (user.getPhoto() != null && ((String) user.getPhoto()).contains("drive.google.com")) {
                    driveService.supprimerImage(user.getPhoto());
                }
                user.setPhoto(url);
                utilisateurRepository.save(user);
            }

            return ResponseEntity.ok(Map.of("url", url));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("erreur", "Erreur lors de l'upload : " + e.getMessage()));
        }
    }

    private String normaliserSousDossier(String type) {
        return switch (type.toLowerCase()) {
            case "profil", "profils", "avatar" -> "profils";
            case "annonce", "annonces", "logement" -> "annonces";
            default -> "publications";
        };
    }
}
