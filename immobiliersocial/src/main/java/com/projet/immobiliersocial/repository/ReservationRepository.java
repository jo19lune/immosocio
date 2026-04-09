package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Page<Reservation> findByLocataire(Utilisateur locataire, Pageable pageable);

    Page<Reservation> findByAnnonce_Proprietaire(Utilisateur proprietaire, Pageable pageable);

    List<Reservation> findByAnnonce_IdAndStatut(Long annonceId, StatutReservation statut);

    @Query("""
        SELECT COUNT(r) > 0 FROM Reservation r
        WHERE r.annonce.id = :annonceId
        AND r.statut IN ('EN_ATTENTE', 'CONFIRMEE')
        AND NOT (r.dateFin < :debut OR r.dateDebut > :fin)
    """)
    boolean existsConflict(
        @Param("annonceId") Long annonceId,
        @Param("debut") LocalDate debut,
        @Param("fin") LocalDate fin
    );
}
