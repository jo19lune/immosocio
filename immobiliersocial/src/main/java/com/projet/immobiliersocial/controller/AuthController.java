package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.*;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.security.JwtUtils;
import com.projet.immobiliersocial.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;

    // =========================================================================
    // POST /api/auth/login — PUBLIC
    // =========================================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Email ou mot de passe incorrect");
        }

        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!user.isActif()) {
            return ResponseEntity.status(403).body("Compte désactivé");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtils.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(
            token, user.getId(), user.getEmail(), user.getNom(), user.getPrenom(),
            user.getRole().name(), user.isEmailVerifie()
        ));
    }

    // =========================================================================
    // POST /api/auth/register — PUBLIC
    // =========================================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
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

        // Envoi email de vérification (asynchrone — echec silencieux)
        try {
            emailService.envoyerVerificationEmail(user.getEmail(), user.getPrenom(), tokenVerif);
        } catch (Exception ignored) {}

        return ResponseEntity.ok("Inscription réussie. Vérifiez votre email pour activer votre compte.");
    }

    // =========================================================================
    // GET /api/auth/verify-email?token=... — PUBLIC
    // =========================================================================
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifierEmail(@RequestParam String token) {
        Utilisateur user = utilisateurRepository.findByTokenVerificationEmail(token)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body("Token de vérification invalide");
        }
        if (user.getTokenVerificationEmailExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token expiré. Demandez un nouvel email de vérification.");
        }

        user.setEmailVerifie(true);
        user.setTokenVerificationEmail(null);
        user.setTokenVerificationEmailExpiration(null);
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
    }

    // =========================================================================
    // POST /api/auth/resend-verification — PUBLIC
    // =========================================================================
    @PostMapping("/resend-verification")
    public ResponseEntity<?> renvoyerVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail()).orElse(null);

        // Réponse générique pour éviter l'énumération des comptes
        if (user == null || user.isEmailVerifie()) {
            return ResponseEntity.ok("Si ce compte existe et n'est pas encore vérifié, un email a été envoyé.");
        }

        String token = UUID.randomUUID().toString();
        user.setTokenVerificationEmail(token);
        user.setTokenVerificationEmailExpiration(LocalDateTime.now().plusHours(24));
        utilisateurRepository.save(user);

        emailService.envoyerVerificationEmail(user.getEmail(), user.getPrenom(), token);

        return ResponseEntity.ok("Si ce compte existe et n'est pas encore vérifié, un email a été envoyé.");
    }

    // =========================================================================
    // POST /api/auth/forgot-password — PUBLIC
    // =========================================================================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> motDePasseOublie(@Valid @RequestBody ForgotPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail()).orElse(null);

        // Réponse générique — ne pas révéler si l'email existe
        String reponse = "Si un compte correspond à cet email, vous recevrez un lien de réinitialisation.";

        if (user != null && user.isActif()) {
            String token = UUID.randomUUID().toString();
            user.setTokenReinitialisationMdp(token);
            user.setTokenReinitialisationMdpExpiration(LocalDateTime.now().plusHours(1));
            utilisateurRepository.save(user);
            emailService.envoyerReinitialisationMdp(user.getEmail(), user.getPrenom(), token);
        }

        return ResponseEntity.ok(reponse);
    }

    // =========================================================================
    // POST /api/auth/reset-password — PUBLIC
    // =========================================================================
    @PostMapping("/reset-password")
    public ResponseEntity<?> reinitialiserMotDePasse(@Valid @RequestBody ResetPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByTokenReinitialisationMdp(request.getToken())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body("Token invalide ou déjà utilisé");
        }
        if (user.getTokenReinitialisationMdpExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token expiré. Faites une nouvelle demande.");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        user.setTokenReinitialisationMdp(null);
        user.setTokenReinitialisationMdpExpiration(null);
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Mot de passe réinitialisé avec succès.");
    }

    // =========================================================================
    // POST /api/auth/change-password — AUTHENTIFIÉ
    // =========================================================================
    @PostMapping("/change-password")
    public ResponseEntity<?> changerMotDePasse(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getAncienMotDePasse(), user.getMotDePasse())) {
            return ResponseEntity.badRequest().body("Ancien mot de passe incorrect");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(user);

        return ResponseEntity.ok("Mot de passe modifié avec succès.");
    }
}
