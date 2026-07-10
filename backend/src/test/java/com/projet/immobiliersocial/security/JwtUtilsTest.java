package com.projet.immobiliersocial.security;

import com.projet.immobiliersocial.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

/**
 * Tests unitaires pour {@link JwtUtils}.
 */
@ExtendWith(MockitoExtension.class)
class JwtUtilsTest {

    @Mock
    private JwtProperties jwtProperties;

    private JwtUtils jwtUtils;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils(jwtProperties);
        
        lenient().when(jwtProperties.getSecret()).thenReturn("TestSecretKey_ChangeMeInProduction_32chars!");
        lenient().when(jwtProperties.getExpiration()).thenReturn(86400000L); // 24 hours
        
        userDetails = new User("testuser@test.com", "password", Collections.emptyList());
    }

    @Test
    void generateToken_shouldCreateValidToken() {
        // Act
        String token = jwtUtils.generateToken(userDetails);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractUsername_shouldReturnCorrectUsername() {
        // Arrange
        String token = jwtUtils.generateToken(userDetails);

        // Act
        String username = jwtUtils.extractUsername(token);

        // Assert
        assertEquals("testuser@test.com", username);
    }

    @Test
    void validateToken_withValidToken_shouldReturnTrue() {
        // Arrange
        String token = jwtUtils.generateToken(userDetails);

        // Act
        boolean isValid = jwtUtils.validateToken(token, userDetails);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateToken_withWrongUsername_shouldReturnFalse() {
        // Arrange
        String token = jwtUtils.generateToken(userDetails);
        UserDetails differentUser = new User("other@test.com", "password", Collections.emptyList());

        // Act
        boolean isValid = jwtUtils.validateToken(token, differentUser);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void generateToken_withExtraClaims_shouldIncludeClaims() {
        // Arrange
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        extraClaims.put("role", "ADMIN");
        extraClaims.put("userId", 123L);

        // Act
        String token = jwtUtils.generateToken(extraClaims, userDetails);

        // Assert
        assertNotNull(token);
        Long extractedUserId = jwtUtils.extractClaim(token, claims -> claims.get("userId", Long.class));
        assertEquals((Long) 123L, extractedUserId);
    }

    @Test
    void extractClaim_withCustomClaim_shouldWork() {
        // Arrange
        String token = jwtUtils.generateToken(userDetails);

        // Act
        String username = jwtUtils.extractClaim(token, claims -> claims.getSubject());

        // Assert
        assertEquals("testuser@test.com", username);
    }

    @Test
    void validateToken_withInvalidToken_shouldThrowException() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act & Assert
        assertThrows(Exception.class, () -> jwtUtils.validateToken(invalidToken, userDetails));
    }
}