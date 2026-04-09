package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.repository.*;
import com.projet.immobiliersocial.dto.PublicationRequest;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

        private final PublicationRepository publicationRepository;
        private final LikeRepository likeRepository;
        private final CommentaireRepository commentaireRepository;
        private final UtilisateurRepository utilisateurRepository;

        /**
         * GET /api/publications?page=0&size=10
         * Fil d'actualité — toutes publications, ordre anti-chronologique
         */
        @GetMapping
        public ResponseEntity<Page<Publication>> getFil(
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "10") int size) {
                Pageable pageable = PageRequest.of(page, size);
                return ResponseEntity.ok(publicationRepository.findAllByOrderByDateCreationDesc(pageable));
        }

        /**
         * POST /api/publications
         * Créer une publication
         */
        @SuppressWarnings("null")
        @PostMapping
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<Publication> creer(
                @RequestBody PublicationRequest body,
                @AuthenticationPrincipal UserDetails userDetails) {
                Utilisateur auteur = utilisateurRepository.findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
                Publication p = Publication.builder()
                        .contenu(body.getContenu())
                        .medias(body.getMedias())
                        .auteur(auteur)
                        .build();
                return ResponseEntity.ok(publicationRepository.save(p));
        }

        /**
         * DELETE /api/publications/{id}
         * Supprimer sa propre publication (ou ADMIN)
         */
        @SuppressWarnings("null")
        @DeleteMapping("/{id}")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<Void> supprimer(@PathVariable @NonNull Long id,
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

        /**
         * POST /api/publications/{id}/like
         * Liker / unliker une publication (toggle)
         */
        @SuppressWarnings("null")
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

                return ResponseEntity.ok(Map.of("liked", liked, "total", total));
        }

        /**
         * GET /api/publications/{id}/commentaires
         * Commentaires d'une publication
         */
        @GetMapping("/{id}/commentaires")
        public ResponseEntity<Page<Commentaire>> getCommentaires(
                @PathVariable @NonNull Long id,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "20") int size) {
                Publication pub = publicationRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Publication introuvable"));
                Pageable pageable = PageRequest.of(page, size);
                return ResponseEntity.ok(commentaireRepository.findByPublicationOrderByDateCreationAsc(pub, pageable));
        }

        /**
         * POST /api/publications/{id}/commentaires
         * Ajouter un commentaire
         */
        @SuppressWarnings("null")
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
                return ResponseEntity.ok(commentaireRepository.save(c));
        }

}
