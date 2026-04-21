package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.PublicationRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.*;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les publications du fil d'actualité.
 *
 * <ul>
 *   <li>GET    /api/publications                     — fil d'actualité (filtré par visibilité)</li>
 *   <li>POST   /api/publications                     — créer une publication (authentifié)</li>
 *   <li>DELETE /api/publications/{id}                — supprimer (auteur ou ADMIN)</li>
 *   <li>POST   /api/publications/{id}/like           — toggle like (authentifié)</li>
 *   <li>GET    /api/publications/{id}/commentaires   — liste des commentaires (public)</li>
 *   <li>POST   /api/publications/{id}/commentaires   — ajouter un commentaire (authentifié)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PublicationController {

    private final PublicationRepository publicationRepository;
    private final LikeRepository likeRepository;
    private final CommentaireRepository commentaireRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService wsService;

    // ─── GET /api/publications ────────────────────────────────────────────────

    /**
     * Retourne le fil d'actualité paginé en tenant compte de la visibilité :
     * <ul>
     *   <li>Visiteur anonyme : publications {@code PUBLIC} uniquement.</li>
     *   <li>Membre connecté : publications {@code PUBLIC} et {@code MEMBRES}.</li>
     * </ul>
     */
    @GetMapping
    public ResponseEntity<Page<Publication>> getFil(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        Pageable pageable = PageRequest.of(page, size);
        List<VisibilitePublication> visibilites = (userDetails != null)
                ? List.of(VisibilitePublication.PUBLIC, VisibilitePublication.MEMBRES)
                : List.of(VisibilitePublication.PUBLIC);

        return ResponseEntity.ok(
            publicationRepository.findByVisibiliteInOrderByDateCreationDesc(visibilites, pageable)
        );
    }

    // ─── POST /api/publications ───────────────────────────────────────────────

    /**
     * Crée une nouvelle publication. Retourne HTTP 201 Created.
     *
     * <p>La visibilité est celle du champ {@code visibilite} de la requête si renseignée,
     * sinon la préférence par défaut de l'utilisateur connecté.</p>
     *
     * @param body données de la publication (validées par @Valid)
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Publication> creer(
            @Valid @RequestBody PublicationRequest body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur auteur = resolveUtilisateur(userDetails);

        VisibilitePublication visibilite = (body.getVisibilite() != null)
                ? body.getVisibilite()
                : auteur.getVisibiliteParDefaut();

        Publication.PublicationBuilder builder = Publication.builder()
                .contenu(body.getContenu())
                .medias(body.getMedias())
                .auteur(auteur)
                .visibilite(visibilite);

        if (body.getAnnonceId() != null) {
            annonceRepository.findById(body.getAnnonceId()).ifPresent(builder::annonce);
        }

        Publication saved = publicationRepository.save(builder.build());

        wsService.diffuser("/topic/publications", Map.of(
                "action", "NOUVELLE_PUBLICATION",
                "id", saved.getId(),
                "auteur", auteur.getNom() + " " + auteur.getPrenom()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── PUT /api/publications/{id} ──────────────────────────────────────────

    /**
     * Modifie le contenu d'une publication. Seul l'auteur peut modifier sa publication.
     *
     * @param id   identifiant de la publication
     * @param body {@code { "contenu": "..." }}
     * @throws ApiException 404 si introuvable, 403 si pas l'auteur
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Publication> modifier(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Publication introuvable"));

        if (!publication.getAuteur().getEmail().equals(userDetails.getUsername())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas autorisé à modifier cette publication");
        }

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu ne peut pas être vide");
        }

        publication.setContenu(contenu);
        return ResponseEntity.ok(publicationRepository.save(publication));
    }

    // ─── DELETE /api/publications/{id} ───────────────────────────────────────

    /**
     * Supprime une publication. Autorisé à l'auteur de la publication ou à un ADMIN.
     *
     * @param id identifiant de la publication
     * @throws ApiException 404 si introuvable, 403 si accès non autorisé
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Publication introuvable"));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                            || a.getAuthority().equals("ROLE_SUPERADMIN"));

        if (!isAdmin && !publication.getAuteur().getEmail().equals(userDetails.getUsername())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas autorisé à supprimer cette publication");
        }

        publicationRepository.delete(publication);
        return ResponseEntity.noContent().build();
    }

    // ─── POST /api/publications/{id}/like ────────────────────────────────────

    /**
     * Bascule le like de l'utilisateur connecté sur une publication (toggle).
     *
     * <p>Si l'utilisateur a déjà liké, le like est retiré. Sinon, il est ajouté.
     * Une notification WebSocket est envoyée à l'auteur si c'est un nouveau like
     * posé par quelqu'un d'autre.</p>
     *
     * @param id identifiant de la publication
     * @return {@code { "liked": boolean, "total": long }}
     */
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Utilisateur user = resolveUtilisateur(userDetails);
        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Publication introuvable"));

        likeRepository.findByUtilisateurAndPublication(user, pub).ifPresentOrElse(
            likeRepository::delete,
            () -> likeRepository.save(Like.builder().utilisateur(user).publication(pub).build())
        );

        boolean liked = likeRepository.existsByUtilisateurAndPublication(user, pub);
        long total = likeRepository.countByPublication(pub);

        if (liked && !pub.getAuteur().getEmail().equals(userDetails.getUsername())) {
            Notification notification = Notification.builder()
                    .destinataire(pub.getAuteur())
                    .message(user.getNom() + " a aimé votre publication")
                    .type(TypeNotification.NOUVEAU_LIKE)
                    .build();
            notification = notificationRepository.save(notification);

            wsService.envoyerNotification(pub.getAuteur().getEmail(), Map.of(
                    "type", "NOUVEAU_LIKE",
                    "message", notification.getMessage(),
                    "id", notification.getId(),
                    "publicationId", id
            ));
        }

        return ResponseEntity.ok(Map.of("liked", liked, "total", total));
    }

    // ─── GET /api/publications/{id}/commentaires ──────────────────────────────

    /**
     * Retourne les commentaires d'une publication, paginés et triés par date croissante.
     *
     * @param id identifiant de la publication
     */
    @GetMapping("/{id}/commentaires")
    public ResponseEntity<Page<Commentaire>> getCommentaires(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Publication introuvable"));

        return ResponseEntity.ok(
            commentaireRepository.findByPublicationOrderByDateCreationAsc(
                pub, PageRequest.of(page, size))
        );
    }

    // ─── POST /api/publications/{id}/commentaires ─────────────────────────────

    /**
     * Ajoute un commentaire à une publication. Retourne HTTP 201 Created.
     *
     * <p>Le champ {@code contenu} ne peut pas être vide. Une notification WebSocket
     * est envoyée à l'auteur si le commentateur est une autre personne.</p>
     *
     * @param id   identifiant de la publication
     * @param body {@code { "contenu": "..." }}
     */
    @PostMapping("/{id}/commentaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Commentaire> commenter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu du commentaire est obligatoire");
        }

        Publication pub = publicationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Publication introuvable"));
        Utilisateur auteur = resolveUtilisateur(userDetails);

        Commentaire commentaire = Commentaire.builder()
                .contenu(contenu)
                .auteur(auteur)
                .publication(pub)
                .build();

        Commentaire saved = commentaireRepository.save(commentaire);

        if (!pub.getAuteur().getEmail().equals(userDetails.getUsername())) {
            Notification notification = Notification.builder()
                    .destinataire(pub.getAuteur())
                    .message(auteur.getNom() + " a commenté votre publication")
                    .type(TypeNotification.NOUVEAU_COMMENTAIRE)
                    .build();
            notification = notificationRepository.save(notification);

            wsService.envoyerNotification(pub.getAuteur().getEmail(), Map.of(
                    "type", "NOUVEAU_COMMENTAIRE",
                    "message", notification.getMessage(),
                    "id", notification.getId(),
                    "publicationId", id
            ));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── Helper privé ─────────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }
}
