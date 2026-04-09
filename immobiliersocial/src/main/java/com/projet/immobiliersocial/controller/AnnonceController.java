package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.AnnonceRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.repository.AnnonceRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * GET /api/annonces?page=0&size=12
     * Liste des annonces disponibles (public)
     */
    @GetMapping
    public ResponseEntity<Page<Annonce>> listerAnnonces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(annonceRepository.findByStatut(StatutAnnonce.DISPONIBLE, pageable));
    }

    /**
     * GET /api/annonces/recherche?ville=...&type=...&prixMin=...&prixMax=...
     * Recherche avancée (public)
     */
    @GetMapping("/recherche")
    public ResponseEntity<Page<Annonce>> rechercher(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) TypeLogement type,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(annonceRepository.rechercher(ville, type, prixMin, prixMax, pageable));
    }

    /**
     * GET /api/annonces/{id}
     * Détail d'une annonce (public)
     */
    @SuppressWarnings("null")
    @GetMapping("/{id}")
    public ResponseEntity<Annonce> getAnnonce(@PathVariable Long id) {
        return annonceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/annonces
     * Créer une annonce — PROPRIETAIRE uniquement
     */
    @SuppressWarnings("null")
    @PostMapping
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Annonce> creerAnnonce(
            @RequestBody AnnonceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Utilisateur proprietaire = utilisateurRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Annonce annonce = Annonce.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .pays(request.getPays())
                .prix(request.getPrix())
                .nombrePieces(request.getNombrePieces())
                .superficie(request.getSuperficie())
                .typeLogement(request.getTypeLogement())
                .photos(request.getPhotos())
                .statut(StatutAnnonce.DISPONIBLE)
                .proprietaire(proprietaire)
                .build();

        return ResponseEntity.ok(annonceRepository.save(annonce));
    }

    /**
     * PUT /api/annonces/{id}
     * Modifier une annonce — PROPRIETAIRE (propriétaire de l'annonce)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Annonce> modifierAnnonce(
            @PathVariable Long id,
            @RequestBody AnnonceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        @SuppressWarnings("null")
        Annonce annonce = annonceRepository.findById(id).orElseThrow();
        if (!annonce.getProprietaire().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).build();
        }
        annonce.setTitre(request.getTitre());
        annonce.setDescription(request.getDescription());
        annonce.setAdresse(request.getAdresse());
        annonce.setVille(request.getVille());
        annonce.setPrix(request.getPrix());
        annonce.setNombrePieces(request.getNombrePieces());
        annonce.setSuperficie(request.getSuperficie());
        annonce.setTypeLogement(request.getTypeLogement());
        annonce.setPhotos(request.getPhotos());
        return ResponseEntity.ok(annonceRepository.save(annonce));
    }

    /**
     * DELETE /api/annonces/{id}
     * Supprimer une annonce — PROPRIETAIRE ou ADMIN
     */
    @SuppressWarnings("null")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN')")
    public ResponseEntity<Void> supprimerAnnonce(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Annonce annonce = annonceRepository.findById(id).orElseThrow();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !annonce.getProprietaire().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).build();
        }
        annonceRepository.delete(annonce);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/annonces/mes-annonces
     * Annonces du propriétaire connecté
     */
    @GetMapping("/mes-annonces")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Page<Annonce>> mesAnnonces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Utilisateur proprietaire = utilisateurRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(annonceRepository.findByProprietaire(proprietaire, pageable));
    }
}
