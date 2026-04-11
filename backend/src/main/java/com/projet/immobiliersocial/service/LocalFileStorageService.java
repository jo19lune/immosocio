package com.projet.immobiliersocial.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Service de stockage local des images.
 *
 * Les fichiers sont enregistrés dans {@code app.upload.dir} (défaut : ./uploads).
 * L'URL publique retournée est de la forme :
 *   http://localhost:{port}/images/{sousDossier}/{uuid}.{ext}
 *
 * Le chemin /images/** est servi par WebMvcConfig et autorisé sans JWT dans SecurityConfig.
 */
@Service
public class LocalFileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);
    private static final long MAX_SIZE = 10L * 1024 * 1024; // 10 Mo

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${app.upload.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Sauvegarde l'image sur disque et retourne son URL publique.
     *
     * @param file       Fichier multipart reçu du client
     * @param sousDossier Sous-dossier logique (publications / profils / annonces)
     * @return URL directe utilisable dans un {@code <img src="...">}
     */
    public String sauvegarderImage(MultipartFile file, String sousDossier) throws IOException {
        valider(file);

        String extension = obtenirExtension(file.getOriginalFilename());
        String nomFichier = UUID.randomUUID() + "." + extension;

        Path dossier = Paths.get(uploadDir, sousDossier).toAbsolutePath().normalize();
        Files.createDirectories(dossier);

        Path destination = dossier.resolve(nomFichier);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String url = baseUrl + "/images/" + sousDossier + "/" + nomFichier;
        log.info("Image sauvegardée localement : {} -> {}", destination, url);
        return url;
    }

    /**
     * Supprime une image locale à partir de son URL publique.
     * Silencieux si le fichier n'existe pas ou si l'URL n'est pas locale.
     *
     * @param urlPublique URL de la forme {baseUrl}/images/{sous}/{fichier}
     */
    public void supprimerImage(String urlPublique) {
        if (urlPublique == null || (!urlPublique.contains("/images/") && !urlPublique.contains("/uploads/"))) {
            return;
        }
        try {
            int index = urlPublique.contains("/images/")
                    ? urlPublique.indexOf("/images/") + 8
                    : urlPublique.indexOf("/uploads/") + 9;
            String relativePath = urlPublique.substring(index);
            Path fichier = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();
            Files.deleteIfExists(fichier);
            log.info("Image supprimée : {}", fichier);
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'image {} : {}", urlPublique, e.getMessage());
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private void valider(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide ou absent");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Seules les images sont acceptées (image/jpeg, image/png, image/webp)");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("La taille de l'image ne doit pas dépasser 10 Mo");
        }
    }

    private String obtenirExtension(String nomFichier) {
        if (nomFichier != null && nomFichier.contains(".")) {
            return nomFichier.substring(nomFichier.lastIndexOf('.') + 1).toLowerCase();
        }
        return "jpg";
    }
}
