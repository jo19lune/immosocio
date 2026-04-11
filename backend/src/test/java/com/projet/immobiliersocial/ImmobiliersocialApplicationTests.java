package com.projet.immobiliersocial;

import com.google.api.services.drive.Drive;
import com.projet.immobiliersocial.service.GoogleDriveService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;

/**
 * Test de démarrage du contexte Spring.
 *
 * Google Drive et le service associé sont mockés pour éviter toute
 * tentative de connexion réseau ou de lecture de credentials réels
 * en CI/CD et en développement local.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "app.google.drive.credentials-path=classpath:test-credentials-placeholder.json",
    "app.google.drive.folder-id=test-folder-id",
    "app.google.drive.application-name=ImmobilierSocial-Test",
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "FRONTEND_URL=http://localhost:4200",
    "MAIL_USERNAME=noreply@immobiliersocial.com",
    "MAIL_PASSWORD=dummy",
    "PORT=8080",
    "JWT_SECRET=superSecretKeyForTestEnvironmentsThatIsLongEnough"
})
class ImmobiliersocialApplicationTests {

    /**
     * Mock du client Drive : empêche GoogleDriveConfig d'essayer de lire
     * et de valider les credentials Google au démarrage du contexte de test.
     */
    @MockBean
    private Drive googleDriveClient;

    /**
     * Mock du service Drive : évite tout appel réseau vers Google Drive
     * pendant les tests.
     */
    @MockBean
    private GoogleDriveService googleDriveService;

    @Test
    void contextLoads() {
        // Vérifie que le contexte Spring démarre sans erreur
    }
}
