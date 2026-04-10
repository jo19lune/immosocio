package com.projet.immobiliersocial.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

/**
 * Configuration du client Google Drive.
 *
 * PRÉREQUIS :
 * 1. Créer un projet sur https://console.cloud.google.com
 * 2. Activer l'API Google Drive
 * 3. Créer un compte de service (Service Account)
 * 4. Télécharger le fichier JSON du compte de service
 * 5. Placer ce fichier dans
 * src/main/resources/friendly-plane-492912-j4-fd4d6b6c228c.json
 * 6. Créer un dossier dans Google Drive et partager avec l'email du compte de
 * service
 * 7. Renseigner app.google.drive.folder-id dans application.properties
 *
 * NOTE : Le bean est nommé "googleDriveClient" (pas "googleDriveService")
 * pour éviter toute collision avec GoogleDriveService (@Service).
 */
@Configuration
public class GoogleDriveConfig {

    @Value("${app.google.drive.credentials-path}")
    private Resource credentialsResource;

    @Value("${app.google.drive.application-name}")
    private String applicationName;

    /**
     * Bean du client Drive — nommé "googleDriveClient" pour ne pas entrer en
     * conflit avec le @Service GoogleDriveService (bean "googleDriveService").
     *
     * GoogleDriveService l'injecte par TYPE (Drive), pas par nom.
     */
    @Bean(name = "googleDriveClient")
    public Drive googleDriveClient() throws IOException, GeneralSecurityException {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsResource.getInputStream())
                .createScoped(List.of(DriveScopes.DRIVE));

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName(applicationName)
                .build();
    }
}
