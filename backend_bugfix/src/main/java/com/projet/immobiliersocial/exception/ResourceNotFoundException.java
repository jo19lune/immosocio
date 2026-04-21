package com.projet.immobiliersocial.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    public ResourceNotFoundException(String entite, Long id) {
        super(entite + " introuvable avec l'id : " + id);
    }
}
