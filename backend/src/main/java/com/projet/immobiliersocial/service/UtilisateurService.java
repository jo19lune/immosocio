package com.projet.immobiliersocial.service;

import com.projet.immobiliersocial.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public void deleteUtilisateursEnLot(List<Long> ids) {
        utilisateurRepository.deleteAllByIdInBatch(ids);
    }
}
