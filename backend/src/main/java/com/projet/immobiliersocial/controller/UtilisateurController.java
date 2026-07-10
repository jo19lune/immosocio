package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @DeleteMapping("/batch")
    public ResponseEntity<Void> deleteUtilisateursEnLot(@RequestBody List<Long> ids) {
        utilisateurService.deleteUtilisateursEnLot(ids);
        return ResponseEntity.noContent().build();
    }
}
