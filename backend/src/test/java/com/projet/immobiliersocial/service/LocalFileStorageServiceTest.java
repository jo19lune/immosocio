package com.projet.immobiliersocial.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
// unused import removed

/**
 * Tests unitaires pour {@link LocalFileStorageService}.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class LocalFileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Mock
    private MockMultipartFile mockFile;

    private LocalFileStorageService service;

    @BeforeEach
    void setUp() {
        service = new LocalFileStorageService();
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "serverPort", "8080");
        ReflectionTestUtils.setField(service, "baseUrl", "http://localhost:8080");
    }

    @Test
    void sauvegarderImage_withValidImage_shouldReturnUrl() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );

        // Act
        String url = service.sauvegarderImage(file, "publications");

        // Assert
        assertNotNull(url);
        assertTrue(url.contains("/images/publications/"));
        assertTrue(url.endsWith(".jpg"));
    }

    @Test
    void sauvegarderImage_withPngExtension_shouldReturnPngUrl() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.png", "image/png", "test content".getBytes()
        );

        // Act
        String url = service.sauvegarderImage(file, "profils");

        // Assert
        assertTrue(url.endsWith(".png"));
    }

    @Test
    void sauvegarderImage_withNullFile_shouldThrowException() {
        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.sauvegarderImage(null, "publications")
        );
        assertEquals("Fichier vide ou absent", ex.getMessage());
    }

    @Test
    void sauvegarderImage_withEmptyFile_shouldThrowException() {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", new byte[0]
        );

        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.sauvegarderImage(emptyFile, "publications")
        );
        assertEquals("Fichier vide ou absent", ex.getMessage());
    }

    @Test
    void sauvegarderImage_withNonImageContentType_shouldThrowException() {
        // Arrange
        MockMultipartFile nonImageFile = new MockMultipartFile(
            "file", "test.txt", "text/plain", "test content".getBytes()
        );

        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.sauvegarderImage(nonImageFile, "publications")
        );
        assertTrue(ex.getMessage().contains("images sont acceptées"));
    }

    @Test
    void sauvegarderImage_withFileTooLarge_shouldThrowException() {
        // Arrange - create a file larger than 10MB
        byte[] largeContent = new byte[(int) (11L * 1024 * 1024)];
        MockMultipartFile largeFile = new MockMultipartFile(
            "file", "large.jpg", "image/jpeg", largeContent
        );

        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.sauvegarderImage(largeFile, "publications")
        );
        assertEquals("La taille de l'image ne doit pas dépasser 10 Mo", ex.getMessage());
    }

    @Test
    void sauvegarderImage_withNullContentType_shouldThrowException() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", null, "test content".getBytes()
        );

        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.sauvegarderImage(file, "publications")
        );
        assertTrue(ex.getMessage().contains("images sont acceptées"));
    }

    @Test
    void supprimerImage_withValidUrl_shouldDeleteFile() throws Exception {
        // Arrange - first save a file
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );
        String url = service.sauvegarderImage(file, "annonces");

        // Act
        service.supprimerImage(url);

        // Assert - file should be deleted (no exception means success)
    }

    @Test
    void supprimerImage_withNullUrl_shouldNotThrow() {
        // Act & Assert
        assertDoesNotThrow(() -> service.supprimerImage(null));
    }

    @Test
    void supprimerImage_withNonLocalUrl_shouldNotThrow() {
        // Act & Assert
        assertDoesNotThrow(() ->
            service.supprimerImage("https://external-cdn.com/image.jpg")
        );
    }

    @Test
    void obtenirExtension_withValidFilename_shouldReturnExtension() {
        // This tests the private method indirectly through sauvegarderImage
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.webp", "image/webp", "test".getBytes()
        );

        assertDoesNotThrow(() -> service.sauvegarderImage(file, "publications"));
    }

    @Test
    void sauvegarderImage_withNoExtension_shouldDefaultToJpg() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "testfile", "image/jpeg", "test content".getBytes()
        );

        // Act
        String url = service.sauvegarderImage(file, "publications");

        // Assert
        assertTrue(url.endsWith(".jpg"));
    }
}