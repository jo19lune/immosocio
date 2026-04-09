package com.projet.immobiliersocial.dto;

import lombok.Data;
import java.util.List;

@Data
public class PublicationRequest {
    private String contenu;
    private List<String> medias;
}
