package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.Theme;
import com.projet.immobiliersocial.entity.VisibilitePublication;
import lombok.Data;

@Data
public class ParametresRequest {
    private Theme theme;
    private VisibilitePublication visibiliteParDefaut;
    private Boolean notificationsEmail;
    private Boolean notificationsPush;
}
