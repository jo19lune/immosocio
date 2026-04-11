package com.projet.immobiliersocial.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Lie les propriétés app.frontend.* depuis application.properties.
 * Résout les warnings "unknown property" dans VSCode / Spring Tools.
 */
@Component
@ConfigurationProperties(prefix = "app.frontend")
public class AppProperties {

    private String url = "http://localhost:5173";

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
