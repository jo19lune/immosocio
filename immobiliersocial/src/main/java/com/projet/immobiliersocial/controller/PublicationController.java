package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.repository.*;
import com.projet.immobiliersocial.dto.PublicationRequest;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationRepository publicationRepository;
    private final LikeRepository likeRepository;
    private final CommentaireRepository commentaireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final NotificationWebSocketService wsService;

    // =========================================================================
    // GET /api/publications?page=0&size=10
    // Fil d'actualité avec filtrage par visibilité
    // =========================================================================
    @GetMapping
    public ResponseEntity<Page<Publication>> getFil(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        Pageable pageable = PageRequest.of(page, size);

        if (userDetails != null) {
            // Membre connecté : voit PUBLIC + MEMBRES
            return ResponseEntity.ok(
                publicationRepository.findByVisibiliteInOrderByDateCreationDesc(
                    List.of(VisibilitePublication.PUBLIC, VisibilitePublication.MEMBRES),
                    pageable
                )
            );
        } else {
            // Visiteur anonyme : voit uniquement PUBLIC
            return ResponseEntity.ok(
                publicationRepository.findByVisibiliteInOrderByDateCreationDesc(
                    List.of(VisibilitePublication.PUBLIC),
                    pageable
                )
            );
        }
    }

    // =========================================================================
    // POST /api/publications — AUTHENTIFIÉ
    // =========================================================================
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Publication> creer(
            @RequestBody PublicationRequest body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur auteur = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Visibilité : priorité au champ de la requête, sinon défaut de l'utilisateur
        VisibilitePublication visibilite = body.getVisibilite() != null
                ? body.getVisibilite()
                : auteur.getVisibiliteParDefaut();

        Publication.PublicationBuilder builder = Publication.builder()
                .contenu(body.getContenu())
                .medias(body.getMedias())
                .auteur(auteur)
                .visibilite(visibilite);

        // Lier à une annonce si fourni
        if (body.getAnnonceId() != null) {
            annonceRepository.findById(body.getAnnonceId()).ifPresent(builder::annonce);
        }

        Publication saved = publicationRepository.save(builder.build());

        // Diffusion WebSocket aux abonnés du fil public
        wsService.diffuser("/topic/publications",
            Map.of("action", "NOUVELLE_PUBLICATION", "id", saved.getId(),
                   "auteur", auteur.getNom() + " " + auteur.getPrenom()));

        return ResponseEntity.ok(saved);
    }

    // =========================================================================
    // DELETE /api/publications/{id} — AUTHENTIFIÉ (auteur ou ADMIN)
    // =========================================================================
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> supprimer(
            @PathVariable @NonNull Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Publication p = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !p.getAuteur().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).build();
        }

        publicationRepository.delete(p);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // POST /api/publications/{id}/like — AUTHENTIFIÉ (toggle)
    // =========================================================================
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable @NonNull Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));

        likeRepository.findByUtilisateurAndPublication(user, pub).ifPresentOrElse(
            like -> likeRepository.delete(like),
            () -> likeRepository.save(Like.builder().utilisateur(user).publication(pub).build())
        );

        boolean liked = likeRepository.existsByUtilisateurAndPublication(user, pub);
        long total = likeRepository.countByPublication(pub);

        // Notifier l'auteur de la publication via WebSocket (seulement si quelqu'un d'autre like)
        if (liked && !pub.getAuteur().getEmail().equals(userDetails.getUsername())) {
            wsService.envoyerNotification(pub.getAuteur().getEmail(),
                Map.of("type", "NOUVEAU_LIKE",
                       "message", user.getNom() + " a aimé votre publication",
                       "publicationId", id));
        }

        return ResponseEntity.ok(Map.of("liked", liked, "total", total));
    }

    // =========================================================================
    // GET /api/publications/{id}/commentaires
    // =========================================================================
    @GetMapping("/{id}/commentaires")
    public ResponseEntity<Page<Commentaire>> getCommentaires(
            @PathVariable @NonNull Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));

        return ResponseEntity.ok(
            commentaireRepository.findByPublicationOrderByDateCreationAsc(
                pub, PageRequest.of(page, size))
        );
    }

    // =========================================================================
    // POST /api/publications/{id}/commentaires — AUTHENTIFIÉ
    // =========================================================================
    @PostMapping("/{id}/commentaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Commentaire> commenter(
            @PathVariable @NonNull Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publication introuvable"));
        Utilisateur auteur = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Commentaire c = Commentaire.builder()
                .contenu(body.get("contenu"))
                .auteur(auteur)
                .publication(pub)
                .build();

        Commentaire saved = commentaireRepository.save(c);

        // Notifier l'auteur de la publication
        if (!pub.getAuteur().getEmail().equals(userDetails.getUsername())) {
            wsService.envoyerNotification(pub.getAuteur().getEmail(),
                Map.of("type", "NOUVEAU_COMMENTAIRE",
                       "message", auteur.getNom() + " a commenté votre publication",
                       "publicationId", id));
        }

        return ResponseEntity.ok(saved);
    }
}
