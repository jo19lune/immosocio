package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.*;
import com.projet.immobiliersocial.entity.Utilisateur;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    /**
     * POST /api/auth/login
     * Connexion utilisateur — retourne un token JWT
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtils.generateToken(userDetails);

        Utilisateur user = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return ResponseEntity.ok(new AuthResponse(
            token, user.getId(), user.getEmail(), user.getNom(), user.getPrenom(), user.getRole().name()
        ));
    }

    /**
     * POST /api/auth/register
     * Inscription d'un nouveau locataire ou propriétaire
     */
    @SuppressWarnings("null")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
        }

        Utilisateur user = Utilisateur.builder()
            .email(request.getEmail())
            .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .telephone(request.getTelephone())
            .role(request.getRole())
            .actif(true)
            .build();

        utilisateurRepository.save(user);
        return ResponseEntity.ok("Inscription réussie");
    }
}
