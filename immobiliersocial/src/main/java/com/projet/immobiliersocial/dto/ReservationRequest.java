package com.projet.immobiliersocial.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ReservationRequest {
    private Long annonceId;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String message;
}
