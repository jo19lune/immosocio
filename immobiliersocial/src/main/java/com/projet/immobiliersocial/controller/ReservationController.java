package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.ReservationRequest;
import com.projet.immobiliersocial.entity.*;
import com.projet.immobiliersocial.repository.*;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final AnnonceRepository annonceRepository;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * POST /api/reservations
     * Créer une réservation — LOCATAIRE uniquement
     */
    @SuppressWarnings("null")
    @PostMapping
    @PreAuthorize("hasRole('LOCATAIRE')")
    public ResponseEntity<?> creerReservation(
            @RequestBody ReservationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Annonce annonce = annonceRepository.findById(request.getAnnonceId())
                .orElseThrow(() -> new RuntimeException("Annonce introuvable"));

        // Vérifier disponibilité
        if (reservationRepository.existsConflict(annonce.getId(), request.getDateDebut(), request.getDateFin())) {
            return ResponseEntity.badRequest().body("Le logement n'est pas disponible pour ces dates");
        }

        Utilisateur locataire = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Reservation reservation = Reservation.builder()
                .annonce(annonce)
                .locataire(locataire)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .message(request.getMessage())
                .statut(StatutReservation.EN_ATTENTE)
                .build();

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    /**
     * GET /api/reservations/mes-reservations
     * Réservations du locataire connecté
     */
    @GetMapping("/mes-reservations")
    @PreAuthorize("hasRole('LOCATAIRE')")
    public ResponseEntity<Page<Reservation>> mesReservations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Utilisateur locataire = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(reservationRepository.findByLocataire(locataire, pageable));
    }

    /**
     * GET /api/reservations/demandes
     * Réservations reçues par le propriétaire connecté
     */
    @GetMapping("/demandes")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Page<Reservation>> demandesReservation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Utilisateur proprietaire = utilisateurRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateCreation").descending());
        return ResponseEntity.ok(reservationRepository.findByAnnonce_Proprietaire(proprietaire, pageable));
    }

    /**
     * PATCH /api/reservations/{id}/confirmer
     * Confirmer une réservation — PROPRIETAIRE
     */
    @PatchMapping("/{id}/confirmer")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Reservation> confirmer(@PathVariable @NonNull Long id,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
        validerProprietaire(reservation, userDetails);
        reservation.setStatut(StatutReservation.CONFIRMEE);
        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    /**
     * PATCH /api/reservations/{id}/annuler
     * Annuler une réservation — LOCATAIRE (sa propre réservation) ou PROPRIETAIRE (sur son annonce)
     */
    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('LOCATAIRE','PROPRIETAIRE')")
    public ResponseEntity<?> annuler(@PathVariable @NonNull Long id,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
        String username = userDetails.getUsername();

        boolean estLocataire = reservation.getLocataire().getEmail().equals(username);
        boolean estProprietaire = reservation.getAnnonce().getProprietaire().getEmail().equals(username);

        if (!estLocataire && !estProprietaire) {
            return ResponseEntity.status(403).body("Accès refusé : vous n'êtes pas concerné par cette réservation");
        }

        reservation.setStatut(StatutReservation.ANNULEE);
        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    private void validerProprietaire(Reservation r, UserDetails ud) {
        if (!r.getAnnonce().getProprietaire().getEmail().equals(ud.getUsername())) {
            throw new RuntimeException("Accès refusé");
        }
    }
}
