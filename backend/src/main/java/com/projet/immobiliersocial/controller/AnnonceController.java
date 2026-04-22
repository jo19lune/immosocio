package com.projet.immobiliersocial.controller;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;

import com.projet.immobiliersocial.dto.AnnonceRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.AnnonceRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import com.projet.immobiliersocial.repository.LikeAnnonceRepository;
import com.projet.immobiliersocial.repository.CommentaireAnnonceRepository;
import com.projet.immobiliersocial.repository.NotificationRepository;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Contrôleur REST pour la gestion des annonces immobilières.
 *
 * <p>Accès public en lecture, accès restreint en écriture :</p>
 * <ul>
 *   <li>GET  /api/annonces                        — liste paginée + tri (public)</li>
 *   <li>GET  /api/annonces/recherche              — recherche multicritère + tri (public)</li>
 *   <li>GET  /api/annonces/{id}                   — détail (public)</li>
 *   <li>GET  /api/annonces/{id}/commentaires      — liste commentaires (public)</li>
 *   <li>POST /api/annonces/{id}/commentaires      — ajouter un commentaire (auth)</li>
 *   <li>PUT  /api/annonces/{id}/commentaires/{cid} — modifier (auteur seulement)</li>
 *   <li>DELETE /api/annonces/{id}/commentaires/{cid} — supprimer (auteur ou propriétaire)</li>
 *   <li>GET  /api/annonces/{id}/commentaires/{cid}/reponses — réponses (public)</li>
 *   <li>POST /api/annonces/{id}/commentaires/{cid}/reponses — répondre (auth)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AnnonceController {

    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LikeAnnonceRepository likeAnnonceRepository;
    private final CommentaireAnnonceRepository commentaireAnnonceRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService wsService;

    // ─── Lecture publique ─────────────────────────────────────────────────────

    /**
     * Liste paginée des annonces disponibles.
     *
     * @param page numéro de page (défaut : 0)
     * @param size nombre d'éléments par page (défaut : 12)
     * @param tri  critère de tri : DATE_DESC (défaut), DATE_ASC, PRIX_ASC, PRIX_DESC
     */
    @GetMapping
    public ResponseEntity<Page<Annonce>> listerAnnonces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "DATE_DESC") String tri,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Pageable pageable = PageRequest.of(page, size, resolveSort(tri));
            Utilisateur viewer = resolveUtilisateurOrNull(userDetails);
            return ResponseEntity.ok(
                    annonceRepository.findByStatutIn(List.of(StatutAnnonce.DISPONIBLE, StatutAnnonce.SUSPENDU), pageable)
                            .map(annonce -> enrichAnnonce(annonce, viewer))
            );
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des annonces", e);
            throw e;
        }
    }

    /**
     * Recherche multicritère des annonces disponibles avec tri dynamique.
     *
     * @param tri critère de tri : DATE_DESC (défaut), DATE_ASC, PRIX_ASC, PRIX_DESC
     */
    @GetMapping("/recherche")
    public ResponseEntity<Page<Annonce>> rechercher(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) TypeLogement type,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(required = false) Double superficie,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "DATE_DESC") String tri,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Pageable pageable = PageRequest.of(page, size, resolveSort(tri));

            Specification<Annonce> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(root.get("statut").in(
                    List.of(StatutAnnonce.DISPONIBLE, StatutAnnonce.SUSPENDU)
                ));
                if (ville != null && !ville.isBlank()) {
                    predicates.add(cb.like(
                        cb.lower(root.get("ville")),
                        "%" + ville.toLowerCase() + "%"
                    ));
                }
                if (type != null) {
                    predicates.add(cb.equal(root.get("typeLogement"), type));
                }
                if (prixMin != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("prix"), prixMin));
                }
                if (prixMax != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("prix"), prixMax));
                }
                if (superficie != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("superficie"), superficie));
                }
                return cb.and(predicates.toArray(new Predicate[0]));
            };

            Utilisateur viewer = resolveUtilisateurOrNull(userDetails);
            Page<Annonce> result = annonceRepository.findAll(spec, pageable)
                    .map(annonce -> enrichAnnonce(annonce, viewer));
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la recherche d'annonces", e);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Erreur lors de la recherche : " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Annonce> getAnnonce(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Annonce annonce = annonceRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
            return ResponseEntity.ok(enrichAnnonce(annonce, resolveUtilisateurOrNull(userDetails)));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'annonce {}", id, e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de la récupération de l'annonce");
        }
    }

    // ─── Segments d'utilisateurs ──────────────────────────────────────────────

    @GetMapping("/segment/etudiants")
    public ResponseEntity<Page<Annonce>> annoncesEtudiants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "600") BigDecimal prixMax) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("prix").ascending());
            Page<Annonce> result = annonceRepository.findAnnoncesEtudiants(
                prixMax, List.of(StatutAnnonce.DISPONIBLE), pageable);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Erreur lors de la recherche d'annonces");
        }
    }

    @GetMapping("/segment/touristes")
    public ResponseEntity<Page<Annonce>> annoncesTouristes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
            Page<Annonce> result = annonceRepository.findAnnoncesTouristes(
                List.of(StatutAnnonce.DISPONIBLE), pageable);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Erreur lors de la recherche d'annonces");
        }
    }

    @GetMapping("/segment/colocation")
    public ResponseEntity<Page<Annonce>> annoncesColocation(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "3") Integer minPieces) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
            Page<Annonce> result = annonceRepository.findAnnoncesColocation(
                minPieces, List.of(StatutAnnonce.DISPONIBLE), pageable);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Erreur lors de la recherche d'annonces");
        }
    }

    @GetMapping("/suivi/mes-suivis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Annonce>> mesSuivisAnnonces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Utilisateur user = resolveUtilisateur(userDetails);
            Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
            Page<Annonce> result = annonceRepository.findFollowedByUtilisateur(user, pageable)
                    .map(annonce -> enrichAnnonce(annonce, user));
            return ResponseEntity.ok(result);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de la récupération des annonces suivies");
        }
    }

    @GetMapping("/mes-annonces")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','SUPERADMIN')")
    public ResponseEntity<Page<Annonce>> mesAnnonces(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Utilisateur proprietaire = resolveUtilisateur(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(
                annonceRepository.findByProprietaire(proprietaire, pageable)
                        .map(annonce -> enrichAnnonce(annonce, proprietaire))
        );
    }

    // ─── Écriture — PROPRIETAIRE ──────────────────────────────────────────────

    /**
     * Crée une nouvelle annonce et notifie tous les abonnés du propriétaire.
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
                .quantiteDisponible(request.getQuantiteDisponible() != null ? request.getQuantiteDisponible() : 1)
                .statut(StatutAnnonce.DISPONIBLE)
                .proprietaire(proprietaire)
                .build();

        if (annonce.getQuantiteDisponible() == 0) {
            annonce.setStatut(StatutAnnonce.SUSPENDU);
        }

        Annonce saved = annonceRepository.save(annonce);

        // Notifier les abonnés du propriétaire
        notifierAbonnesProprietaire(saved, proprietaire);

        return ResponseEntity.status(HttpStatus.CREATED).body(enrichAnnonce(saved, proprietaire));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','SUPERADMIN')")
    public ResponseEntity<Annonce> modifierAnnonce(
            @PathVariable Long id,
            @Valid @RequestBody AnnonceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));

        verifierProprietaire(
            Objects.requireNonNull(annonce.getProprietaire().getEmail()),
            Objects.requireNonNull(userDetails.getUsername())
        );

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
        if (request.getQuantiteDisponible() != null) {
            annonce.setQuantiteDisponible(request.getQuantiteDisponible());
            annonce.setStatut(annonce.getQuantiteDisponible() <= 0 ? StatutAnnonce.SUSPENDU : StatutAnnonce.DISPONIBLE);
        }

        return ResponseEntity.ok(enrichAnnonce(annonceRepository.save(annonce), resolveUtilisateur(userDetails)));
    }

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
            verifierProprietaire(
                Objects.requireNonNull(annonce.getProprietaire().getEmail()),
                Objects.requireNonNull(userDetails.getUsername())
            );
        }

        annonceRepository.delete(annonce);
        return ResponseEntity.noContent().build();
    }

    // ─── Suivre une annonce ──────────────────────────────────────────────────

    @PostMapping("/{id}/suivre")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> suivreAnnonce(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        Utilisateur user = resolveUtilisateur(userDetails);

        Optional<Utilisateur> existingFollower = annonce.getFollowers().stream()
                .filter(follower -> Objects.equals(follower.getId(), user.getId()))
                .findFirst();
        boolean isFollowing = existingFollower.isPresent();
        if (isFollowing) {
            annonce.getFollowers().remove(existingFollower.get());
        } else {
            annonce.getFollowers().add(user);
        }
        annonceRepository.save(annonce);

        return ResponseEntity.ok(Map.of(
                "suivi", !isFollowing,
                "followers", annonce.getFollowers().size(),
                "message", !isFollowing ? "Vous suivez cette annonce" : "Vous ne suivez plus cette annonce"
        ));
    }

    // ─── Likes sur les annonces ─────────────────────────────────────────────────

    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> likeAnnonce(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        Utilisateur user = resolveUtilisateur(userDetails);

        Optional<LikeAnnonce> existingLike = likeAnnonceRepository.findByUtilisateurAndAnnonce(user, annonce);
        boolean isLiked = existingLike.isPresent();

        if (isLiked) {
            likeAnnonceRepository.delete(existingLike.get());
        } else {
            likeAnnonceRepository.save(LikeAnnonce.builder()
                    .annonce(annonce)
                    .utilisateur(user)
                    .build());
        }

        long totalLikes = likeAnnonceRepository.countByAnnonce(annonce);
        boolean nowLiked = !isLiked;

        return ResponseEntity.ok(Map.of(
                "liked", nowLiked,
                "total", totalLikes
        ));
    }

    // ─── Commentaires sur les annonces ─────────────────────────────────────────

    /**
     * Liste paginée des commentaires de premier niveau d'une annonce (accès public).
     * Les réponses sont chargées séparément via /{id}/commentaires/{cid}/reponses.
     */
    @GetMapping("/{id}/commentaires")
    public ResponseEntity<Page<CommentaireAnnonce>> getCommentaires(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        Pageable pageable = PageRequest.of(page, size);

        Page<CommentaireAnnonce> commentaires = commentaireAnnonceRepository
                .findByAnnonceAndParentIsNullOrderByDateCreationAsc(annonce, pageable)
                .map(c -> enrichCommentaire(c));

        return ResponseEntity.ok(commentaires);
    }

    /**
     * Ajoute un commentaire principal à une annonce.
     */
    @PostMapping("/{id}/commentaires")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentaireAnnonce> addCommentaire(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu du commentaire est obligatoire");
        }

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        Utilisateur user = resolveUtilisateur(userDetails);

        CommentaireAnnonce commentaire = CommentaireAnnonce.builder()
                .annonce(annonce)
                .auteur(user)
                .contenu(contenu)
                .build();
        CommentaireAnnonce saved = commentaireAnnonceRepository.save(commentaire);

        // Notifier le propriétaire
        if (!Objects.equals(user.getId(), annonce.getProprietaire().getId())) {
            envoyerNotifCommentaire(annonce, user, saved);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(enrichCommentaire(saved));
    }

    /**
     * Modifie un commentaire (auteur seulement).
     */
    @PutMapping("/{id}/commentaires/{commentaireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentaireAnnonce> modifierCommentaire(
            @PathVariable Long id,
            @PathVariable Long commentaireId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu ne peut pas être vide");
        }

        CommentaireAnnonce commentaire = commentaireAnnonceRepository.findById(commentaireId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire introuvable"));

        Utilisateur user = resolveUtilisateur(userDetails);
        if (!Objects.equals(commentaire.getAuteur().getId(), user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vous ne pouvez modifier que vos propres commentaires");
        }

        commentaire.setContenu(contenu);
        CommentaireAnnonce saved = commentaireAnnonceRepository.save(commentaire);
        return ResponseEntity.ok(enrichCommentaire(saved));
    }

    /**
     * Supprime un commentaire (auteur ou propriétaire de l'annonce).
     */
    @DeleteMapping("/{id}/commentaires/{commentaireId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> supprimerCommentaire(
            @PathVariable Long id,
            @PathVariable Long commentaireId,
            @AuthenticationPrincipal UserDetails userDetails) {

        CommentaireAnnonce commentaire = commentaireAnnonceRepository.findById(commentaireId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire introuvable"));

        Utilisateur user = resolveUtilisateur(userDetails);
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));

        boolean isAuteur = Objects.equals(commentaire.getAuteur().getId(), user.getId());
        boolean isProprietaire = Objects.equals(annonce.getProprietaire().getId(), user.getId());

        if (!isAuteur && !isProprietaire) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à supprimer ce commentaire");
        }

        commentaireAnnonceRepository.delete(commentaire);
        return ResponseEntity.noContent().build();
    }

    // ─── Réponses aux commentaires ──────────────────────────────────────────────

    /**
     * Récupère les réponses d'un commentaire (accès public).
     */
    @GetMapping("/{id}/commentaires/{commentaireId}/reponses")
    public ResponseEntity<List<CommentaireAnnonce>> getReponses(
            @PathVariable Long id,
            @PathVariable Long commentaireId) {

        CommentaireAnnonce parent = commentaireAnnonceRepository.findById(commentaireId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire introuvable"));

        List<CommentaireAnnonce> reponses = commentaireAnnonceRepository
                .findByParentOrderByDateCreationAsc(parent);

        return ResponseEntity.ok(reponses);
    }

    /**
     * Ajoute une réponse à un commentaire existant.
     */
    @PostMapping("/{id}/commentaires/{commentaireId}/reponses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentaireAnnonce> addReponse(
            @PathVariable Long id,
            @PathVariable Long commentaireId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        String contenu = body != null ? body.get("contenu") : null;
        if (contenu == null || contenu.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le contenu de la réponse est obligatoire");
        }

        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));
        CommentaireAnnonce parent = commentaireAnnonceRepository.findById(commentaireId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Commentaire parent introuvable"));
        Utilisateur user = resolveUtilisateur(userDetails);

        CommentaireAnnonce reponse = CommentaireAnnonce.builder()
                .annonce(annonce)
                .auteur(user)
                .contenu(contenu)
                .parent(parent)
                .build();
        CommentaireAnnonce saved = commentaireAnnonceRepository.save(reponse);

        // Notifier l'auteur du commentaire parent (s'il est différent)
        if (!Objects.equals(user.getId(), parent.getAuteur().getId())) {
            Notification notif = Notification.builder()
                    .destinataire(parent.getAuteur())
                    .message(user.getPrenom() + " a répondu à votre commentaire sur \"" + annonce.getTitre() + "\"")
                    .type(TypeNotification.NOUVEAU_COMMENTAIRE)
                    .routeCible(buildAnnonceRoute(annonce))
                    .build();
            notif = notificationRepository.save(notif);
            wsService.envoyerNotification(parent.getAuteur().getEmail(), Map.of(
                    "type", "NOUVEAU_COMMENTAIRE",
                    "message", notif.getMessage(),
                    "id", notif.getId(),
                    "annonceId", annonce.getId(),
                    "dateCreation", notif.getDateCreation(),
                    "routeCible", notif.getRouteCible()
            ));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    /**
     * Convertit le paramètre de tri en Sort JPA.
     */
    private Sort resolveSort(String tri) {
        return switch (tri.toUpperCase()) {
            case "PRIX_ASC"   -> Sort.by("prix").ascending();
            case "PRIX_DESC"  -> Sort.by("prix").descending();
            case "DATE_ASC"   -> Sort.by("dateCreation").ascending();
            default           -> Sort.by("dateCreation").descending(); // DATE_DESC
        };
    }

    /**
     * Notifie les abonnés du propriétaire qu'une nouvelle annonce a été publiée.
     */
    private void notifierAbonnesProprietaire(Annonce annonce, Utilisateur proprietaire) {
        try {
            List<Utilisateur> abonnes = utilisateurRepository.findFollowersDuProprietaire(proprietaire.getId());
            for (Utilisateur abonne : abonnes) {
                Notification notif = Notification.builder()
                        .destinataire(abonne)
                        .message(proprietaire.getPrenom() + " " + proprietaire.getNom()
                                + " a publié une nouvelle annonce : \"" + annonce.getTitre() + "\"")
                        .type(TypeNotification.NOUVELLE_ANNONCE)
                        .routeCible(buildAnnonceRoute(annonce))
                        .build();
                notif = notificationRepository.save(notif);
                wsService.envoyerNotification(abonne.getEmail(), Map.of(
                        "type", "NOUVELLE_ANNONCE",
                        "message", notif.getMessage(),
                        "id", notif.getId(),
                        "annonceId", annonce.getId(),
                        "dateCreation", notif.getDateCreation(),
                        "routeCible", notif.getRouteCible()
                ));
            }
        } catch (Exception e) {
            log.warn("Erreur lors de la notification des abonnés du propriétaire {}", proprietaire.getId(), e);
        }
    }

    private void envoyerNotifCommentaire(Annonce annonce, Utilisateur auteur, CommentaireAnnonce commentaire) {
        try {
            Notification notif = Notification.builder()
                    .destinataire(annonce.getProprietaire())
                    .message(auteur.getPrenom() + " a commenté votre annonce \"" + annonce.getTitre() + "\"")
                    .type(TypeNotification.NOUVEAU_COMMENTAIRE)
                    .routeCible(buildAnnonceRoute(annonce))
                    .build();
            notif = notificationRepository.save(notif);
            wsService.envoyerNotification(annonce.getProprietaire().getEmail(), Map.of(
                    "type", "NOUVEAU_COMMENTAIRE",
                    "message", notif.getMessage(),
                    "id", notif.getId(),
                    "annonceId", annonce.getId(),
                    "dateCreation", notif.getDateCreation(),
                    "routeCible", notif.getRouteCible()
            ));
        } catch (Exception e) {
            log.warn("Erreur lors de la notification commentaire annonce {}", annonce.getId(), e);
        }
    }

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        String email = userDetails.getUsername();
        return utilisateurRepository.findByEmail(Objects.requireNonNull(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private Utilisateur resolveUtilisateurOrNull(UserDetails userDetails) {
        if (userDetails == null) return null;
        return resolveUtilisateur(userDetails);
    }

    private void verifierProprietaire(String emailProprietaire, String emailConnecte) {
        if (!emailProprietaire.equals(emailConnecte)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à modifier cette annonce");
        }
    }

    private String buildAnnonceRoute(Annonce annonce) {
        return "/annonces/" + annonce.getId();
    }

    private CommentaireAnnonce enrichCommentaire(CommentaireAnnonce c) {
        c.setReponseCount(commentaireAnnonceRepository.countByParent(c));
        return c;
    }

    private Annonce enrichAnnonce(Annonce annonce, Utilisateur viewer) {
        boolean suivi = viewer != null
                && annonce.getFollowers().stream().anyMatch(f -> Objects.equals(f.getId(), viewer.getId()));
        annonce.setSuivi(suivi);
        annonce.setFollowerCount(annonce.getFollowers().size());
        annonce.setLikeCount(likeAnnonceRepository.countByAnnonce(annonce));
        annonce.setCommentCount(commentaireAnnonceRepository.countByAnnonce(annonce));
        annonce.setLiked(viewer != null && likeAnnonceRepository.existsByUtilisateurAndAnnonce(viewer, annonce));
        return annonce;
    }
}
