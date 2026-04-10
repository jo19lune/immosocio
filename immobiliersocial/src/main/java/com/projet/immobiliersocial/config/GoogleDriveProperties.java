package com.projet.immobiliersocial.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Lie les propriétés app.google.drive.* depuis application.properties.
 * Résout les warnings "unknown property" dans VSCode / Spring Tools.
 */
@Component
@ConfigurationProperties(prefix = "app.google.drive")
public class GoogleDriveProperties {

    private String credentialsPath;
    private String folderId;
    private String applicationName = "ImmobilierSocial";

    public String getCredentialsPath() { return credentialsPath; }
    public void setCredentialsPath(String credentialsPath) { this.credentialsPath = credentialsPath; }

    public String getFolderId() { return folderId; }
    public void setFolderId(String folderId) { this.folderId = folderId; }

    public String getApplicationName() { return applicationName; }
    public void setApplicationName(String applicationName) { this.applicationName = applicationName; }
}
