package com.projet.immobiliersocial.service;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Service de stockage des images via Google Drive.
 *
 * Fonctionnement :
 * - Chaque fichier uploadé reçoit un UUID comme nom pour éviter les conflits
 * - Le fichier est rendu public (lecture) via l'API Permissions
 * - L'URL publique retournée peut être stockée directement en base
 *   (champ photos[] de Annonce, medias[] de Publication, photo de Utilisateur)
 */
@Service
public class GoogleDriveService {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveService.class);

    private final Drive driveClient;

    @Value("${app.google.drive.folder-id}")
    private String folderId;

    public GoogleDriveService(@Qualifier("googleDriveClient") Drive driveClient) {
        this.driveClient = driveClient;
    }

    /**
     * Uploade un fichier image vers Google Drive.
     *
     * @param file       Le MultipartFile reçu du client
     * @param sousDossier Nom du sous-dossier logique (ex: "publications", "profils", "annonces")
     * @return URL publique accessible directement dans un <img>
     */
    public String uploaderImage(MultipartFile file, String sousDossier) throws IOException {
        validerImage(file);

        // Nom unique : sous-dossier/UUID.extension
        String extension = obtenirExtension(file.getOriginalFilename());
        String nomFichier = sousDossier + "/" + UUID.randomUUID() + "." + extension;

        // Métadonnées Drive
        File metadonnees = new File();
        metadonnees.setName(nomFichier);
        metadonnees.setParents(List.of(folderId));
        metadonnees.setMimeType(file.getContentType());

        // Contenu
        InputStreamContent contenu = new InputStreamContent(
                file.getContentType(),
                file.getInputStream()
        );

        // Upload
        File fichierCree = driveClient.files()
                .create(metadonnees, contenu)
                .setFields("id, name, webContentLink, webViewLink")
                .execute();

        // Rendre public (lecture seule par tout le monde)
        rendrePublic(fichierCree.getId());

        // URL directe pour affichage dans <img src="...">
        String urlDirecte = "https://drive.google.com/uc?export=view&id=" + fichierCree.getId();
        log.info("Image uploadée sur Drive : {} -> {}", nomFichier, urlDirecte);
        return urlDirecte;
    }

    /**
     * Supprime un fichier sur Google Drive à partir de son URL publique.
     *
     * @param urlPublique URL de la forme https://drive.google.com/uc?export=view&id=FILE_ID
     */
    public void supprimerImage(String urlPublique) {
        String fileId = extraireFileId(urlPublique);
        if (fileId == null) {
            return;
        }
        try {
            driveClient.files().delete(fileId).execute();
            log.info("Image supprimée du Drive : {}", fileId);
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'image Drive {} : {}", urlPublique, e.getMessage());
        }
    }

    // ─── Méthodes privées ────────────────────────────────────────────────────

    private void rendrePublic(String fileId) throws IOException {
        Permission permission = new Permission()
                .setType("anyone")
                .setRole("reader");
        driveClient.permissions().create(fileId, permission).execute();
    }

    private void validerImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide ou absent");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Seules les images sont acceptées (image/jpeg, image/png, image/webp)");
        }
        // Limite 10 Mo
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("La taille de l'image ne doit pas dépasser 10 Mo");
        }
    }

    private String extraireFileId(String urlPublique) {
        if (urlPublique == null || !urlPublique.contains("id=")) {
            return null;
        }
        String fileId = urlPublique.substring(urlPublique.indexOf("id=") + 3);
        int fin = fileId.indexOf('&');
        return fin > 0 ? fileId.substring(0, fin) : fileId;
    }

    private String obtenirExtension(String nomFichier) {
        if (nomFichier != null && nomFichier.contains(".")) {
            return nomFichier.substring(nomFichier.lastIndexOf('.') + 1).toLowerCase();
        }
        return "jpg";
    }
}
