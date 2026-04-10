package com.projet.immobiliersocial;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Test de démarrage du contexte Spring.
 *
 * Google Drive est mocké via les propriétés de test pour éviter
 * l'erreur "credentials file not found" en CI/CD et en développement local.
 */
@SpringBootTest
@TestPropertySource(properties = {
    // Désactive Google Drive en contexte de test
    "app.google.drive.credentials-path=classpath:test-credentials-placeholder.json",
    "app.google.drive.folder-id=test-folder-id",
    "app.google.drive.application-name=ImmobilierSocial-Test",
    // Désactive l'envoi d'emails en test
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    // Base de données H2 en mémoire pour les tests
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ImmobiliersocialApplicationTests {

    @Test
    void contextLoads() {
        // Vérifie que le contexte Spring démarre sans erreur
    }
}
