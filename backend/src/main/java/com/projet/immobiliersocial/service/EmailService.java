package com.projet.immobiliersocial.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@immobiliersocial.com}")
    private String fromEmail;

    // ─── Vérification d'email ─────────────────────────────────────────────────

    public void envoyerVerificationEmail(String destinataire, String prenom, String token) {
        String lien = frontendUrl + "/auth/verify-email?token=" + token;
        String sujet = "Vérifiez votre adresse email — Immobilier Social";
        String corps = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Bienvenue, %s !</h2>
              <p>Merci de vous être inscrit sur <strong>Immobilier Social</strong>.</p>
              <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
              <a href="%s"
                 style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                        text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0;">
                Vérifier mon email
              </a>
              <p style="color:#6b7280;font-size:13px;">
                Ce lien expire dans <strong>24 heures</strong>.<br>
                Si vous n'avez pas créé de compte, ignorez cet email.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#9ca3af;font-size:12px;">Immobilier Social — Plateforme immobilière communautaire</p>
            </div>
            """.formatted(prenom, lien);
        envoyerHtml(destinataire, sujet, corps);
    }

    // ─── Réinitialisation mot de passe ────────────────────────────────────────

    public void envoyerReinitialisationMdp(String destinataire, String prenom, String token) {
        String lien = frontendUrl + "/auth/reset-password?token=" + token;
        String sujet = "Réinitialisation de votre mot de passe — Immobilier Social";
        String corps = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">Réinitialisation de mot de passe</h2>
              <p>Bonjour <strong>%s</strong>,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <a href="%s"
                 style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;
                        text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0;">
                Réinitialiser mon mot de passe
              </a>
              <p style="color:#6b7280;font-size:13px;">
                Ce lien expire dans <strong>1 heure</strong>.<br>
                Si vous n'avez pas fait cette demande, ignorez cet email.
                Votre mot de passe reste inchangé.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#9ca3af;font-size:12px;">Immobilier Social — Plateforme immobilière communautaire</p>
            </div>
            """.formatted(prenom, lien);
        envoyerHtml(destinataire, sujet, corps);
    }

    // ─── Notification de disponibilité ────────────────────────────────────────

    public void envoyerNotificationDisponibilite(String destinataire, String prenom, String titreAnnonce, Long annonceId) {
        String lien = frontendUrl + "/annonces"; 
        String sujet = "L'annonce que vous suivez est de nouveau disponible !";
        String corps = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #059669;">Bonne nouvelle !</h2>
              <p>Bonjour <strong>%s</strong>,</p>
              <p>L'annonce <strong>"%s"</strong> est de nouveau disponible à la réservation.</p>
              <p>Dépêchez-vous d'aller la consulter avant qu'elle ne soit de nouveau réservée !</p>
              <a href="%s"
                 style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;
                        text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0;">
                Voir l'annonce
              </a>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#9ca3af;font-size:12px;">Immobilier Social — Plateforme immobilière communautaire</p>
            </div>
            """.formatted(prenom, titreAnnonce, lien);
        envoyerHtml(destinataire, sujet, corps);
    }

    // ─── Méthode interne ─────────────────────────────────────────────────────

    private void envoyerHtml(String destinataire, String sujet, String corps) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(corps, true);
            mailSender.send(message);
            log.info("Email envoyé à {} — sujet : {}", destinataire, sujet);
        } catch (Exception e) {
            log.error("Échec envoi email à {} : {}", destinataire, e.getMessage());
        }
    }
}
