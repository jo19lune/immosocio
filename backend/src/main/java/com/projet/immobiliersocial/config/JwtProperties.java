package com.projet.immobiliersocial.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Lie les propriétés app.jwt.* depuis application.properties.
 * Résout les warnings "unknown property" dans VSCode Spring Tools.
 */
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret = "DefaultSecretKey_ChangeMeInProduction_32chars!";
    private long expiration = 86400000L; // 24h en ms

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }

    public long getExpiration() { return expiration; }
    public void setExpiration(long expiration) { this.expiration = expiration; }
}
