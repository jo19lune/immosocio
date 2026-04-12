package com.projet.immobiliersocial;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Test de démarrage du contexte Spring.
 *
 * Utilise une base H2 en mémoire et des valeurs fictives pour le mail et le JWT
 * afin que le contexte démarre sans aucune dépendance externe.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.upload.dir=target/uploads-test",
    "app.upload.base-url=http://localhost:8080",
    "FRONTEND_URL=http://localhost:5173",
    "MAIL_USERNAME=noreply@immobiliersocial.com",
    "MAIL_PASSWORD=dummy",
    "PORT=8080",
    "JWT_SECRET=superSecretKeyForTestEnvironmentsThatIsLongEnoughXXXXXX"
})
class ImmobiliersocialApplicationTests {

    @Test
    void contextLoads() {
        // Vérifie que le contexte Spring démarre sans erreur
    }
}
