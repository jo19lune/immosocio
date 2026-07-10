package com.projet.immobiliersocial.config;

import com.projet.immobiliersocial.entity.Role;
import com.projet.immobiliersocial.entity.Theme;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.entity.VisibilitePublication;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeder automatique pour insérer un super administrateur et un administrateur
 * au démarrage de l'application si ces derniers n'existent pas déjà en base de données.
 * Les informations d'identification sont récupérées depuis le fichier .env.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SUPER_ADMIN_MAIL:ra.joachimloick@gmail.com}")
    private String superAdminMail;

    @Value("${SUPER_ADMIN_PASSWORD:iamsuperadmin}")
    private String superAdminPassword;

    @Value("${ADMIN_MAIL:joachimloick939@gmail.com}")
    private String adminMail;

    @Value("${ADMIN_PASSWORD:iamadmin}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        seedSuperAdmin();
        seedAdmin();
    }

    private void seedSuperAdmin() {
        if (!utilisateurRepository.existsByEmail(superAdminMail)) {
            Utilisateur superAdmin = Utilisateur.builder()
                    .email(superAdminMail)
                    .motDePasse(passwordEncoder.encode(superAdminPassword))
                    .nom("Super")
                    .prenom("Admin")
                    .telephone("+33600000001")
                    .role(Role.SUPERADMIN)
                    .actif(true)
                    .emailVerifie(true)
                    .theme(Theme.SYSTEME)
                    .visibiliteParDefaut(VisibilitePublication.PUBLIC)
                    .notificationsEmail(true)
                    .notificationsPush(true)
                    .build();

            utilisateurRepository.save(superAdmin);
            log.info("Super administrateur créé avec succès : {}", superAdminMail);
        } else {
            log.info("Le super administrateur existe déjà : {}", superAdminMail);
        }
    }

    private void seedAdmin() {
        if (!utilisateurRepository.existsByEmail(adminMail)) {
            Utilisateur admin = Utilisateur.builder()
                    .email(adminMail)
                    .motDePasse(passwordEncoder.encode(adminPassword))
                    .nom("Joachim")
                    .prenom("Loick")
                    .telephone("+33600000002")
                    .role(Role.ADMIN)
                    .actif(true)
                    .emailVerifie(true)
                    .theme(Theme.SYSTEME)
                    .visibiliteParDefaut(VisibilitePublication.PUBLIC)
                    .notificationsEmail(true)
                    .notificationsPush(true)
                    .build();

            utilisateurRepository.save(admin);
            log.info("Administrateur créé avec succès : {}", adminMail);
        } else {
            log.info("L'administrateur existe déjà : {}", adminMail);
        }
    }
}
