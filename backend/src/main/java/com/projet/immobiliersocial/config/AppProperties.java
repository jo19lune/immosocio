package com.projet.immobiliersocial.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Lie les propriétés app.frontend.* depuis application.properties.
 * Résout les warnings "unknown property" dans VSCode / Spring Tools.
 *
 * Exemple .env :
 *   FRONTEND_URL=http://localhost:5173,http://localhost:4200,http://localhost:3000
 */
@Component
@ConfigurationProperties(prefix = "app.frontend")
public class AppProperties {

    /**
     * Valeur brute lue depuis la propriété app.frontend.url.
     * Peut être une seule URL ou plusieurs séparées par des virgules.
     */
    private String url = "http://localhost:5173";

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    /**
     * Retourne la liste des URLs frontend en splittant par virgule
     * et en nettoyant les espaces superflus.
     */
    public List<String> getUrls() {
        if (url == null || url.isBlank()) {
            return List.of("http://localhost:5173");
        }
        return Arrays.stream(url.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
