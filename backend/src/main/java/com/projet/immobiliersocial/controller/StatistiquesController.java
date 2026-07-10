package com.projet.immobiliersocial.controller;

import com.projet.immobiliersocial.dto.StatistiquesDTO;
import com.projet.immobiliersocial.service.StatistiquesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/statistiques")
@RequiredArgsConstructor
public class StatistiquesController {

    private final StatistiquesService statistiquesService;

    @GetMapping
    public ResponseEntity<StatistiquesDTO> getStatistiques() {
        return ResponseEntity.ok(statistiquesService.getStatistiques());
    }
}
