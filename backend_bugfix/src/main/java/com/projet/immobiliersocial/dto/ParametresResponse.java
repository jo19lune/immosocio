package com.projet.immobiliersocial.dto;

import com.projet.immobiliersocial.entity.Theme;
import com.projet.immobiliersocial.entity.VisibilitePublication;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParametresResponse {
    private Theme theme;
    private VisibilitePublication visibiliteParDefaut;
    private boolean notificationsEmail;
    private boolean notificationsPush;
    private boolean emailVerifie;
}
