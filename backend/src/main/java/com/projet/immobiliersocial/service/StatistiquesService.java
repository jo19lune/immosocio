package com.projet.immobiliersocial.service;

import com.projet.immobiliersocial.dto.StatistiquesDTO;
import com.projet.immobiliersocial.repository.AnnonceRepository;
import com.projet.immobiliersocial.repository.ReservationRepository;
import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatistiquesService {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public StatistiquesDTO getStatistiques() {
        return StatistiquesDTO.builder()
                .totalUtilisateurs(utilisateurRepository.count())
                .annoncesActives(annonceRepository.countAnnoncesActives())
                .totalReservations(reservationRepository.count())
                .build();
    }
}
