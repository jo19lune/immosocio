package com.projet.immobiliersocial.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Configure le mapping statique /images/** vers le dossier d'upload local.
 *
 * Les images uploadées sont accessibles publiquement via :
 *   GET http://localhost:8080/images/{sous-dossier}/{fichier.ext}
 *
 * L'accès est autorisé sans JWT dans SecurityConfig (.requestMatchers("/images/**").permitAll()).
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Chemin absolu du dossier uploads
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + absolutePath + "/")
                .setCachePeriod(3600) // Cache 1 heure côté navigateur
                .resourceChain(true);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/")
                .setCachePeriod(3600)
                .resourceChain(true);
    }
}
