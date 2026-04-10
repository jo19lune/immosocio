package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.VisibilitePublication;
import lombok.Data;
import java.util.List;

@Data
public class PublicationRequest {
    private String contenu;
    private List<String> medias;
    private VisibilitePublication visibilite;
    private Long annonceId;
}
