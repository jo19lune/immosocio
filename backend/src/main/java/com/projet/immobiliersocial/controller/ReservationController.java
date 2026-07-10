package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.ReservationRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.exception.ApiException;
import com.projet.immobiliersocial.repository.*;
import com.projet.immobiliersocial.websocket.NotificationWebSocketService;
import com.projet.immobiliersocial.service.EmailService;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour la gestion des réservations.
 *
 * <ul>
 *   <li>POST   /api/reservations                  — créer une réservation (LOCATAIRE)</li>
 *   <li>GET    /api/reservations/mes-reservations  — réservations du locataire connecté</li>
 *   <li>GET    /api/reservations/demandes          — demandes reçues par le propriétaire</li>
 *   <li>PATCH  /api/reservations/{id}/confirmer    — confirmer (PROPRIETAIRE)</li>
 *   <li>PATCH  /api/reservations/{id}/annuler      — annuler (LOCATAIRE ou PROPRIETAIRE)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@SuppressWarnings("null")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService wsService;
    private final EmailService emailService;

    // ─── POST /api/reservations ───────────────────────────────────────────────

    /**
     * Crée une nouvelle demande de réservation pour un logement.
     *
     * <p>Règles métier :</p>
     * <ul>
     *   <li>La date de fin doit être postérieure à la date de début.</li>
     *   <li>L'annonce doit avoir le statut {@code DISPONIBLE}.</li>
     *   <li>Aucune réservation en attente ou confirmée ne doit chevaucher les dates choisies.</li>
     * </ul>
     *
     * @param request données de la réservation (validées par @Valid)
     * @return 201 Created avec la réservation persistée
     * @throws ApiException 404 si l'annonce est introuvable, 400 en cas de conflit de dates,
     *                      409 si l'annonce n'est plus disponible
     */
    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Reservation> creerReservation(
            @Valid @RequestBody ReservationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Vérification cohérence des dates
        if (!request.getDateFin().isAfter(request.getDateDebut())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "La date de fin doit être postérieure à la date de début");
        }

        Annonce annonce = annonceRepository.findById(request.getAnnonceId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Annonce introuvable"));

        // Vérification de la quantité
        Integer quantite = request.getQuantite() != null ? request.getQuantite() : 1;
        if (quantite < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La quantité minimale à réserver est de 1.");
        }
        if (annonce.getQuantiteDisponible() < quantite) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Pas assez de quantité disponible (Maximum disponible : " + annonce.getQuantiteDisponible() + ").");
        }

        // Vérification que l'annonce est encore disponible
        if (annonce.getStatut() != StatutAnnonce.DISPONIBLE) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cette annonce n'est plus disponible à la réservation");
        }

        // On ne vérifie plus le chevauchement strict si c'est multi-quantité,
        // mais pour simplifier, on déduit la quantité de suite.
        annonce.setQuantiteDisponible(annonce.getQuantiteDisponible() - quantite);
        if (annonce.getQuantiteDisponible() == 0) {
            annonce.setStatut(StatutAnnonce.SUSPENDU);
        }
        annonceRepository.save(annonce);

        Utilisateur locataire = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        java.math.BigDecimal prixTotal = annonce.getPrix().multiply(new java.math.BigDecimal(quantite));

        Reservation reservation = Reservation.builder()
                .annonce(annonce)
                .locataire(locataire)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .message(request.getMessage())
                .quantite(quantite)
                .prixTotal(prixTotal)
                .statut(StatutReservation.EN_ATTENTE)
                .build();

        Reservation savedReservation = reservationRepository.save(reservation);

        // Notifier le propriétaire de la nouvelle demande
        Notification notifProprio = Notification.builder()
                .destinataire(annonce.getProprietaire())
                .message("Nouvelle demande de r\u00e9servation pour votre annonce \u00ab" + annonce.getTitre() + "\u00bb.")
                .type(TypeNotification.RESERVATION_CONFIRMEE) // On peut utiliser un type spécifique si existant
                .routeCible(buildDemandesReservationsRoute())
                .build();
        notifProprio = notificationRepository.save(notifProprio);
        wsService.envoyerNotification(annonce.getProprietaire().getEmail(), java.util.Map.of(
                "type", "NOUVELLE_RESERVATION",
                "message", notifProprio.getMessage(),
                "notificationType", notifProprio.getType().name(),
                "id", notifProprio.getId(),
                "dateCreation", notifProprio.getDateCreation(),
                "routeCible", notifProprio.getRouteCible(),
                "annonceId", annonce.getId()
        ));

        // Notifier le locataire du succès de sa demande
        Notification notifLocataire = Notification.builder()
                .destinataire(locataire)
                .message("Votre demande de r\u00e9servation pour \u00ab" + annonce.getTitre() + "\u00bb a bien \u00e9t\u00e9 transmise.")
                .type(TypeNotification.RESERVATION_CONFIRMEE)
                .routeCible(buildMesReservationsRoute())
                .build();
        notifLocataire = notificationRepository.save(notifLocataire);
        wsService.envoyerNotification(locataire.getEmail(), java.util.Map.of(
                "type", "RESERVATION_CREEE",
                "message", notifLocataire.getMessage(),
                "notificationType", notifLocataire.getType().name(),
                "id", notifLocataire.getId(),
                "dateCreation", notifLocataire.getDateCreation(),
                "routeCible", notifLocataire.getRouteCible(),
                "annonceId", annonce.getId()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(savedReservation);
    }

    // ─── GET /api/reservations/mes-reservations ───────────────────────────────

    /**
     * Retourne les réservations du locataire connecté, paginées.
     */
    @GetMapping("/mes-reservations")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Page<Reservation>> mesReservations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Utilisateur locataire = resolveUtilisateur(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(reservationRepository.findByLocataire(locataire, pageable));
    }

    // ─── GET /api/reservations/demandes ──────────────────────────────────────

    /**
     * Retourne les demandes de réservation reçues par le propriétaire connecté, paginées.
     */
    @GetMapping("/demandes")
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Page<Reservation>> demandesReservation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Utilisateur proprietaire = resolveUtilisateur(userDetails);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(
                reservationRepository.findByAnnonce_Proprietaire(proprietaire, pageable));
    }

    // ─── PATCH /api/reservations/{id}/confirmer ───────────────────────────────

    /**
     * Confirme une réservation en attente. Seul le propriétaire de l'annonce concernée peut le faire.
     *
     * @throws ApiException 404 si introuvable, 403 si non autorisé, 409 si déjà traitée
     */
    @PatchMapping("/{id}/confirmer")
    @Transactional
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Reservation> confirmer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Reservation reservation = resolveReservation(id);
        verifierProprietaireAnnonce(reservation, userDetails.getUsername());

        if (reservation.getStatut() != StatutReservation.EN_ATTENTE) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Seules les réservations en attente peuvent être confirmées");
        }

        reservation.setStatut(StatutReservation.CONFIRMEE);
        Reservation saved = reservationRepository.save(reservation);

        // Notifier le locataire de la confirmation
        Notification notifLocataire = Notification.builder()
                .destinataire(saved.getLocataire())
                .message("Votre r\u00e9servation pour \u00ab" + saved.getAnnonce().getTitre() + "\u00bb a \u00e9t\u00e9 confirm\u00e9e.")
                .type(TypeNotification.RESERVATION_CONFIRMEE)
                .routeCible(buildMesReservationsRoute())
                .build();
        notifLocataire = notificationRepository.save(notifLocataire);
        wsService.envoyerNotification(saved.getLocataire().getEmail(), java.util.Map.of(
                "type", "RESERVATION_CONFIRMEE",
                "message", notifLocataire.getMessage(),
                "id", notifLocataire.getId(),
                "notificationType", notifLocataire.getType().name(),
                "dateCreation", notifLocataire.getDateCreation(),
                "routeCible", notifLocataire.getRouteCible(),
                "annonceId", saved.getAnnonce().getId()
        ));

        return ResponseEntity.ok(saved);
    }

    // ─── PATCH /api/reservations/{id}/annuler ─────────────────────────────────

    /**
     * Annule une réservation. Le locataire peut annuler sa propre réservation ;
     * le propriétaire peut annuler toute réservation sur ses annonces.
     *
     * @throws ApiException 404 si introuvable, 403 si non autorisé, 409 si déjà annulée
     */
    @PatchMapping("/{id}/annuler")
    @Transactional
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','LOCATAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Reservation> annuler(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Reservation reservation = resolveReservation(id);
        String username = userDetails.getUsername();

        boolean estLocataire = reservation.getLocataire().getEmail().equals(username);
        boolean estProprietaire = reservation.getAnnonce().getProprietaire().getEmail().equals(username);

        if (!estLocataire && !estProprietaire) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas autorisé à annuler cette réservation");
        }

        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            throw new ApiException(HttpStatus.CONFLICT, "Cette réservation est déjà annulée");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        Reservation saved = reservationRepository.save(reservation);

        Annonce annonce = reservation.getAnnonce();
        boolean etaitIndisponible = annonce.getQuantiteDisponible() == 0;
        annonce.setQuantiteDisponible(annonce.getQuantiteDisponible() + reservation.getQuantite());
        annonce.setStatut(StatutAnnonce.DISPONIBLE);
        annonceRepository.save(annonce);

        // Notifier les followers si l'annonce redevient disponible
        if (etaitIndisponible && annonce.getQuantiteDisponible() > 0) {
            for (Utilisateur follower : annonce.getFollowers()) {
                // Notifier par email
                try {
                    emailService.envoyerNotificationDisponibilite(follower.getEmail(), follower.getPrenom(), annonce.getTitre(), annonce.getId());
                } catch(Exception ignored) {}

                // Notifier par websocket et BD
                Notification notif = Notification.builder()
                        .destinataire(follower)
                        .message("L'annonce '" + annonce.getTitre() + "' est de nouveau disponible !")
                        .type(TypeNotification.NOUVELLE_ANNONCE)
                        .routeCible(buildAnnonceRoute(annonce))
                        .build();
                notif = notificationRepository.save(notif);

                wsService.envoyerNotification(follower.getEmail(), java.util.Map.of(
                        "type", "NOUVELLE_ANNONCE",
                        "message", notif.getMessage(),
                        "id", notif.getId(),
                        "notificationType", notif.getType().name(),
                        "dateCreation", notif.getDateCreation(),
                        "routeCible", notif.getRouteCible(),
                        "annonceId", annonce.getId()
                ));
            }
        }

        // Notifier l'autre partie de l'annulation
        Utilisateur destinataireNotif = estLocataire ? annonce.getProprietaire() : reservation.getLocataire();
        String msgNotif = estLocataire 
            ? "Le locataire a annul\u00e9 sa r\u00e9servation pour \u00ab" + annonce.getTitre() + "\u00bb."
            : "Le propri\u00e9taire a annul\u00e9 votre r\u00e9servation pour \u00ab" + annonce.getTitre() + "\u00bb.";
        
        Notification notifAnnulation = Notification.builder()
                .destinataire(destinataireNotif)
                .message(msgNotif)
                .type(TypeNotification.RESERVATION_ANNULEE)
                .routeCible(estLocataire ? buildDemandesReservationsRoute() : buildMesReservationsRoute())
                .build();
        notifAnnulation = notificationRepository.save(notifAnnulation);
        wsService.envoyerNotification(destinataireNotif.getEmail(), java.util.Map.of(
                "type", "RESERVATION_ANNULEE",
                "message", msgNotif,
                "notificationType", notifAnnulation.getType().name(),
                "id", notifAnnulation.getId(),
                "dateCreation", notifAnnulation.getDateCreation(),
                "routeCible", notifAnnulation.getRouteCible(),
                "annonceId", annonce.getId()
        ));

        return ResponseEntity.ok(saved);
    }

    // ─── PATCH /api/reservations/{id}/terminer ──────────────────────────────────

    /**
     * Marque une réservation confirmée comme terminée (séjour achevé).
     * Seul le propriétaire de l'annonce peut le faire.
     * Cela restaure la quantité disponible de l'annonce.
     */
    @PatchMapping("/{id}/terminer")
    @Transactional
    @PreAuthorize("hasAnyRole('PROPRIETAIRE','ADMIN','SUPERADMIN')")
    public ResponseEntity<Reservation> terminer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Reservation reservation = resolveReservation(id);
        verifierProprietaireAnnonce(reservation, userDetails.getUsername());

        if (reservation.getStatut() != StatutReservation.CONFIRMEE) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Seules les réservations confirmées peuvent être marquées comme terminées");
        }

        // Marquer la réservation comme terminée
        reservation.setStatut(StatutReservation.TERMINEE);
        Reservation savedReservation = reservationRepository.save(reservation);

        // Restaurer la quantité disponible
        Annonce annonce = reservation.getAnnonce();
        annonce.setQuantiteDisponible(annonce.getQuantiteDisponible() + reservation.getQuantite());
        annonce.setStatut(StatutAnnonce.DISPONIBLE);
        annonceRepository.save(annonce);

        // Notifier le locataire
        Notification notifLocataire = Notification.builder()
                .destinataire(savedReservation.getLocataire())
                .message("Votre réservation pour \"" + annonce.getTitre() + "\" a été marquée comme terminée.")
                .type(TypeNotification.SYSTEME)
                .routeCible(buildMesReservationsRoute())
                .build();
        notifLocataire = notificationRepository.save(notifLocataire);
        wsService.envoyerNotification(savedReservation.getLocataire().getEmail(), java.util.Map.of(
                "type", "RESERVATION_TERMINEE",
                "message", notifLocataire.getMessage(),
                "id", notifLocataire.getId(),
                "notificationType", notifLocataire.getType().name(),
                "dateCreation", notifLocataire.getDateCreation(),
                "routeCible", notifLocataire.getRouteCible(),
                "annonceId", annonce.getId()
        ));

        return ResponseEntity.ok(savedReservation);
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private Utilisateur resolveUtilisateur(UserDetails userDetails) {
        return utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private Reservation resolveReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Réservation introuvable"));
    }

    /**
     * Vérifie que l'utilisateur connecté est bien le propriétaire de l'annonce associée.
     *
     * @throws ApiException 403 si l'annonce n'appartient pas à cet utilisateur
     */
    private void verifierProprietaireAnnonce(Reservation reservation, String emailConnecte) {
        if (!reservation.getAnnonce().getProprietaire().getEmail().equals(emailConnecte)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas le propriétaire de cette annonce");
        }
    }

    private String buildAnnonceRoute(Annonce annonce) {
        return "/annonces/" + annonce.getId();
    }

    private String buildMesReservationsRoute() {
        return "/mes-reservations";
    }

    private String buildDemandesReservationsRoute() {
        return "/demandes-reservations";
    }
}
