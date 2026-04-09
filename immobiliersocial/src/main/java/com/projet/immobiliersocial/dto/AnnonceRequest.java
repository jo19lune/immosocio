package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.TypeLogement;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AnnonceRequest {
    private String titre;
    private String description;
    private String adresse;
    private String ville;
    private String pays;
    private BigDecimal prix;
    private Integer nombrePieces;
    private Double superficie;
    private TypeLogement typeLogement;
    private List<String> photos;
}
