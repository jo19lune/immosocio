package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.AnnonceRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.AnnonceRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Contrôleur REST pour la gestion des annonces immobilières.
 *
 * <p>Accès public en lecture, accès restreint en écriture :</p>
 * <ul>
 *   <li>GET  /api/annonces               — liste paginée (public)</li>
 *   <li>GET  /api/annonces/recherche     — recherche multicritère (public)</li>
 *   <li>GET  /api/annonces/{id}          — détail (public)</li>
 *   <li>GET  /api/annonces/mes-annonces  — annonces du propriétaire connecté</li>
 *   <li>POST /api/annonces               — créer (PROPRIETAIRE)</li>
 *   <li>PUT  /api/annonces/{id}          — modifier (propriétaire de l'annonce)</li>
 *   <li>DELETE /api/annonces/{id}        — supprimer (propriétaire ou ADMIN)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ─── Lecture publique ─────────────────────────────────────────────────────

    /**
     * Liste paginée des annonces disponibles, triées par date décroissante.
     *
     * @param page numéro de page (défaut : 0)
     * @param size nombre d'éléments par page (défaut : 12)
     */
    @GetMapping
    public ResponseEntity<Page<Annonce>> listerAnnonces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(annonceRepository.findByStatut(StatutAnnonce.DISPONIBLE, pageable));
    }

    /**
     * Recherche multicritère des annonces disponibles.
     *
     * @param ville   filtre partiel sur la ville (insensible à la casse, optionnel)
     * @param type    type de logement (optionnel)
     * @param prixMin prix minimum (optionnel)
     * @param prixMax prix maximum (optionnel)
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
     * Détail d'une annonce par identifiant.
     *
     * @param id identifiant de l'annonce
     * @throws ApiException 404 si l'annonce n'existe pas
     */
    @GetMapping("/{id}")
    public ResponseEntity<Annonce> getAnnonce(@PathVariable Long id) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        return ResponseEntity.ok(annonce);
    }

    // ─── Annonces du propriétaire connecté ───────────────────────────────────

    /**
     * Annonces appartenant au propriétaire actuellement connecté.
     */
    @GetMapping("/mes-annonces")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','SUPERADMIN')")
    public ResponseEntity<Page<Annonce>> mesAnnonces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Utilisateur proprietaire = resolveUtilisateur(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(annonceRepository.findByProprietaire(proprietaire, pageable));
    }

    // ─── Écriture — PROPRIETAIRE ──────────────────────────────────────────────

    /**
     * Crée une nouvelle annonce pour le propriétaire connecté.
     * Retourne HTTP 201 Created avec l'annonce persistée.
     *
     * @param request données de l'annonce (validées par @Valid)
     * @throws ApiException 404 si l'utilisateur connecté est introuvable
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','SUPERADMIN')")
    public ResponseEntity<Annonce> creerAnnonce(
            @Valid @RequestBody AnnonceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur proprietaire = resolveUtilisateur(userDetails);

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

        return ResponseEntity.status(HttpStatus.CREATED).body(annonceRepository.save(annonce));
    }

    /**
     * Modifie une annonce existante. Seul le propriétaire de l'annonce peut la modifier.
     *
     * @param id      identifiant de l'annonce à modifier
     * @param request nouvelles données (validées par @Valid)
     * @throws ApiException 404 si introuvable, 403 si l'utilisateur n'est pas propriétaire
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','SUPERADMIN')")
    public ResponseEntity<Annonce> modifierAnnonce(
            @PathVariable Long id,
            @Valid @RequestBody AnnonceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));

        verifierProprietaire(annonce.getProprietaire().getEmail(), userDetails.getUsername());

        annonce.setTitre(request.getTitre());
        annonce.setDescription(request.getDescription());
        annonce.setAdresse(request.getAdresse());
        annonce.setVille(request.getVille());
        annonce.setPays(request.getPays());
        annonce.setPrix(request.getPrix());
        annonce.setNombrePieces(request.getNombrePieces());
        annonce.setSuperficie(request.getSuperficie());
        annonce.setTypeLogement(request.getTypeLogement());
        annonce.setPhotos(request.getPhotos());

        return ResponseEntity.ok(annonceRepository.save(annonce));
    }

    /**
     * Supprime une annonce. Autorisé au propriétaire de l'annonce ou à un ADMIN.
     *
     * @param id identifiant de l'annonce à supprimer
     * @throws ApiException 404 si introuvable, 403 si accès non autorisé
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Void> supprimerAnnonce(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));

        if (!isAdmin) {
            verifierProprietaire(annonce.getProprietaire().getEmail(), userDetails.getUsername());
        }

        annonceRepository.delete(annonce);
        return ResponseEntity.noContent().build();
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    /**
     * Charge l'utilisateur connecté depuis la base de données.
     *
     * @throws ApiException 404 si introuvable (ne devrait pas arriver si le JWT est valide)
     */
    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    /**
     * Vérifie que l'email du propriétaire de la ressource correspond à l'utilisateur connecté.
     *
     * @param emailProprietaire email du propriétaire de la ressource
     * @param emailConnecte     email de l'utilisateur authentifié
     * @throws ApiException 403 si les emails ne correspondent pas
     */
    private void verifierProprietaire(String emailProprietaire, String emailConnecte) {
        if (!emailProprietaire.equals(emailConnecte)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas autorisé à modifier cette annonce");
        }
    }
}
