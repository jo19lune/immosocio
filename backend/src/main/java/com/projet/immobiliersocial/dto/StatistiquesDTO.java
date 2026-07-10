package com.projet.immobiliersocial.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatistiquesDTO {
    private long totalUtilisateurs;
    private long annoncesActives;
    private long totalReservations;
}
