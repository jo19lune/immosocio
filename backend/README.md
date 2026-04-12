# 🏠 Immobilier Social — Backend API

> Plateforme de location immobilière avec fonctionnalités sociales.  
> Stack : **Spring Boot 3** · **PostgreSQL** · **Spring Security** · **JWT**

---

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation & démarrage](#installation--démarrage)
- [Configuration](#configuration)
- [API REST](#api-rest)
- [Sécurité & rôles](#sécurité--rôles)
- [Modèle de données](#modèle-de-données)

---

## Aperçu

**Immobilier Social** est une API REST qui centralise :

- 🔍 La **recherche et réservation** de logements (maisons, appartements, studios…)
- 🏠 La **gestion d'annonces** par les propriétaires
- 💬 Un **module social** : publications, likes, commentaires
- 🔔 Des **notifications** en temps réel
- 🔐 Une **authentification JWT** avec gestion des rôles

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| Java | 17 LTS | Langage principal |
| Spring Boot | 3.3.x | Framework backend |
| Spring Security | 6.x | Authentification & autorisation |
| Spring Data JPA | 3.x | ORM & accès données |
| PostgreSQL | 15+ | Base de données |
| JJWT | 0.11.5 | Génération / validation JWT |
| Lombok | Latest | Réduction boilerplate |
| Maven | 3.8+ | Gestion des dépendances |

---

## Structure du projet

```txt
src/main/java/com/projet/immobiliersocial/
│
├── entity/               # Entités JPA (modèle de données)
│   ├── Utilisateur.java
│   ├── Annonce.java
│   ├── Reservation.java
│   ├── Publication.java
│   ├── Commentaire.java
│   ├── Like.java
│   ├── Notification.java
│   └── enums/            # Role, TypeLogement, StatutAnnonce, StatutReservation, TypeNotification
│
├── repository/           # Interfaces Spring Data JPA
│   ├── UtilisateurRepository.java
│   ├── AnnonceRepository.java      # Recherche JPQL avancée
│   ├── ReservationRepository.java  # Vérification conflits de dates
│   ├── PublicationRepository.java
│   ├── LikeRepository.java
│   ├── CommentaireRepository.java
│   └── NotificationRepository.java
│
├── controller/           # Endpoints REST
│   ├── AuthController.java         # /api/auth/**
│   ├── AnnonceController.java      # /api/annonces/**
│   ├── ReservationController.java  # /api/reservations/**
│   ├── PublicationController.java  # /api/publications/**
│   └── NotificationController.java # /api/notifications/**
│
├── security/             # JWT & Spring Security
│   ├── JwtUtils.java               # Génération & validation token
│   ├── JwtAuthFilter.java          # Filtre Bearer par requête
│   └── UserDetailsServiceImpl.java # Chargement utilisateur depuis DB
│
├── config/
│   └── SecurityConfig.java         # Règles CORS + autorisation par rôle
│
└── dto/                  # Objets de transfert
    ├── AuthRequest.java
    ├── AuthResponse.java
    ├── RegisterRequest.java
    ├── AnnonceRequest.java
    └── ReservationRequest.java

src/main/resources/
└── application.properties          # Config DB, JWT, multipart
```

---

## Prérequis

- **Java 17+** — [Télécharger](https://adoptium.net/)
- **PostgreSQL 15+** — [Télécharger](https://www.postgresql.org/download/)
- **Maven 3.8+** (ou utiliser le wrapper `mvnw` inclus)

---

## Installation & démarrage

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/immobiliersocial.git
cd immobiliersocial
```

### 2. Créer la base de données PostgreSQL

```sql
CREATE DATABASE immobiliersocial;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE immobiliersocial TO postgres;
```

### 3. Configurer `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/immobiliersocial
spring.datasource.username=postgres
spring.datasource.password=postgres

app.jwt.secret=VotreSecretJWT_ChangezMoiEnProduction!
app.jwt.expiration=86400000
```

### 4. Lancer l'application

```bash
# Avec le wrapper Maven inclus
./mvnw spring-boot:run

# Ou avec Maven installé
mvn spring-boot:run
```

L'API démarre sur **`http://localhost:8080`**

---

## Configuration

| Propriété | Valeur par défaut | Description |
|---|---|---|
| `server.port` | `8080` | Port du serveur |
| `spring.jpa.hibernate.ddl-auto` | `update` | Création/mise à jour auto des tables |
| `app.jwt.expiration` | `86400000` | Durée du token JWT (24h en ms) |
| `app.jwt.secret` | *(à changer)* | Clé secrète HS256 — **obligatoire en prod** |
| `spring.servlet.multipart.max-file-size` | `10MB` | Taille max par fichier uploadé |

---

## API REST

### 🔐 Authentification — `/api/auth`

| Méthode | Endpoint | Corps | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, motDePasse, nom, prenom, telephone, role }` | Inscription (role: `LOCATAIRE` ou `PROPRIETAIRE`) |
| `POST` | `/api/auth/login` | `{ email, motDePasse }` | Connexion → retourne un token JWT |

**Exemple login :**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","motDePasse":"Pass123!"}'
```

**Réponse :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "user@mail.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "LOCATAIRE"
}
```

> Pour les requêtes protégées, ajoutez le header :  
> `Authorization: Bearer <votre_token>`

---

### 🏠 Annonces — `/api/annonces`

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| `GET` | `/api/annonces` | Public | Liste paginée des annonces disponibles |
| `GET` | `/api/annonces/{id}` | Public | Détail d'une annonce |
| `GET` | `/api/annonces/recherche` | Public | Recherche avancée (ville, type, prix) |
| `POST` | `/api/annonces` | PROPRIETAIRE | Créer une annonce |
| `PUT` | `/api/annonces/{id}` | PROPRIETAIRE | Modifier son annonce |
| `DELETE` | `/api/annonces/{id}` | PROPRIETAIRE / ADMIN | Supprimer une annonce |
| `GET` | `/api/annonces/mes-annonces` | PROPRIETAIRE | Ses propres annonces |

**Paramètres de recherche :**

```
GET /api/annonces/recherche?ville=Antananarivo&type=APPARTEMENT&prixMin=100000&prixMax=500000&page=0&size=12
```

**Corps pour créer une annonce :**

```json
{
  "titre": "Bel appartement F3 centre-ville",
  "description": "Appartement lumineux avec vue...",
  "adresse": "12 Rue de la Paix",
  "ville": "Antananarivo",
  "pays": "Madagascar",
  "prix": 350000,
  "nombrePieces": 3,
  "superficie": 75.5,
  "typeLogement": "APPARTEMENT",
  "photos": ["https://url-photo1.jpg", "https://url-photo2.jpg"]
}
```

---

### 📅 Réservations — `/api/reservations`

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| `POST` | `/api/reservations` | LOCATAIRE | Créer une réservation (vérifie les conflits de dates) |
| `GET` | `/api/reservations/mes-reservations` | LOCATAIRE | Ses réservations |
| `GET` | `/api/reservations/demandes` | PROPRIETAIRE | Demandes reçues |
| `PATCH` | `/api/reservations/{id}/confirmer` | PROPRIETAIRE | Confirmer une demande |
| `PATCH` | `/api/reservations/{id}/annuler` | LOCATAIRE / PROPRIETAIRE | Annuler |

**Corps pour réserver :**

```json
{
  "annonceId": 42,
  "dateDebut": "2026-04-01",
  "dateFin": "2026-06-30",
  "message": "Bonjour, je suis intéressé par votre logement..."
}
```

---

### 💬 Publications & Social — `/api/publications`

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| `GET` | `/api/publications` | Public | Fil d'actualité paginé |
| `POST` | `/api/publications` | Authentifié | Créer une publication |
| `DELETE` | `/api/publications/{id}` | Auteur / ADMIN | Supprimer |
| `POST` | `/api/publications/{id}/like` | Authentifié | Toggle like / unlike |
| `GET` | `/api/publications/{id}/commentaires` | Public | Voir les commentaires |
| `POST` | `/api/publications/{id}/commentaires` | Authentifié | Ajouter un commentaire |

---

### 🔔 Notifications — `/api/notifications`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Notifications de l'utilisateur connecté |
| `GET` | `/api/notifications/count` | Nombre de notifications non lues |
| `PATCH` | `/api/notifications/{id}/lire` | Marquer comme lue |

---

## Sécurité & rôles

L'application utilise **Spring Security + JWT (HS256)** avec 3 rôles :

```
LOCATAIRE
  └── Rechercher et réserver des logements
  └── Publications, likes, commentaires
  └── Voir et annuler ses réservations

PROPRIETAIRE
  └── Tout ce que fait le LOCATAIRE
  └── Publier, modifier, supprimer ses annonces
  └── Confirmer / annuler les réservations reçues

ADMIN
  └── Tout ce que font les autres rôles
  └── Supprimer n'importe quelle publication ou annonce
  └── Accès aux routes /api/admin/**
```

**Flux d'authentification :**

```
POST /api/auth/login
       ↓
AuthenticationManager vérifie les credentials
       ↓
JwtUtils génère un token signé (HS256, 24h)
       ↓
Client stocke le token et l'envoie dans chaque requête
       ↓
JwtAuthFilter valide le token → injecte dans SecurityContext
       ↓
@PreAuthorize vérifie le rôle → accès accordé ou refusé (403)
```

---

## Modèle de données

```
Utilisateur ──< Annonce          (1 propriétaire → N annonces)
Utilisateur ──< Reservation      (1 locataire → N réservations)
Annonce     ──< Reservation      (1 annonce → N réservations)
Utilisateur ──< Publication      (1 utilisateur → N publications)
Publication ──< Commentaire      (1 publication → N commentaires)
Publication ──< Like             (contrainte UNIQUE user + publication)
Utilisateur ──< Notification     (1 utilisateur → N notifications)
```

**Statuts d'une annonce :** `DISPONIBLE` → `RESERVE` → `LOUE` → `SUSPENDU`

**Statuts d'une réservation :** `EN_ATTENTE` → `CONFIRMEE` / `ANNULEE` → `TERMINEE`

---

## Codes de retour HTTP

| Code | Signification |
|---|---|
| `200 OK` | Succès |
| `400 Bad Request` | Données invalides (ex : conflit de dates) |
| `401 Unauthorized` | Token manquant ou invalide |
| `403 Forbidden` | Rôle insuffisant |
| `404 Not Found` | Ressource introuvable |

---

> **Note production** : Changez impérativement `app.jwt.secret` et `spring.datasource.password` dans `application.properties` avant tout déploiement.
