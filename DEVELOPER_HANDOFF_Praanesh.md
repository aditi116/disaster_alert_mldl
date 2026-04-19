# Disaster Alert Platform - Complete Developer Handoff Documentation

**Project:** Disaster Alert Platform (MLDL Integration)  
**Last Updated:** April 19, 2026  
**Frontend:** React 18.2  
**Backend:** Spring Boot 3.1.5 + Java 17

---

## TABLE OF CONTENTS

1. [Backend Project Setup](#backend-project-setup)
2. [Backend Package Structure](#backend-package-structure)
3. [Entities](#entities)
4. [Repositories](#repositories)
5. [Services](#services)
6. [Controllers](#controllers)
7. [DTOs](#dtos)
8. [Security](#security)
9. [ML Layer (Detailed)](#ml-layer)
10. [Exception Handling](#exception-handling)
11. [Database](#database)
12. [Frontend Setup](#frontend-setup)
13. [Frontend Components](#frontend-components)
14. [Frontend Routing](#frontend-routing)
15. [State Management](#state-management)
16. [Not Yet Done](#not-yet-done)

---

## BACKEND PROJECT SETUP

### Base Information

- **Base Package:** `com.disasteralert`
- **Java Version:** 17
- **Spring Boot Version:** 3.1.5
- **Maven Project:** disaster-alert-backend (v0.0.1-SNAPSHOT)

### Dependencies (pom.xml)

| Dependency              | GroupId                      | ArtifactId                          | Version          |
| ----------------------- | ---------------------------- | ----------------------------------- | ---------------- |
| Spring Boot Starter Web | org.springframework.boot     | spring-boot-starter-web             | 3.1.5 (parent)   |
| Spring Boot Data JPA    | org.springframework.boot     | spring-boot-starter-data-jpa        | 3.1.5 (parent)   |
| Spring Boot Security    | org.springframework.boot     | spring-boot-starter-security        | 3.1.5 (parent)   |
| Spring Boot Validation  | org.springframework.boot     | spring-boot-starter-validation      | 3.1.5 (parent)   |
| MySQL Connector         | com.mysql                    | mysql-connector-j                   | 8.2.0            |
| JJWT API                | io.jsonwebtoken              | jjwt-api                            | 0.11.5           |
| JJWT Impl               | io.jsonwebtoken              | jjwt-impl                           | 0.11.5 (runtime) |
| JJWT Jackson            | io.jsonwebtoken              | jjwt-jackson                        | 0.11.5 (runtime) |
| Lombok                  | org.projectlombok            | lombok                              | (parent)         |
| Spring Boot Test        | org.springframework.boot     | spring-boot-starter-test            | 3.1.5 (test)     |
| Spring Security Test    | org.springframework.security | spring-security-test                | (test)           |
| SpringDoc OpenAPI UI    | org.springdoc                | springdoc-openapi-starter-webmvc-ui | 2.2.0            |

### application.properties (Complete)

```properties
# Server Configuration
server.port=8081
server.servlet.context-path=/api

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/disaster_alert?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=yuvi
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
app.jwt.secret=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437
app.jwt.expiration-ms=86400000

# Logging
logging.level.org.springframework.security=INFO
logging.level.com.disasteralert=DEBUG

# CORS Configuration
app.cors.allowed-origins=http://localhost:3000
```

### Key Configuration Values

- **Server Port:** 8081
- **Context Path:** /api
- **Database Name:** disaster_alert
- **Database Host:** localhost:3306
- **Database User:** root
- **Database Password:** yuvi
- **JWT Secret (Base64 encoded):** 5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437
- **JWT Expiration:** 86400000 ms (24 hours)
- **CORS Allowed Origins:** http://localhost:3000

---

## BACKEND PACKAGE STRUCTURE

### com.disasteralert

- **DisasterAlertApplication.java** - Spring Boot application entry point

### com.disasteralert.config

- **DataInitializer.java** - Initializes default users, alert types, resource types
- **WebSecurityConfig.java** - Spring Security configuration, JWT filters, CORS
- **SwaggerConfig.java** - OpenAPI/Swagger configuration for API documentation

### com.disasteralert.controller

- **AuthController.java** - Login, Register endpoints
- **AlertController.java** - Alert CRUD and operations (GET, POST, PATCH, DELETE, vote)
- **ResourceController.java** - Resource CRUD and operations

### com.disasteralert.entity

- **User.java** - User entity, implements UserDetails
- **Alert.java** - Alert entity with ML fields (credibility, predicted severity)
- **AlertType.java** - Alert type enum-like entity
- **Resource.java** - Resource entity
- **ResourceType.java** - Resource type entity
- **Vote.java** - Vote entity for alert voting
- **Role.java** - Enum for user roles

### com.disasteralert.repository

- **UserRepository.java** - User CRUD + custom queries
- **AlertRepository.java** - Alert CRUD + geospatial queries
- **AlertTypeRepository.java** - AlertType CRUD
- **ResourceRepository.java** - Resource CRUD + queries
- **ResourceTypeRepository.java** - ResourceType CRUD
- **VoteRepository.java** - Vote CRUD + counting queries

### com.disasteralert.service

- **AlertService.java** - Alert business logic, calls ML services
- **ResourceService.java** - Resource business logic
- **VoteService.java** - Voting logic, reputation hooks
- **UserDetailsServiceImpl.java** - Spring Security user details loader

### com.disasteralert.dto

- **LoginRequest.java** - Login credentials
- **SignupRequest.java** - Registration credentials
- **JwtResponse.java** - JWT token response
- **AlertRequest.java** - Create/update alert request
- **AlertResponse.java** - Alert response DTO
- **ResourceRequest.java** - Create/update resource request
- **ResourceResponse.java** - Resource response DTO
- **VoteRequest.java** - Vote request (upvote flag)
- **MessageResponse.java** - Generic message response

### com.disasteralert.security

- **JwtTokenProvider.java** - JWT generation, validation, token parsing
- **JwtAuthenticationFilter.java** - Request filter for JWT extraction and authentication
- **JwtAuthenticationEntryPoint.java** - Handles unauthorized access exceptions

### com.disasteralert.exception

- **GlobalExceptionHandler.java** - Centralized exception handling
- **ResourceNotFoundException.java** - Custom exception for missing resources
- **UnauthorizedException.java** - Custom exception for authorization failures

### com.disasteralert.ml.service

- **NaiveBayesCredibilityService.java** - Naive Bayes classifier for alert credibility
- **DecisionTreeSeverityService.java** - Decision tree for severity prediction
- **DecisionTreeEscalationService.java** - Decision tree for escalation rules
- **KMeansClusteringService.java** - K-Means for alert hotspot detection
- **KNNAlertService.java** - K-Nearest Neighbors for similar alert finding
- **KNNResourceMatcherService.java** - KNN for nearest resource matching
- **ReputationService.java** - User reputation system

### com.disasteralert.ml.controller

- **AuthController.java** - (See controllers above)
- **AlertController.java** - (See controllers above)
- **CredibilityController.java** - ML endpoint for alert credibility
- **HotspotController.java** - ML endpoint for hotspot clusters
- **KNNController.java** - ML endpoints for similar alerts and resources
- **ReputationController.java** - Reputation endpoints
- **SeverityController.java** - Severity prediction endpoint

### com.disasteralert.ml.dto

- **CredibilityResultDTO.java** - Credibility classification result
- **ClusterResultDTO.java** - K-Means cluster result
- **SimilarAlertDTO.java** - Similar alert from KNN
- **NearestResourceDTO.java** - Nearest resource from KNN
- **SeverityPredictionDTO.java** - Severity prediction result
- **ReputationSummaryDTO.java** - User reputation summary
- **ReputationEventDTO.java** - Individual reputation event
- **ReputationEventRequest.java** - Request for applying reputation event

### com.disasteralert.ml.model

- **ReputationEventType.java** - Enum with point values
- **ReputationEvent.java** - Reputation event entity

### com.disasteralert.ml.repository

- **ReputationEventRepository.java** - Reputation event CRUD

---

## ENTITIES

### User

| Property        | Java Type     | Column Name      | Constraints & Annotations                           |
| --------------- | ------------- | ---------------- | --------------------------------------------------- |
| id              | Long          | id               | @Id, @GeneratedValue(IDENTITY)                      |
| username        | String        | username         | @NotBlank, @Size(max=20), @UniqueConstraint         |
| email           | String        | email            | @NotBlank, @Size(max=50), @Email, @UniqueConstraint |
| password        | String        | password         | @NotBlank, @Size(max=120)                           |
| firstName       | String        | first_name       | @Size(max=50)                                       |
| lastName        | String        | last_name        | @Size(max=50)                                       |
| roles           | Set<Role>     | -                | @ElementCollection(EAGER), @Enumerated(STRING)      |
| reputationScore | Integer       | reputation_score | default=0                                           |
| enabled         | boolean       | enabled          | default=true                                        |
| createdAt       | LocalDateTime | created_at       | @CreationTimestamp                                  |
| updatedAt       | LocalDateTime | updated_at       | @UpdateTimestamp                                    |

**Table Name:** `users`  
**Implements:** `UserDetails`, `GrantedAuthority` converter  
**Constructor:** `User(String username, String email, String password)`

---

### Alert

| Property              | Java Type     | Column Name            | Constraints & Annotations                          |
| --------------------- | ------------- | ---------------------- | -------------------------------------------------- |
| id                    | Long          | id                     | @Id, @GeneratedValue(IDENTITY)                     |
| title                 | String        | title                  | @NotBlank, @Size(max=100)                          |
| description           | String        | description            | @Lob                                               |
| alertType             | AlertType     | alert_type_id          | @ManyToOne(LAZY), @JoinColumn(nullable=false)      |
| severity              | Integer       | severity               | @Min(1), @Max(5)                                   |
| latitude              | Double        | latitude               | @NotNull                                           |
| longitude             | Double        | longitude              | @NotNull                                           |
| user                  | User          | user_id                | @ManyToOne(LAZY), @JoinColumn(nullable=false)      |
| status                | AlertStatus   | status                 | @Enumerated(STRING), default=ACTIVE                |
| reliabilityScore      | Integer       | reliability_score      | default=0                                          |
| predictedSeverity     | Integer       | predicted_severity     | ML field                                           |
| credibilityLabel      | String        | credibility_label      | ML field (CREDIBLE/SUSPICIOUS/SPAM), @Size(max=20) |
| credibilityConfidence | Float         | credibility_confidence | ML field (0-1)                                     |
| createdAt             | LocalDateTime | created_at             | @CreationTimestamp                                 |
| updatedAt             | LocalDateTime | updated_at             | @UpdateTimestamp                                   |

**Table Name:** `alerts`  
**Enum - AlertStatus:** `ACTIVE, RESOLVED, FALSE_ALARM`

---

### Resource

| Property     | Java Type      | Column Name      | Constraints & Annotations                             |
| ------------ | -------------- | ---------------- | ----------------------------------------------------- |
| id           | Long           | id               | @Id, @GeneratedValue(IDENTITY)                        |
| title        | String         | title            | @NotBlank, @Size(max=100)                             |
| description  | String         | description      | @Lob                                                  |
| resourceType | ResourceType   | resource_type_id | @ManyToOne(LAZY), @JoinColumn(nullable=false)         |
| status       | ResourceStatus | resource_status  | @Enumerated(STRING), default=AVAILABLE, @Size(max=20) |
| user         | User           | user_id          | @ManyToOne(LAZY), @JoinColumn(nullable=false)         |
| alert        | Alert          | alert_id         | @ManyToOne(LAZY), @JoinColumn(nullable=true)          |
| latitude     | Double         | latitude         | nullable                                              |
| longitude    | Double         | longitude        | nullable                                              |
| contactInfo  | String         | contact_info     | @Size(max=255)                                        |
| createdAt    | LocalDateTime  | created_at       | @CreationTimestamp                                    |
| updatedAt    | LocalDateTime  | updated_at       | @UpdateTimestamp                                      |

**Table Name:** `resources`  
**Enum - ResourceStatus:** `AVAILABLE, REQUESTED, RESERVED, FULFILLED`

---

### Vote

| Property  | Java Type     | Column Name | Constraints & Annotations                     |
| --------- | ------------- | ----------- | --------------------------------------------- |
| id        | Long          | id          | @Id, @GeneratedValue(IDENTITY)                |
| alert     | Alert         | alert_id    | @ManyToOne(LAZY), @JoinColumn(nullable=false) |
| user      | User          | user_id     | @ManyToOne(LAZY), @JoinColumn(nullable=false) |
| isUpvote  | Boolean       | is_upvote   | nullable=false                                |
| createdAt | LocalDateTime | created_at  | @CreationTimestamp                            |

**Table Name:** `votes`  
**Unique Constraint:** (alert_id, user_id)

---

### AlertType

| Property    | Java Type | Column Name | Constraints & Annotations         |
| ----------- | --------- | ----------- | --------------------------------- |
| id          | Integer   | id          | @Id, @GeneratedValue(IDENTITY)    |
| name        | String    | name        | @NotBlank, @Size(max=50), @Unique |
| description | String    | description | @Size(max=255)                    |
| icon        | String    | icon        | @Size(max=50)                     |

**Table Name:** `alert_types`

---

### ResourceType

| Property    | Java Type | Column Name | Constraints & Annotations         |
| ----------- | --------- | ----------- | --------------------------------- |
| id          | Integer   | id          | @Id, @GeneratedValue(IDENTITY)    |
| name        | String    | name        | @NotBlank, @Size(max=50), @Unique |
| description | String    | description | @Size(max=255)                    |
| icon        | String    | icon        | @Size(max=50)                     |

**Table Name:** `resource_types`

---

### Role (Enum)

```java
public enum Role {
    ROLE_USER,
    ROLE_ADMIN
}
```

---

## REPOSITORIES

### UserRepository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
}
```

---

### AlertRepository

```java
public interface AlertRepository extends JpaRepository<Alert, Long> {
    @Query("SELECT DISTINCT a FROM Alert a LEFT JOIN FETCH a.alertType WHERE a.status = :status")
    Page<Alert> findByStatus(@Param("status") Alert.AlertStatus status, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE " +
           "(a.latitude BETWEEN :minLat AND :maxLat) AND " +
           "(a.longitude BETWEEN :minLng AND :maxLng) " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findWithinBoundingBox(
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLng") double minLng,
            @Param("maxLng") double maxLng,
            Pageable pageable);

    @Query(value = "SELECT a.* FROM alerts a WHERE " +
            "ST_Distance_Sphere(point(a.longitude, a.latitude), point(:lng, :lat)) <= :radius " +
            "AND a.status = 'ACTIVE' " +
            "ORDER BY a.created_at DESC", nativeQuery = true)
    List<Alert> findNearbyAlerts(
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("radius") double radiusInMeters,
            Pageable pageable);

    Long countByUser_Id(Long userId);
}
```

---

### ResourceRepository

```java
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    Page<Resource> findByStatus(Resource.ResourceStatus status, Pageable pageable);
    Page<Resource> findByUser(User user, Pageable pageable);
    Page<Resource> findByAlert(Alert alert, Pageable pageable);

    @Query("SELECT r FROM Resource r WHERE " +
           "(r.latitude BETWEEN :minLat AND :maxLat) AND " +
           "(r.longitude BETWEEN :minLng AND :maxLng) " +
           "AND r.status = 'AVAILABLE' " +
           "ORDER BY r.createdAt DESC")
    List<Resource> findAvailableWithinBoundingBox(
        @Param("minLat") double minLat,
        // ... (continues with maxLat, minLng, maxLng, pageable)
    );

    // NOTE: findNearbyAvailableResources() is called but signature not in original file
}
```

---

### VoteRepository

```java
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByAlertAndUser(Alert alert, User user);

    @Query("SELECT COUNT(v) > 0 FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")
    boolean existsByAlertIdAndUserId(@Param("alertId") Long alertId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")
    void deleteByAlertIdAndUserId(@Param("alertId") Long alertId, @Param("userId") Long userId);

    @Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = true")
    long countUpvotesByAlertId(@Param("alertId") Long alertId);

    @Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = false")
    long countDownvotesByAlertId(@Param("alertId") Long alertId);
}
```

---

### AlertTypeRepository & ResourceTypeRepository

```java
public interface AlertTypeRepository extends JpaRepository<AlertType, Integer> { }
public interface ResourceTypeRepository extends JpaRepository<ResourceType, Integer> { }
```

---

## SERVICES

### AlertService

**Location:** `com.disasteralert.service.AlertService`

| Method Signature                                                  | Return Type         | Transactional                 | Description                                                                                   |
| ----------------------------------------------------------------- | ------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| createAlert(AlertRequest, String username)                        | AlertResponse       | @Transactional                | Creates new alert, calls Naive Bayes for credibility, Decision Tree for severity & escalation |
| getAlertById(Long id)                                             | AlertResponse       | @Transactional(readOnly=true) | Fetches alert by ID                                                                           |
| getAllAlerts(int page, int size)                                  | List<AlertResponse> | @Transactional(readOnly=true) | Paginated fetch all alerts                                                                    |
| getAlertsNearby(double lat, lng, radius, page, size)              | List<AlertResponse> | @Transactional(readOnly=true) | Geospatial query for alerts within radius                                                     |
| getAlertsWithinBounds(minLat, maxLat, minLng, maxLng, page, size) | List<AlertResponse> | @Transactional(readOnly=true) | Bounding box query                                                                            |
| updateAlertStatus(Long id, AlertStatus, String username)          | AlertResponse       | @Transactional                | Updates alert status (ACTIVE→RESOLVED→FALSE_ALARM)                                            |
| deleteAlert(Long id, String username)                             | void                | @Transactional                | Deletes alert (creator only)                                                                  |
| updateReliabilityScore(Long alertId, int scoreDelta)              | void                | @Transactional                | Increments/decrements reliability score                                                       |

**Dependencies Injected:**

- `AlertRepository`
- `AlertTypeRepository`
- `UserRepository`
- `NaiveBayesCredibilityService`
- `DecisionTreeSeverityService`
- `DecisionTreeEscalationService`

**Key Methods Details:**

`createAlert()` - Calls ML services in this order:

1. Naive Bayes: `naiveBayesCredibilityService.classify(alert)` → sets credibilityLabel, credibilityConfidence
2. Decision Tree: `decisionTreeSeverityService.predictSeverity(typeName, description, lat, lng)` → sets predictedSeverity
3. Escalation: `decisionTreeEscalationService.shouldEscalate(...)` → logs warning if true

---

### ResourceService

**Location:** `com.disasteralert.service.ResourceService`

| Method Signature                                               | Return Type            | Transactional                 | Description                                 |
| -------------------------------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------------- |
| createResource(ResourceRequest, String username)               | ResourceResponse       | @Transactional                | Creates resource, optionally links to alert |
| getResourceById(Long id)                                       | ResourceResponse       | @Transactional(readOnly=true) | Fetches resource by ID                      |
| getAllResources(int page, int size)                            | List<ResourceResponse> | @Transactional(readOnly=true) | Paginated fetch                             |
| getResourcesByStatus(ResourceStatus, page, size)               | List<ResourceResponse> | @Transactional(readOnly=true) | Filter by status                            |
| getResourcesNearby(lat, lng, radius, page, size)               | List<ResourceResponse> | @Transactional(readOnly=true) | Geospatial query                            |
| getResourcesByAlert(Long alertId, page, size)                  | List<ResourceResponse> | @Transactional(readOnly=true) | Resources linked to alert                   |
| updateResourceStatus(Long id, ResourceStatus, String username) | ResourceResponse       | @Transactional                | Updates resource status                     |
| deleteResource(Long id, String username)                       | void                   | @Transactional                | Deletes resource (creator only)             |

---

### VoteService

**Location:** `com.disasteralert.service.VoteService`

| Method Signature                                             | Return Type | Transactional                 | Description                                                               |
| ------------------------------------------------------------ | ----------- | ----------------------------- | ------------------------------------------------------------------------- |
| voteOnAlert(Long alertId, Boolean isUpvote, String username) | void        | @Transactional                | Toggle/change vote, updates reliability score, triggers reputation events |
| getUpvoteCount(Long alertId)                                 | long        | @Transactional(readOnly=true) | Returns upvote count for alert                                            |
| getDownvoteCount(Long alertId)                               | long        | @Transactional(readOnly=true) | Returns downvote count for alert                                          |
| getUserVote(Long alertId, String username)                   | Boolean     | @Transactional(readOnly=true) | Returns true for upvote, false for downvote, null if no vote              |

**Reputation Hooks:**

- When alert reaches exactly 10 upvotes → `reputationService.applyEvent(alert.getUser().getId(), ALERT_CONFIRMED, alertId)`
- When alert reliability score ≤ -5 → `reputationService.applyEvent(alert.getUser().getId(), LOW_RELIABILITY, alertId)`

---

### UserDetailsServiceImpl

**Location:** `com.disasteralert.service.UserDetailsServiceImpl`

```java
@Override
@Transactional
public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException
```

Returns User entity (which implements UserDetails) for Spring Security authentication.

---

## CONTROLLERS

### AuthController

**Base Path:** `/auth`  
**CORS:** `@CrossOrigin(origins = "*", maxAge = 3600)`

| HTTP Method | Path      | Parameters | Request Body  | Response        | Status | Security   |
| ----------- | --------- | ---------- | ------------- | --------------- | ------ | ---------- |
| POST        | /login    | -          | LoginRequest  | JwtResponse     | 200    | PERMIT_ALL |
| POST        | /register | -          | SignupRequest | MessageResponse | 200    | PERMIT_ALL |

**LoginRequest Fields:**

- username (String, @NotBlank)
- password (String, @NotBlank)

**SignupRequest Fields:**

- username (String, @NotBlank, min=3, max=20)
- email (String, @NotBlank, @Email, max=50)
- password (String, @NotBlank, min=6, max=40)
- firstName (String)
- lastName (String)

**JwtResponse:**

```json
{
  "token": "eyJhbGc...",
  "type": "Bearer",
  "id": 1,
  "username": "admin",
  "email": "admin@disaster.com",
  "roles": ["ROLE_USER"]
}
```

---

### AlertController

**Base Path:** `/alerts`  
**CORS:** `@CrossOrigin(origins = "*", maxAge = 3600)`

| HTTP Method | Path         | Query/Path Params                                                        | Request Body | Response                                | Status      | Security                     |
| ----------- | ------------ | ------------------------------------------------------------------------ | ------------ | --------------------------------------- | ----------- | ---------------------------- |
| POST        | /            | -                                                                        | AlertRequest | AlertResponse                           | 201 CREATED | AUTHENTICATED                |
| GET         | /{id}        | id: Long                                                                 | -            | AlertResponse                           | 200         | PUBLIC                       |
| GET         | /            | page, size, (optional: lat, lng, radius, minLat, maxLat, minLng, maxLng) | -            | List<AlertResponse>                     | 200         | PUBLIC                       |
| PATCH       | /{id}/status | id: Long, status: String (query)                                         | -            | AlertResponse                           | 200         | AUTHENTICATED (creator only) |
| DELETE      | /{id}        | id: Long                                                                 | -            | MessageResponse                         | 200         | AUTHENTICATED (creator only) |
| POST        | /{id}/vote   | id: Long                                                                 | VoteRequest  | MessageResponse                         | 200         | AUTHENTICATED                |
| GET         | /{id}/votes  | id: Long                                                                 | -            | VoteStats{upvotes, downvotes, userVote} | 200         | PUBLIC                       |

**AlertRequest Fields:**

- title (String, @NotBlank, max=100)
- description (String)
- alertTypeId (Integer, @NotNull)
- severity (Integer, @NotNull, min=1, max=5)
- latitude (Double, @NotNull, min=-90, max=90)
- longitude (Double, @NotNull, min=-180, max=180)

---

### ResourceController

**Base Path:** `/resources`  
**CORS:** `@CrossOrigin(origins = "*", maxAge = 3600)`

| HTTP Method | Path         | Query/Path Params                                         | Request Body    | Response               | Status      | Security                     |
| ----------- | ------------ | --------------------------------------------------------- | --------------- | ---------------------- | ----------- | ---------------------------- |
| POST        | /            | -                                                         | ResourceRequest | ResourceResponse       | 201 CREATED | AUTHENTICATED                |
| GET         | /{id}        | id: Long                                                  | -               | ResourceResponse       | 200         | PUBLIC                       |
| GET         | /            | page, size, (optional: status, lat, lng, radius, alertId) | -               | List<ResourceResponse> | 200         | PUBLIC                       |
| PATCH       | /{id}/status | id: Long, status: String (query)                          | -               | ResourceResponse       | 200         | AUTHENTICATED (creator only) |
| DELETE      | /{id}        | id: Long                                                  | -               | MessageResponse        | 200         | AUTHENTICATED (creator only) |

**ResourceRequest Fields:**

- title (String, @NotBlank, max=100)
- description (String)
- resourceTypeId (Integer, @NotNull)
- status (String, @NotBlank: AVAILABLE/REQUESTED/RESERVED/FULFILLED)
- alertId (Long, optional)
- latitude (Double, min=-90, max=90)
- longitude (Double, min=-180, max=180)
- contactInfo (String, max=255)

---

## DTOs

### LoginRequest

```java
@Data
public class LoginRequest {
    @NotBlank private String username;
    @NotBlank private String password;
}
```

### SignupRequest

```java
@Data
public class SignupRequest {
    @NotBlank @Size(min=3, max=20) private String username;
    @NotBlank @Size(max=50) @Email private String email;
    @NotBlank @Size(min=6, max=40) private String password;
    private String firstName;
    private String lastName;
}
```

### JwtResponse

```java
@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
}
```

### AlertRequest

```java
@Data
public class AlertRequest {
    @NotBlank @Size(max=100) private String title;
    private String description;
    @NotNull private Integer alertTypeId;
    @NotNull @Min(1) @Max(5) private Integer severity;
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") private Double latitude;
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") private Double longitude;
}
```

### AlertResponse

```java
@Data
public class AlertResponse {
    private Long id;
    private String title;
    private String description;
    private String alertType;
    private Integer severity;
    private Double latitude;
    private Double longitude;
    private String status;
    private Integer reliabilityScore;
    private Integer predictedSeverity;
    private String credibilityLabel;
    private Float credibilityConfidence;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlertResponse fromEntity(Alert alert) { ... }
}
```

### ResourceRequest

```java
@Data
public class ResourceRequest {
    @NotBlank @Size(max=100) private String title;
    private String description;
    @NotNull private Integer resourceTypeId;
    @NotBlank private String status; // AVAILABLE, REQUESTED, RESERVED, FULFILLED
    private Long alertId;
    @DecimalMin("-90.0") @DecimalMax("90.0") private Double latitude;
    @DecimalMin("-180.0") @DecimalMax("180.0") private Double longitude;
    @Size(max=255) private String contactInfo;
}
```

### ResourceResponse

```java
@Data
public class ResourceResponse {
    private Long id;
    private String title;
    private String description;
    private String resourceType;
    private String status;
    private Long userId;
    private String username;
    private Long alertId;
    private Double latitude;
    private Double longitude;
    private String contactInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ResourceResponse fromEntity(Resource resource) { ... }
}
```

### VoteRequest

```java
@Data
public class VoteRequest {
    @NotNull private Boolean isUpvote;
}
```

### MessageResponse

```java
@Data
public class MessageResponse {
    private String message;
}
```

---

## SECURITY

### Authentication Mechanism

- **Type:** JWT (JSON Web Tokens) Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Provider:** `JwtTokenProvider`

### JWT Configuration (from application.properties)

- **Secret Key (Base64):** `5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437`
- **Expiration:** 86400000 ms (24 hours)
- **Algorithm:** HS512

### JwtTokenProvider (com.disasteralert.security)

| Method                  | Signature                               | Returns | Description                               |
| ----------------------- | --------------------------------------- | ------- | ----------------------------------------- |
| generateJwtToken        | `generateJwtToken(Authentication)`      | String  | Creates JWT token from authenticated user |
| getUserNameFromJwtToken | `getUserNameFromJwtToken(String token)` | String  | Extracts username from token              |
| validateJwtToken        | `validateJwtToken(String token)`        | boolean | Validates token signature and expiration  |

### JwtAuthenticationFilter (com.disasteralert.security)

- Extends `OncePerRequestFilter`
- Extracts JWT from "Authorization" header with "Bearer " prefix
- Validates token via `JwtTokenProvider.validateJwtToken()`
- Loads user via `UserDetailsService.loadUserByUsername()`
- Sets SecurityContext authentication if valid

### JwtAuthenticationEntryPoint (com.disasteralert.security)

- Implements `AuthenticationEntryPoint`
- Returns 401 Unauthorized with JSON error response:
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "<auth exception message>",
    "path": "<request path>"
  }
  ```

### Security Rules (from WebSecurityConfig.java)

**Permitted Paths (No Auth Required):**

- `/auth/**` (login, register)
- `/v3/api-docs/**` (OpenAPI)
- `/swagger-ui/**` (Swagger UI)
- `/swagger-ui.html` (Swagger)

**Authenticated Paths:**

- All `/alerts/**` endpoints except GET (public)
- All `/resources/**` endpoints except GET (public)
- `/ml/reputation/users/{id}/event` (ADMIN only)
- `/ml/hotspots` (ADMIN only)

**Roles:**

- `ROLE_USER` - Default role for all users
- `ROLE_ADMIN` - Elevated role (earned via reputation system)

**CORS Configuration:**

- **Allowed Origins:** http://localhost:3000
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** authorization, content-type, x-auth-token
- **Exposed Headers:** x-auth-token
- **Allow Credentials:** true

---

## ML LAYER (DETAILED)

### ML Services Location

All ML services are in `com.disasteralert.ml.service.*`

### 1. NaiveBayesCredibilityService

**Algorithm:** Multinomial Naive Bayes with Feature Binning

**Purpose:** Classify alerts as CREDIBLE, SUSPICIOUS, or SPAM

**Input Features:**

- `description` (text) → tokenized to bag-of-words
- `postCountBin` (integer 0-2): User's alert count categorized as low(0), medium(1), high(2)
- `hourBin` (integer 0-3): Time of day (morning, afternoon, evening, night)

**Training Data (Hardcoded):**

CREDIBLE (15 samples):

- "Major fire downtown building casualties reported", "2", "2"
- "Flood waters rising rapidly on riverside road near bridge", "2", "1"
- "Building collapse people trapped need rescue immediately", "1", "2"
- "Gas pipeline explosion evacuate surrounding area now", "2", "2"
- ... (10 more)

SUSPICIOUS (15 samples):

- "Something strange near old factory not sure what", "0", "0"
- "Think there might be fire somewhere in north area", "0", "3"
- ... (13 more)

SPAM (15 samples):

- "Free food giveaway at community center come get it", "0", "1"
- "Visit website for best disaster preparedness products", "0", "2"
- "Testing testing this is just a test please ignore", "0", "1"
- ... (12 more)

**Key Methods:**

```java
@PostConstruct
public void train()
// Builds word frequency maps, vocabulary, class counts with Laplace smoothing (α=1.0)

public CredibilityResultDTO classify(Alert alert)
// Returns label (CREDIBLE/SUSPICIOUS/SPAM) and confidence (0-1)
```

**Vocabulary Size:** ~180+ unique words from training data
**Laplace Smoothing (α):** 1.0

---

### 2. DecisionTreeSeverityService

**Algorithm:** Decision Tree (hardcoded rules)

**Purpose:** Predict alert severity (1-5) based on content and location

**Input Features:**

- `alertTypeName` (String) → encoded to int (Fire=1, Flood=2, Medical=3, PowerOutage=4, Other=5)
- `description` (String) → keyword matching score
- `latitude`, `longitude` (Double) → urban detection + nearby alert count

**Decision Rules (in predictSeverity):**

```
if keywordScore >= 5:
    return 5
if keywordScore >= 3:
    return (type in [Fire, Medical]) ? 5 : 4
if keywordScore >= 2:
    if isUrban AND nearbyCount >= 3:
        return 4
    return (type in [Fire, Flood]) ? 3 : 3
if keywordScore == 1:
    return isUrban ? 3 : 2
if keywordScore == 0:
    return type == PowerOutage ? 2 : 1
```

**Keywords (15 total):** fire, trapped, urgent, help, critical, emergency, danger, flood, collapse, explosion, evacuate, rescue, casualt, injur, dead

**Urban Coordinates (8 Indian Cities):**

- Mumbai: {19.07, 72.87}
- Delhi: {28.67, 77.21}
- Bangalore: {12.97, 77.59}
- Chennai: {13.08, 80.27}
- Kolkata: {22.57, 88.36}
- Hyderabad: {17.38, 78.47}
- Pune: {23.02, 72.57}
- Ahmedabad: {23.02, 72.57}

**Urban Detection:** Alert within ±1.0° of any city center

**Nearby Alert Count:** SQL geospatial query for alerts within 5km radius

---

### 3. DecisionTreeEscalationService

**Algorithm:** Decision Tree (escalation rules)

**Purpose:** Determine if alert should be auto-escalated

**Escalation Logic:**

```
shouldEscalate returns true if ANY of:
- predictedSeverity >= 4
- keywordScore >= 3
- nearbyCount >= 5
- (type == Fire AND keywordScore >= 2)
```

---

### 4. KMeansClusteringService

**Algorithm:** K-Means with k=min(5, activeAlertCount)

**Purpose:** Group nearby active alerts into geographic hotspots

**Initialization Method:** K random alert locations as initial centroids

**Convergence Criterion:** Max centroid movement < 0.0001 degrees OR 100 iterations

**Update Frequency:**

- `@PostConstruct` - runs on startup
- `@Scheduled(fixedRate = 600000)` - runs every 10 minutes

**Output (ClusterResultDTO):**

- `clusterId` (int)
- `centroidLat`, `centroidLng` (Double)
- `alertCount` (int)
- `dominantAlertType` (String) - most frequent type in cluster
- `alertIds` (List<Long>)

**API Endpoint:** `GET /ml/hotspots` (ADMIN only)

---

### 5. KNNAlertService (K=5)

**Algorithm:** K-Nearest Neighbors with Euclidean distance

**Purpose:** Find 5 most similar alerts to a query point

**Features (normalized 0-1 range):**

1. Latitude
2. Longitude
3. Severity
4. Alert Type (encoded as int)

**Distance Formula:**

```
dist = sqrt(
    (normLat1 - normLat2)² +
    (normLng1 - normLng2)² +
    (normSev1 - normSev2)² +
    (normType1 - normType2)²
)
```

**Normalization:** `(value - min) / (max - min)` across all training data

**API Endpoint:** `GET /ml/knn/similar-alerts?lat=...&lng=...&type=...&severity=...`

**Output:** List<SimilarAlertDTO> sorted by distance (ascending)

---

### 6. KNNResourceMatcherService (K=3)

**Algorithm:** K-Nearest Neighbors with Haversine distance

**Purpose:** Find 3 nearest AVAILABLE resources

**Distance Formula (Haversine):**

```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
distance = 2 ⋅ R ⋅ asin(√a)
// R = 6371 km (Earth radius)
```

**Filters:**

- Status == AVAILABLE
- latitude != null AND longitude != null

**API Endpoint:** `GET /ml/knn/nearest-resources?lat=...&lng=...`

**Output:** List<NearestResourceDTO> with distanceKm

---

### 7. ReputationService

**Purpose:** Manage user reputation scoring and automatic role upgrades

**Reputation Event Types** (from ReputationEventType enum):

| Event Type             | Points | Trigger                  |
| ---------------------- | ------ | ------------------------ |
| ALERT_CONFIRMED        | +10    | Alert reaches 10 upvotes |
| RESOURCE_HELPFUL       | +15    | (Manual trigger)         |
| COMMENT_HELPFUL        | +5     | (Manual trigger)         |
| ACCOUNT_VERIFIED       | +20    | (Manual trigger)         |
| ALERT_FLAGGED_SPAM     | -20    | (Manual trigger)         |
| ABUSE_REPORT_CONFIRMED | -30    | (Manual trigger)         |
| DUPLICATE_ALERT        | -10    | (Manual trigger)         |
| LOW_RELIABILITY        | -5     | Alert reliability ≤ -5   |

**Key Methods:**

```java
@Transactional
public void applyEvent(Long userId, ReputationEventType eventType, Long alertId)
// 1. Creates ReputationEvent record
// 2. Updates user.reputationScore (clamped to 0 minimum)
// 3. Auto-upgrade: if score >= 100 AND user.alertCount >= 5 AND not already ADMIN
//    → adds ROLE_ADMIN to user.roles
// 4. Saves user

@Transactional(readOnly = true)
public ReputationSummaryDTO getReputation(Long userId)
// Returns user reputation score + all events sorted by date DESC
```

**API Endpoints:**

- `GET /ml/reputation/users/{id}` - Get user reputation
- `POST /ml/reputation/users/{id}/event` - Apply event (ADMIN only)

---

### ML Controllers

#### CredibilityController

```java
@GetMapping("/{id}/credibility")
public ResponseEntity<CredibilityResultDTO> getCredibility(@PathVariable Long id)
// Returns alert's credibilityLabel and credibilityConfidence
```

#### SeverityController

```java
@GetMapping("/predict-severity")
public ResponseEntity<SeverityPredictionDTO> predictSeverity(
    @RequestParam String type,
    @RequestParam String description,
    @RequestParam double lat,
    @RequestParam double lng)
// Returns predictedSeverity, shouldEscalate, keywordScore, nearbyCount
```

#### HotspotController

```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getHotspots()
// Returns cached K-Means clusters
```

#### KNNController

```java
@GetMapping("/similar-alerts")
public ResponseEntity<?> getSimilarAlerts(
    @RequestParam double lat,
    @RequestParam double lng,
    @RequestParam String type,
    @RequestParam int severity)

@GetMapping("/nearest-resources")
public ResponseEntity<?> getNearestResources(
    @RequestParam double lat,
    @RequestParam double lng)
```

#### ReputationController

```java
@GetMapping("/users/{id}")
public ResponseEntity<?> getReputation(@PathVariable Long id)

@PostMapping("/users/{id}/event")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> applyEvent(
    @PathVariable Long id,
    @RequestBody ReputationEventRequest request)
```

---

## EXCEPTION HANDLING

### GlobalExceptionHandler (@RestControllerAdvice)

| Exception Type                  | HTTP Status | Handler Method                  | Response                           |
| ------------------------------- | ----------- | ------------------------------- | ---------------------------------- |
| ResourceNotFoundException       | 404         | handleResourceNotFoundException | ErrorResponse                      |
| UnauthorizedException           | 403         | handleUnauthorizedException     | ErrorResponse                      |
| UsernameNotFoundException       | 404         | handleUsernameNotFoundException | ErrorResponse                      |
| BadCredentialsException         | 401         | handleBadCredentialsException   | ErrorResponse                      |
| MethodArgumentNotValidException | 400         | handleValidationExceptions      | Map<String, String> (field errors) |
| RuntimeException                | 500         | handleRuntimeException          | ErrorResponse                      |
| Exception (generic)             | 500         | handleGenericException          | ErrorResponse                      |

### ErrorResponse Structure

```java
public static class ErrorResponse {
    private int status;
    private String message;
    private LocalDateTime timestamp;
}
```

### Custom Exception Classes

```java
public class ResourceNotFoundException extends RuntimeException { }
public class UnauthorizedException extends RuntimeException { }
```

---

## DATABASE

### Database Name

`disaster_alert`

### Connection String

```
jdbc:mysql://localhost:3306/disaster_alert?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

### Credentials

- **User:** root
- **Password:** yuvi

### Tables (Auto-created by Hibernate)

| Table Name       | Purpose                                 |
| ---------------- | --------------------------------------- |
| users            | User accounts                           |
| alerts           | Disaster alerts                         |
| alert_types      | Alert category types                    |
| resources        | Available resources                     |
| resource_types   | Resource category types                 |
| votes            | User votes on alerts                    |
| user_roles       | User → Role mapping (ElementCollection) |
| reputation_event | ML reputation tracking                  |

### Default Data (Initialized by DataInitializer)

**Users:**

1. Username: `admin` | Password: `admin123` | Email: `admin@disaster.com` | Name: Admin User
2. Username: `testuser` | Password: `test123` | Email: `test@disaster.com` | Name: Test User

**Alert Types (5):**

1. Fire - 🔥
2. Flood - 🌊
3. Medical Emergency - 🚑
4. Power Outage - ⚡
5. Other - ⚠️

**Resource Types (6):**

1. Food & Water - 🍽️
2. Shelter - 🏠
3. Medical Supplies - 💊
4. Transportation - 🚗
5. Volunteer Work - 👥
6. Other - 📦

### Hibernate Configuration

- **DDL:** `spring.jpa.hibernate.ddl-auto=update` (auto-updates schema)
- **SQL Logging:** `spring.jpa.show-sql=true`
- **Dialect:** MySQL8Dialect

---

## FRONTEND SETUP

### Framework & Version

- **Framework:** React 18.2.0
- **Build Tool:** Create React App (react-scripts 5.0.1)
- **Package Manager:** npm

### Base URL for API

```javascript
const API_BASE_URL = "http://localhost:8081/api";
```

### Key Dependencies

| Package               | Version              | Purpose              |
| --------------------- | -------------------- | -------------------- |
| react                 | 18.2.0               | Core React framework |
| react-dom             | 18.2.0               | DOM rendering        |
| react-router-dom      | 6.20.0               | Routing              |
| axios                 | 1.6.2                | HTTP client          |
| react-leaflet         | 4.2.1                | Map component        |
| leaflet               | 1.9.4                | Mapping library      |
| react-leaflet-cluster | 3.1.1                | Clustering for maps  |
| recharts              | 3.3.0                | Charts/analytics     |
| framer-motion         | 12.23.24             | Animations           |
| lucide-react          | 0.294.0              | Icon library         |
| react-hot-toast       | 2.6.0                | Toast notifications  |
| date-fns              | 4.1.0                | Date utilities       |
| Tailwind CSS          | (via postcss config) | Styling              |

### Build Commands

```bash
npm start          # Start development server (port 3000)
npm build          # Production build
npm test           # Run tests
npm eject          # Eject from CRA (⚠️ irreversible)
```

### Styles & Configuration

- **CSS:** Tailwind CSS (postcss-config.js)
- **PostCSS Config:** tailwind.config.js
- **Global CSS:** src/index.css
- **Component CSS:** Inline Tailwind classes

---

## FRONTEND COMPONENTS

### App.js (Main Router)

**Routes:**

- `/login` → Login component (public, redirects to dashboard if authenticated)
- `/register` → Register component (public, redirects to dashboard if authenticated)
- `/dashboard` → Dashboard component (protected)
- `/` → Redirects to `/dashboard`

**Protected Route Component:**

- Redirects unauthenticated users to `/login`
- Shows loading spinner while checking auth

**Public Route Component:**

- Redirects authenticated users to `/dashboard`
- Shows loading spinner while checking auth

---

### Dashboard.js

**Purpose:** Main application interface with map, alerts, resources, chatbot

**Key Features:**

- **Map Display:** MapContainer with TileLayer, custom markers (red for alerts, green for resources)
- **Geolocation:** Auto-detects user location on mount
- **Tabs:** alerts | resources
- **Modals:** CreateAlertModal, CreateResourceModal
- **Chatbot:** AIChatbot component
- **Filters:** Search, severity filter, status filter
- **Stats Panel:** Display analytics
- **Dark Mode Toggle:** Theme switching
- **Logout Button**

**State Variables:**

- `alerts`, `filteredAlerts` - Alert list and filtered subset
- `resources`, `filteredResources` - Resource list and filtered subset
- `loading`, `locationLoading` - Loading states
- `activeTab` - Current tab (alerts/resources)
- `mapCenter` - Map center coordinates [lat, lng]
- `userLocation` - User's geolocation
- `searchQuery` - Search input
- `severityFilter` - Filter severity value
- `showFilters`, `showStats` - UI toggles

**API Calls:**

- `alertAPI.getAll()` - Fetch all alerts
- `resourceAPI.getAll()` - Fetch all resources
- `alertAPI.create()` - Create alert
- `resourceAPI.create()` - Create resource
- `alertAPI.delete()`, `resourceAPI.delete()` - Delete items

---

### AlertCard.js

**Props:**

- `alert` (Alert object)
- `onDelete` (callback)
- `onVote` (callback)

**Displays:**

- Alert title, type, severity (1-5 stars)
- Description
- Location (lat/lng)
- Reliability score with upvote/downvote counts
- Credibility label & confidence (if ML processed)
- Created by username
- Timestamps

**Actions:**

- Upvote/Downvote
- Delete (if creator)
- View details

---

### CreateAlertModal.js

**Props:**

- `isOpen` (boolean)
- `onClose` (callback)
- `onSubmit` (callback with AlertRequest data)

**Form Fields:**

- Title (required, max 100 chars)
- Description (optional)
- Alert Type dropdown (fetches from alertTypes)
- Severity slider (1-5)
- Latitude/Longitude inputs (or use current location)

---

### CreateResourceModal.js

**Props:**

- `isOpen` (boolean)
- `onClose` (callback)
- `onSubmit` (callback with ResourceRequest data)

**Form Fields:**

- Title (required, max 100 chars)
- Description (optional)
- Resource Type dropdown
- Status dropdown (AVAILABLE/REQUESTED/RESERVED/FULFILLED)
- Latitude/Longitude (optional)
- Contact Info (optional)
- Link to Alert (optional)

---

### AIChatbot.js

**Purpose:** Interactive chatbot for user queries and guidance

**Features:**

- Chat message history
- Input field for user queries
- ML model responses (simulated or connected to backend)

---

## FRONTEND ROUTING

### Route Structure

```
App (Router)
├── /login
│   ├── PublicRoute
│   └── Login (public, redirects if authenticated)
├── /register
│   ├── PublicRoute
│   └── Register (public, redirects if authenticated)
├── /dashboard
│   ├── ProtectedRoute
│   └── Dashboard (protected)
└── / → /dashboard (redirect)
```

### Authentication Flow

1. **Login:** POST `/auth/login` with credentials
   - Returns JWT token + user data
   - Stored in localStorage
   - Redirects to `/dashboard`

2. **Registration:** POST `/auth/register` with signup data
   - Creates new user
   - Redirects to `/login`

3. **Protected Routes:** Checks localStorage token
   - If token exists → render component
   - If no token → redirect to `/login`

4. **Logout:** Clears localStorage, redirects to `/login`

---

## STATE MANAGEMENT

### AuthContext (Context API)

**Provider:** `AuthProvider`

**State:**

- `user` (Object) - Current logged-in user (null if not authenticated)
- `loading` (boolean) - Loading state for auth check

**Methods:**

- `login(credentials)` - Authenticates user, stores token
- `register(userData)` - Registers new user
- `logout()` - Clears authentication, logs out user
- `isAuthenticated` (computed) - Boolean flag

**Hook:** `useAuth()` - Access auth context

---

### ThemeContext (Context API)

**Provider:** `ThemeProvider`

**State:**

- `darkMode` (boolean) - Dark mode toggle (persisted in localStorage)

**Methods:**

- `toggleTheme()` - Switch between light/dark mode

**Hook:** `useTheme()` - Access theme context

---

### API Interceptors (axios)

**Request Interceptor:**

- Adds JWT token from localStorage to Authorization header
- Format: `Authorization: Bearer <token>`

**Response Interceptor:**

- Catches 401 errors (unauthorized)
- Clears localStorage
- Redirects to `/login`

---

### API Service Exports (api.js)

```javascript
// Auth API
authAPI.login(credentials);
authAPI.register(userData);

// Alert API
alertAPI.getAll(params);
alertAPI.getById(id);
alertAPI.create(alertData);
alertAPI.updateStatus(id, status);
alertAPI.delete(id);
alertAPI.vote(id, isUpvote);
alertAPI.getVotes(id);

// Resource API
resourceAPI.getAll(params);
resourceAPI.getById(id);
resourceAPI.create(resourceData);
resourceAPI.updateStatus(id, status);
resourceAPI.delete(id);
```

---

## NOT YET DONE

### ML Endpoints NOT Connected to Frontend

1. **Hotspot Clustering** (`GET /ml/hotspots`)
   - K-Means clusters available at backend
   - **Not integrated:** Dashboard doesn't display hotspot layer on map
   - **To-do:** Add hotspot visualization endpoint, admin-only view

2. **Similar Alerts** (`GET /ml/knn/similar-alerts`)
   - KNN service available at backend
   - **Not integrated:** Creating an alert doesn't show similar alerts suggestion
   - **To-do:** Add "similar alerts" panel in CreateAlertModal

3. **Nearest Resources** (`GET /ml/knn/nearest-resources`)
   - KNN resource matcher available
   - **Not integrated:** When viewing alert, no nearby resources recommendation
   - **To-do:** Add resources sidebar in alert details view

4. **Credibility Display** (GET `/ml/alerts/{id}/credibility`)
   - Credibility computed and stored on alert creation
   - **Not integrated:** AlertCard doesn't prominently display credibility warnings
   - **To-do:** Add warning badge if credibilityLabel === "SPAM"

5. **Severity Prediction** (`GET /ml/alerts/predict-severity`)
   - Severity predicted on alert creation
   - **Not integrated:** Frontend doesn't preview severity before submission
   - **To-do:** Add "predicted severity" preview in CreateAlertModal

6. **Reputation System** (`GET /ml/reputation/users/{id}`)
   - Backend tracks reputation events
   - **Not integrated:** Frontend doesn't display user reputation score or history
   - **To-do:** Add user profile page with reputation display

7. **Reputation Events** (`POST /ml/reputation/users/{id}/event`)
   - Admin can manually apply events
   - **Not integrated:** No admin panel UI for manual reputation adjustments
   - **To-do:** Create admin panel for reputation management

---

### Features Backend-Only (Not Frontend)

1. **Admin Hotspot View** - Only admin can access `/ml/hotspots`
2. **Manual Reputation Events** - Admin panel for triggering reputation events
3. **Alert Status Updates** - PATCH `/alerts/{id}/status` (backend accepts ACTIVE/RESOLVED/FALSE_ALARM)
4. **Resource Status Workflow** - Full AVAILABLE→REQUESTED→RESERVED→FULFILLED lifecycle
5. **Geospatial Queries** - Bounding box and radius searches available but not fully exposed

---

### Known Issues/Console Errors

1. **Leaflet Default Marker Icons** - Requires manual icon configuration (handled in Dashboard.js)
2. **Map Geolocation Permission** - Requires user browser permission; fails silently
3. **CORS Configuration** - Hardcoded to http://localhost:3000; may fail in production
4. **Database Connection** - Requires MySQL running at localhost:3306 with user 'root'
5. **JWT Secret** - Exposed in application.properties; should use environment variables in production

---

### Frontend Bugs/Limitations

1. **Search/Filter Not Fully Implemented** - searchQuery and severityFilter state exist but not fully wired
2. **AIChatbot** - Component exists but may be placeholder/skeleton
3. **Mobile Responsiveness** - Tailwind classes present but not fully tested on mobile
4. **Error Handling** - Limited error feedback in modals; mostly relies on toast notifications
5. **Loading States** - No distinct loading skeleton for list items

---

### Testing

**Backend:**

- No test files found in codebase
- **To-do:** Write unit tests for services, integration tests for controllers

**Frontend:**

- Test files not included
- **To-do:** Write component tests, API integration tests

---

## APPENDIX: QUICK REFERENCE

### Default Test Users

| Username | Password | Email              | Role                          |
| -------- | -------- | ------------------ | ----------------------------- |
| admin    | admin123 | admin@disaster.com | ROLE_USER (can be ROLE_ADMIN) |
| testuser | test123  | test@disaster.com  | ROLE_USER                     |

### Main API Base Paths

| Feature        | Base Path                               |
| -------------- | --------------------------------------- |
| Authentication | `/auth`                                 |
| Alerts         | `/alerts`                               |
| Resources      | `/resources`                            |
| Alert Types    | (no direct endpoint, loaded via select) |
| Resource Types | (no direct endpoint, loaded via select) |
| ML Hotspots    | `/ml/hotspots`                          |
| ML KNN         | `/ml/knn`                               |
| ML Credibility | `/ml/alerts/{id}/credibility`           |
| ML Severity    | `/ml/alerts/predict-severity`           |
| ML Reputation  | `/ml/reputation`                        |
| API Docs       | `/v3/api-docs`                          |
| Swagger UI     | `/swagger-ui.html`                      |

### Important Files to Modify for Future Development

1. **ML Integration in Frontend:** Add ML endpoints to `frontend/src/services/api.js`
2. **Hotspot Visualization:** Modify `frontend/src/pages/Dashboard.js` map rendering
3. **ML Config Tweaking:** `DecisionTreeSeverityService.java` for rules, `NaiveBayesCredibilityService.java` for training data
4. **Database Migrations:** Add entities to `backend/src/main/java/com/disasteralert/entity/`
5. **New API Endpoints:** Create new controllers in `backend/src/main/java/com/disasteralert/controller/`

---

**END OF HANDOFF DOCUMENTATION**

---

_Last Updated: April 19, 2026_  
_Prepared for: Next Developer_  
_Confidence Level: Production-Ready Backend, Partial Frontend Implementation_
