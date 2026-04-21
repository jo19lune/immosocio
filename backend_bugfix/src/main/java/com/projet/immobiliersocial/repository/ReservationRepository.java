package com.projet.immobiliersocial.repository;

import com.projet.immobiliersocial.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@SuppressWarnings("null")
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Page<Reservation> findByLocataire(Utilisateur locataire, Pageable pageable);

    Page<Reservation> findByAnnonce_Proprietaire(Utilisateur proprietaire, Pageable pageable);

    List<Reservation> findByAnnonce_IdAndStatut(Long annonceId, StatutReservation statut);

    /**
     * Vérifie l'existence d'un conflit de dates pour une annonce donnée.
     * CASE WHEN ... THEN true ELSE false END est la syntaxe JPQL correcte
     * pour retourner un boolean (SELECT COUNT > 0 n'est pas du JPQL valide).
     * Les statuts sont passés en paramètre pour éviter les littéraux string
     * d'enum qui ne sont pas portables en Hibernate 6.
     */
    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM Reservation r
        WHERE r.annonce.id = :annonceId
        AND r.statut IN :statuts
        AND NOT (r.dateFin < :debut OR r.dateDebut > :fin)
    """)
    boolean existsConflict(
        @Param("annonceId") Long annonceId,
        @Param("debut") LocalDate debut,
        @Param("fin") LocalDate fin,
        @Param("statuts") Collection<StatutReservation> statuts
    );

    /** Méthode de commodité — statuts actifs (EN_ATTENTE + CONFIRMEE) par défaut. */
    default boolean existsConflict(Long annonceId, LocalDate debut, LocalDate fin) {
        return existsConflict(annonceId, debut, fin,
                List.of(StatutReservation.EN_ATTENTE, StatutReservation.CONFIRMEE));
    }
}
