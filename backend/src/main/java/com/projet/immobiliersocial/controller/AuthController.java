package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.*;
import com.projet.immobiliersocial.dto.ProfileUpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.projet.immobiliersocial.entity.Role;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.security.JwtUtils;
import com.projet.immobiliersocial.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Contrôleur REST pour l'authentification et la gestion du compte utilisateur.
 *
 * <p>Endpoints publics (sans JWT) :</p>
 * <ul>
 *   <li>POST /api/auth/login               — connexion</li>
 *   <li>POST /api/auth/register            — inscription</li>
 *   <li>GET  /api/auth/verify-email        — vérification de l'email</li>
 *   <li>POST /api/auth/resend-verification — renvoi du mail de vérification</li>
 *   <li>POST /api/auth/forgot-password     — demande de réinitialisation</li>
 *   <li>POST /api/auth/reset-password      — application du nouveau mot de passe</li>
 * </ul>
 *
 * <p>Endpoint authentifié :</p>
 * <ul>
 *   <li>POST /api/auth/change-password — changement de mot de passe</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;

    // ─── POST /api/auth/login ─────────────────────────────────────────────────

    /**
     * Authentifie un utilisateur et retourne un JWT.
     *
     * @param request email + mot de passe
     * @return 200 avec {@link AuthResponse} ou 401/403 en cas d'échec
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErreurSimple("Email ou mot de passe incorrect"));
        }

        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (!user.isActif()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErreurSimple("Compte désactivé. Contactez l'assistance."));
        }

        if (!user.isEmailVerifie()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErreurSimple("Veuillez vérifier votre adresse email avant de vous connecter."));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtils.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(
                token, user.getId(), user.getEmail(),
                user.getNom(), user.getPrenom(),
                user.getRole().name(), user.getPhoto(),
                user.getTelephone(), user.isEmailVerifie()
        ));
    }

    // ─── POST /api/auth/register ──────────────────────────────────────────────

    /**
     * Inscrit un nouvel utilisateur avec le rôle LOCATAIRE ou PROPRIETAIRE.
     *
     * <p>Le rôle ADMIN ne peut pas être attribué lors d'une inscription publique.</p>
     *
     * @param request données d'inscription (validées par @Valid)
     * @return 201 Created ou 400 si l'email est déjà utilisé
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Empêcher l'auto-attribution des rôles privilégiés
        if (Role.ADMIN.equals(request.getRole()) || Role.SUPERADMIN.equals(request.getRole())) {
            return ResponseEntity.badRequest()
                    .body(new ErreurSimple("Les rôles ADMIN et SUPERADMIN ne peuvent pas être attribués à l'inscription"));
        }

        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new ErreurSimple("Cette adresse email est déjà associée à un compte"));
        }

        String tokenVerif = UUID.randomUUID().toString();

        Utilisateur user = Utilisateur.builder()
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .role(request.getRole())
                .actif(true)
                .emailVerifie(false)
                .tokenVerificationEmail(tokenVerif)
                .tokenVerificationEmailExpiration(LocalDateTime.now().plusHours(24))
                .build();

        utilisateurRepository.save(user);

        // L'envoi d'email est non-bloquant : un échec SMTP ne fait pas échouer l'inscription
        try {
            emailService.envoyerVerificationEmail(user.getEmail(), user.getPrenom(), tokenVerif);
        } catch (Exception e) {
            // Échec silencieux — l'utilisateur peut redemander via /resend-verification
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Inscription réussie. Vérifiez votre email pour activer votre compte.");
    }

    // ─── GET /api/auth/verify-email?token=... ─────────────────────────────────

    /**
     * Valide le token de vérification d'email envoyé par email.
     *
     * @param token UUID généré lors de l'inscription
     * @return 200 si la vérification réussit, 400 si le token est invalide ou expiré
     */
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifierEmail(@RequestParam String token) {
        Utilisateur user = utilisateurRepository.findByTokenVerificationEmail(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Token de vérification invalide ou déjà utilisé"));

        if (user.getTokenVerificationEmailExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(new ErreurSimple("Token expiré. Demandez un nouvel email via /resend-verification."));
        }

        user.setEmailVerifie(true);
        user.setTokenVerificationEmail(null);
        user.setTokenVerificationEmailExpiration(null);
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
    }

    // ─── POST /api/auth/resend-verification ───────────────────────────────────

    /**
     * Renvoie l'email de vérification pour un compte non encore vérifié.
     *
     * <p>La réponse est volontairement générique pour ne pas révéler
     * l'existence d'un compte.</p>
     *
     * @param request email du compte concerné
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<String> renvoyerVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        String reponseGenerique = "Si ce compte existe et n'est pas encore vérifié, un email a été envoyé.";

        utilisateurRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (!user.isEmailVerifie()) {
                String token = UUID.randomUUID().toString();
                user.setTokenVerificationEmail(token);
                user.setTokenVerificationEmailExpiration(LocalDateTime.now().plusHours(24));
                utilisateurRepository.save(user);
                emailService.envoyerVerificationEmail(user.getEmail(), user.getPrenom(), token);
            }
        });

        return ResponseEntity.ok(reponseGenerique);
    }

    // ─── POST /api/auth/forgot-password ──────────────────────────────────────

    /**
     * Déclenche l'envoi d'un lien de réinitialisation du mot de passe.
     *
     * <p>La réponse est volontairement générique pour ne pas révéler
     * l'existence d'un compte (anti-énumération).</p>
     *
     * @param request email du compte
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> motDePasseOublie(@Valid @RequestBody ForgotPasswordRequest request) {
        String reponseGenerique =
                "Si un compte correspond à cet email, vous recevrez un lien de réinitialisation.";

        utilisateurRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (user.isActif()) {
                String token = UUID.randomUUID().toString();
                user.setTokenReinitialisationMdp(token);
                user.setTokenReinitialisationMdpExpiration(LocalDateTime.now().plusHours(1));
                utilisateurRepository.save(user);
                emailService.envoyerReinitialisationMdp(user.getEmail(), user.getPrenom(), token);
            }
        });

        return ResponseEntity.ok(reponseGenerique);
    }

    // ─── POST /api/auth/reset-password ───────────────────────────────────────

    /**
     * Applique un nouveau mot de passe à partir d'un token de réinitialisation.
     *
     * @param request token + nouveau mot de passe
     * @return 200 si réussi, 400 si le token est invalide ou expiré
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> reinitialiserMotDePasse(@Valid @RequestBody ResetPasswordRequest request) {
        Utilisateur user = utilisateurRepository
                .findByTokenReinitialisationMdp(request.getToken())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Token invalide ou déjà utilisé"));

        if (user.getTokenReinitialisationMdpExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(new ErreurSimple("Token expiré. Faites une nouvelle demande."));
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        user.setTokenReinitialisationMdp(null);
        user.setTokenReinitialisationMdpExpiration(null);
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Mot de passe réinitialisé avec succès.");
    }

    // ─── POST /api/auth/change-password — AUTHENTIFIÉ ────────────────────────

    /**
     * Permet à l'utilisateur connecté de changer son mot de passe.
     *
     * @param request ancien + nouveau mot de passe
     * @return 200 si réussi, 400 si l'ancien mot de passe est incorrect
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changerMotDePasse(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getAncienMotDePasse(), user.getMotDePasse())) {
            return ResponseEntity.badRequest()
                    .body(new ErreurSimple("Ancien mot de passe incorrect"));
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Mot de passe modifié avec succès.");
    }

    // ─── PUT /api/auth/profile — AUTHENTIFIÉ ─────────────────────────────────

    /**
     * Met à jour le profil de l'utilisateur connecté (nom, prénom, téléphone).
     * Mise à jour partielle : les champs null sont ignorés.
     *
     * @param request champs à mettre à jour
     * @return les données de profil mises à jour
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> mettreAJourProfil(
            @RequestBody ProfileUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (request.getNom() != null && !request.getNom().isBlank()) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getTelephone() != null) {
            user.setTelephone(request.getTelephone());
        }

        utilisateurRepository.save(user);

        return ResponseEntity.ok(new AuthResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                user.getPhoto(),
                user.getTelephone(),
                user.isEmailVerifie()
        ));
    }

    // ─── POST /api/auth/switch-role — AUTHENTIFIÉ ────────────────────────────

    /**
     * Bascule le rôle de l'utilisateur entre LOCATAIRE et PROPRIETAIRE.
     *
     * @return un nouveau token avec le rôle mis à jour
     */
    @PostMapping("/switch-role")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> switchRole(@AuthenticationPrincipal UserDetails userDetails) {
        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (user.getRole() == Role.LOCATAIRE) {
            user.setRole(Role.PROPRIETAIRE);
        } else if (user.getRole() == Role.PROPRIETAIRE) {
            user.setRole(Role.LOCATAIRE);
        } else {
            return ResponseEntity.badRequest().body(new ErreurSimple("Ce rôle ne peut pas être basculé"));
        }

        utilisateurRepository.save(user);

        UserDetails updatedUserDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newToken = jwtUtils.generateToken(updatedUserDetails);

        return ResponseEntity.ok(new AuthResponse(
                newToken, user.getId(), user.getEmail(),
                user.getNom(), user.getPrenom(),
                user.getRole().name(), user.getPhoto(),
                user.getTelephone(), user.isEmailVerifie()
        ));
    }

    // ─── DTO interne pour les réponses d'erreur simples ───────────────────────

    /**
     * Enveloppe légère pour retourner un message d'erreur JSON ({@code {"message": "..."}}).
     * Utilisée uniquement dans ce contrôleur pour les cas où le {@link GlobalExceptionHandler}
     * ne s'applique pas directement.
     */
    private record ErreurSimple(String message) {}
}
