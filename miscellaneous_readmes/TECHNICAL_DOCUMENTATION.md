# Disaster Alert Platform - Technical Documentation

## 1. PROJECT BASICS

### Base Package Name

`com.disasteralert`

### Java & Spring Boot Versions

- **Java Version:** 17
- **Spring Boot Version:** 3.1.5
- **Build Tool:** Maven

### Maven Dependencies

| Dependency                  | Group ID                     | Artifact ID                         | Version          | Scope    |
| --------------------------- | ---------------------------- | ----------------------------------- | ---------------- | -------- |
| Spring Boot Web             | org.springframework.boot     | spring-boot-starter-web             | (parent)         | compile  |
| Spring Boot Data JPA        | org.springframework.boot     | spring-boot-starter-data-jpa        | (parent)         | compile  |
| Spring Boot Security        | org.springframework.boot     | spring-boot-starter-security        | (parent)         | compile  |
| Spring Boot Validation      | org.springframework.boot     | spring-boot-starter-validation      | (parent)         | compile  |
| MySQL Connector             | com.mysql                    | mysql-connector-j                   | 8.2.0            | runtime  |
| JJWT API                    | io.jsonwebtoken              | jjwt-api                            | 0.11.5           | compile  |
| JJWT Impl                   | io.jsonwebtoken              | jjwt-impl                           | 0.11.5           | runtime  |
| JJWT Jackson                | io.jsonwebtoken              | jjwt-jackson                        | 0.11.5           | runtime  |
| Lombok                      | org.projectlombok            | lombok                              | (parent version) | optional |
| Spring Boot Test            | org.springframework.boot     | spring-boot-starter-test            | (parent)         | test     |
| Spring Security Test        | org.springframework.security | spring-security-test                | (parent)         | test     |
| SpringDoc OpenAPI WebMVC UI | org.springdoc                | springdoc-openapi-starter-webmvc-ui | 2.2.0            | compile  |

### Lombok Annotations Used

- `@Data` - Used on all entity and DTO classes (generates getters, setters, toString, equals, hashCode)

---

## 2. DATABASE & ENTITIES

### Alert Entity

**Class Name:** `Alert`  
**Table Name:** `alerts`

| Field Name       | Java Type          | Column Name       | Constraints                   | JPA Annotations                                                                          |
| ---------------- | ------------------ | ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| id               | Long               | id                | PRIMARY KEY, AUTO_INCREMENT   | @Id @GeneratedValue(strategy = GenerationType.IDENTITY)                                  |
| title            | String             | title             | NOT NULL, max 100 chars       | @NotBlank @Size(max = 100)                                                               |
| description      | String             | description       | nullable, unlimited           | @Lob                                                                                     |
| alertType        | AlertType          | alert_type_id     | NOT NULL, FK                  | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "alert_type_id", nullable = false) |
| severity         | Integer            | severity          | 1-5 range                     | @Min(1) @Max(5)                                                                          |
| latitude         | Double             | latitude          | NOT NULL                      | @NotNull                                                                                 |
| longitude        | Double             | longitude         | NOT NULL                      | @NotNull                                                                                 |
| user             | User               | user_id           | NOT NULL, FK                  | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)       |
| status           | Enum (AlertStatus) | status            | DEFAULT 'ACTIVE', 20 char max | @Enumerated(EnumType.STRING) @Column(length = 20)                                        |
| reliabilityScore | Integer            | reliability_score | DEFAULT 0, nullable           | DEFAULT 0 (in Java)                                                                      |
| createdAt        | LocalDateTime      | created_at        | NOT NULL, updatable=false     | @CreationTimestamp @Column(name = "created_at", updatable = false)                       |
| updatedAt        | LocalDateTime      | updated_at        | nullable, auto-update         | @UpdateTimestamp @Column(name = "updated_at")                                            |

**Relationships:**

- **ManyToOne:** alert → alertType (LAZY fetch)
- **ManyToOne:** alert → user (LAZY fetch, cascade on delete from user)
- **OneToMany:** alert ← votes (implicit, cascade delete)
- **OneToMany:** alert ← resources (implicit, cascade delete)

**Nested Enum:** `AlertStatus` (ACTIVE, RESOLVED, FALSE_ALARM)

**Indexes:** SPATIAL INDEX on (latitude, longitude)

---

### User Entity

**Class Name:** `User`  
**Table Name:** `users`  
**Implements:** `UserDetails` (Spring Security)

| Field Name | Java Type     | Column Name                | Constraints                 | JPA Annotations                                                          |
| ---------- | ------------- | -------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| id         | Long          | id                         | PRIMARY KEY, AUTO_INCREMENT | @Id @GeneratedValue(strategy = GenerationType.IDENTITY)                  |
| username   | String        | username                   | NOT NULL, UNIQUE, max 20    | @NotBlank @Size(max = 20)                                                |
| email      | String        | email                      | NOT NULL, UNIQUE, max 50    | @NotBlank @Size(max = 50) @Email                                         |
| password   | String        | password                   | NOT NULL, max 120           | @NotBlank @Size(max = 120)                                               |
| firstName  | String        | first_name                 | nullable, max 50            | @Size(max = 50)                                                          |
| lastName   | String        | last_name                  | nullable, max 50            | @Size(max = 50)                                                          |
| roles      | Set<Role>     | (element collection table) | EAGER load                  | @ElementCollection(fetch = FetchType.EAGER) @Enumerated(EnumType.STRING) |
| enabled    | boolean       | enabled                    | DEFAULT true                | boolean (default true in code)                                           |
| createdAt  | LocalDateTime | created_at                 | NOT NULL, updatable=false   | @CreationTimestamp @Column(updatable = false)                            |
| updatedAt  | LocalDateTime | updated_at                 | nullable, auto-update       | @UpdateTimestamp                                                         |

**Unique Constraints:**

- username (UNIQUE)
- email (UNIQUE)

**Methods Implemented from UserDetails:**

- `getAuthorities()` - Returns roles as GrantedAuthority list
- `isAccountNonExpired()` - Returns true
- `isAccountNonLocked()` - Returns true
- `isCredentialsNonExpired()` - Returns true
- `isEnabled()` - Returns enabled field value

**Relationships:**

- **OneToMany:** user ← alerts (implicit, cascade delete)
- **OneToMany:** user ← resources (implicit, cascade delete)
- **OneToMany:** user ← votes (implicit, cascade delete)

---

### Resource Entity

**Class Name:** `Resource`  
**Table Name:** `resources`

| Field Name   | Java Type             | Column Name      | Constraints                 | JPA Annotations                                                                               |
| ------------ | --------------------- | ---------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| id           | Long                  | id               | PRIMARY KEY, AUTO_INCREMENT | @Id @GeneratedValue(strategy = GenerationType.IDENTITY)                                       |
| title        | String                | title            | NOT NULL, max 100 chars     | @NotBlank @Size(max = 100)                                                                    |
| description  | String                | description      | nullable, unlimited         | @Lob                                                                                          |
| resourceType | ResourceType          | resource_type_id | NOT NULL, FK                | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "resource_type_id", nullable = false)   |
| status       | Enum (ResourceStatus) | resource_status  | NOT NULL, 20 char max       | @Enumerated(EnumType.STRING) @Column(name = "resource_status", length = 20, nullable = false) |
| user         | User                  | user_id          | NOT NULL, FK                | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)            |
| alert        | Alert                 | alert_id         | nullable, FK                | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "alert_id")                             |
| latitude     | Double                | latitude         | nullable                    | null by default                                                                               |
| longitude    | Double                | longitude        | nullable                    | null by default                                                                               |
| contactInfo  | String                | contact_info     | nullable, max 255           | @Size(max = 255) @Column(name = "contact_info")                                               |
| createdAt    | LocalDateTime         | created_at       | NOT NULL, updatable=false   | @CreationTimestamp @Column(name = "created_at", updatable = false)                            |
| updatedAt    | LocalDateTime         | updated_at       | nullable, auto-update       | @UpdateTimestamp @Column(name = "updated_at")                                                 |

**Relationships:**

- **ManyToOne:** resource → resourceType (LAZY fetch)
- **ManyToOne:** resource → user (LAZY fetch, cascade on delete)
- **ManyToOne:** resource → alert (LAZY fetch, SET NULL on delete)

**Nested Enum:** `ResourceStatus` (AVAILABLE, REQUESTED, RESERVED, FULFILLED)

---

### Vote Entity

**Class Name:** `Vote`  
**Table Name:** `votes`

| Field Name | Java Type     | Column Name | Constraints                 | JPA Annotations                                                                     |
| ---------- | ------------- | ----------- | --------------------------- | ----------------------------------------------------------------------------------- |
| id         | Long          | id          | PRIMARY KEY, AUTO_INCREMENT | @Id @GeneratedValue(strategy = GenerationType.IDENTITY)                             |
| alert      | Alert         | alert_id    | NOT NULL, FK                | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "alert_id", nullable = false) |
| user       | User          | user_id     | NOT NULL, FK                | @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)  |
| isUpvote   | Boolean       | is_upvote   | NOT NULL                    | @Column(name = "is_upvote", nullable = false)                                       |
| createdAt  | LocalDateTime | created_at  | NOT NULL, updatable=false   | @CreationTimestamp @Column(name = "created_at", updatable = false)                  |

**Unique Constraint:** UNIQUE(alert_id, user_id) - One vote per user per alert

**Relationships:**

- **ManyToOne:** vote → alert (LAZY fetch, cascade delete)
- **ManyToOne:** vote → user (LAZY fetch, cascade delete)

---

### AlertType Entity

**Class Name:** `AlertType`  
**Table Name:** `alert_types`

| Field Name  | Java Type | Column Name | Constraints                 | JPA Annotations                                         |
| ----------- | --------- | ----------- | --------------------------- | ------------------------------------------------------- |
| id          | Integer   | id          | PRIMARY KEY, AUTO_INCREMENT | @Id @GeneratedValue(strategy = GenerationType.IDENTITY) |
| name        | String    | name        | NOT NULL, UNIQUE, max 50    | @NotBlank @Size(max = 50) @Column(unique = true)        |
| description | String    | description | nullable, max 255           | @Size(max = 255)                                        |
| icon        | String    | icon        | nullable, max 50            | @Size(max = 50)                                         |

**Relationships:**

- **OneToMany:** alertType ← alerts (implicit, cascade delete)

---

### ResourceType Entity

**Class Name:** `ResourceType`  
**Table Name:** `resource_types`

| Field Name  | Java Type | Column Name | Constraints                 | JPA Annotations                                         |
| ----------- | --------- | ----------- | --------------------------- | ------------------------------------------------------- |
| id          | Integer   | id          | PRIMARY KEY, AUTO_INCREMENT | @Id @GeneratedValue(strategy = GenerationType.IDENTITY) |
| name        | String    | name        | NOT NULL, UNIQUE, max 50    | @NotBlank @Size(max = 50) @Column(unique = true)        |
| description | String    | description | nullable, max 255           | @Size(max = 255)                                        |
| icon        | String    | icon        | nullable, max 50            | @Size(max = 50)                                         |

**Relationships:**

- **OneToMany:** resourceType ← resources (implicit, cascade delete)

---

## 3. REPOSITORIES

### AlertRepository

**Extends:** `JpaRepository<Alert, Long>`

| Method Name           | Parameters                                                                    | Return Type | Custom Query                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| findByStatus          | Alert.AlertStatus status, Pageable pageable                                   | Page<Alert> | None (derived query)                                                                                                                                                                             |
| findWithinBoundingBox | double minLat, double maxLat, double minLng, double maxLng, Pageable pageable | List<Alert> | `@Query("SELECT a FROM Alert a WHERE (a.latitude BETWEEN :minLat AND :maxLat) AND (a.longitude BETWEEN :minLng AND :maxLng) ORDER BY a.createdAt DESC")`                                         |
| findNearbyAlerts      | double lat, double lng, double radius, Pageable pageable                      | List<Alert> | `@Query(nativeQuery=true, "SELECT a.* FROM alerts a WHERE ST_Distance_Sphere(point(a.longitude, a.latitude), point(:lng, :lat)) <= :radius AND a.status = 'ACTIVE' ORDER BY a.created_at DESC")` |
| countByUser_Id        | Long userId                                                                   | Long        | None (derived query)                                                                                                                                                                             |

---

### UserRepository

**Extends:** `JpaRepository<User, Long>`

| Method Name      | Parameters      | Return Type    | Custom Query         |
| ---------------- | --------------- | -------------- | -------------------- |
| findByUsername   | String username | Optional<User> | None (derived query) |
| existsByUsername | String username | Boolean        | None (derived query) |
| existsByEmail    | String email    | Boolean        | None (derived query) |

---

### ResourceRepository

**Extends:** `JpaRepository<Resource, Long>`

| Method Name                    | Parameters                                                                    | Return Type    | Custom Query                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| findByStatus                   | Resource.ResourceStatus status, Pageable pageable                             | Page<Resource> | None (derived query)                                                                                                                                                                                   |
| findByUser                     | User user, Pageable pageable                                                  | Page<Resource> | None (derived query)                                                                                                                                                                                   |
| findByAlert                    | Alert alert, Pageable pageable                                                | Page<Resource> | None (derived query)                                                                                                                                                                                   |
| findAvailableWithinBoundingBox | double minLat, double maxLat, double minLng, double maxLng, Pageable pageable | List<Resource> | `@Query("SELECT r FROM Resource r WHERE (r.latitude BETWEEN :minLat AND :maxLat) AND (r.longitude BETWEEN :minLng AND :maxLng) AND r.status = 'AVAILABLE' ORDER BY r.createdAt DESC")`                 |
| findNearbyAvailableResources   | double latitude, double longitude, double radius, Pageable pageable           | List<Resource> | `@Query(nativeQuery=true, "SELECT r.* FROM resources r WHERE ST_Distance_Sphere(point(r.longitude, r.latitude), point(:lng, :lat)) <= :radius AND r.status = 'AVAILABLE' ORDER BY r.created_at DESC")` |
| findByResourceTypeAndAvailable | Integer typeId, Pageable pageable                                             | Page<Resource> | `@Query("SELECT r FROM Resource r WHERE r.resourceType.id = :typeId AND r.status = 'AVAILABLE' ORDER BY r.createdAt DESC")`                                                                            |
| countByUser_Id                 | Long userId                                                                   | Long           | None (derived query)                                                                                                                                                                                   |
| countByAlert_Id                | Long alertId                                                                  | Long           | None (derived query)                                                                                                                                                                                   |

---

### VoteRepository

**Extends:** `JpaRepository<Vote, Long>`

| Method Name              | Parameters                | Return Type    | Custom Query                                                                                    |
| ------------------------ | ------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| findByAlertAndUser       | Alert alert, User user    | Optional<Vote> | None (derived query)                                                                            |
| existsByAlertIdAndUserId | Long alertId, Long userId | boolean        | `@Query("SELECT COUNT(v) > 0 FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")` |
| deleteByAlertIdAndUserId | Long alertId, Long userId | void           | `@Modifying @Query("DELETE FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")`   |
| countUpvotesByAlertId    | Long alertId              | long           | `@Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = true")`       |
| countDownvotesByAlertId  | Long alertId              | long           | `@Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = false")`      |

---

### AlertTypeRepository

**Extends:** `JpaRepository<AlertType, Integer>`

| Method Name | Parameters  | Return Type         | Custom Query         |
| ----------- | ----------- | ------------------- | -------------------- |
| findByName  | String name | Optional<AlertType> | None (derived query) |

---

### ResourceTypeRepository

**Extends:** `JpaRepository<ResourceType, Integer>`

| Method Name | Parameters  | Return Type            | Custom Query         |
| ----------- | ----------- | ---------------------- | -------------------- |
| findByName  | String name | Optional<ResourceType> | None (derived query) |

---

## 4. SERVICE LAYER

### AlertService

**Class Name:** `AlertService`

| Method Signature                                                                                                            | What It Does                                                                                                           | Dependencies Called                                                               |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `AlertResponse createAlert(AlertRequest request, String username)`                                                          | Creates new alert from request, associates with authenticated user and alert type. Initializes reliability score to 0. | alertTypeRepository.findById, userRepository.findByUsername, alertRepository.save |
| `AlertResponse getAlertById(Long id)`                                                                                       | Retrieves alert by ID, throws RuntimeException if not found.                                                           | alertRepository.findById                                                          |
| `List<AlertResponse> getAllAlerts(int page, int size)`                                                                      | Fetches all alerts paginated, sorted by createdAt descending.                                                          | alertRepository.findAll                                                           |
| `List<AlertResponse> getAlertsNearby(double lat, double lng, double radius, int page, int size)`                            | Gets alerts within radius (meters) of given coordinates.                                                               | alertRepository.findNearbyAlerts                                                  |
| `List<AlertResponse> getAlertsWithinBounds(double minLat, double maxLat, double minLng, double maxLng, int page, int size)` | Gets alerts within bounding box coordinates.                                                                           | alertRepository.findWithinBoundingBox                                             |
| `AlertResponse updateAlertStatus(Long id, Alert.AlertStatus status, String username)`                                       | Updates alert status only if requester is creator.                                                                     | alertRepository.findById, alertRepository.save                                    |
| `void deleteAlert(Long id, String username)`                                                                                | Deletes alert only if requester is creator.                                                                            | alertRepository.findById, alertRepository.delete                                  |
| `void updateReliabilityScore(Long alertId, int scoreDelta)`                                                                 | Increments/decrements reliability score by delta amount.                                                               | alertRepository.findById, alertRepository.save                                    |

**Transactional Methods:** All methods marked with @Transactional (readOnly=true for queries)

---

### VoteService

**Class Name:** `VoteService`

| Method Signature                                                    | What It Does                                                                                                                                  | Dependencies Called                                                                                                                                                         |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `void voteOnAlert(Long alertId, Boolean isUpvote, String username)` | Handles voting logic: creates new vote, toggles if same vote exists, updates if different vote exists. Updates reliability score accordingly. | voteRepository.findByAlertAndUser, userRepository.findByUsername, alertRepository.findById, voteRepository.save, voteRepository.delete, alertService.updateReliabilityScore |
| `long getUpvoteCount(Long alertId)`                                 | Returns count of upvotes for alert.                                                                                                           | voteRepository.countUpvotesByAlertId                                                                                                                                        |
| `long getDownvoteCount(Long alertId)`                               | Returns count of downvotes for alert.                                                                                                         | voteRepository.countDownvotesByAlertId                                                                                                                                      |
| `Boolean getUserVote(Long alertId, String username)`                | Returns true if user upvoted, false if downvoted, null if no vote.                                                                            | voteRepository.findByAlertAndUser, userRepository.findByUsername, alertRepository.findById                                                                                  |

**Transactional Methods:** All methods marked with @Transactional (readOnly=true for queries)

**Reliability Score Logic:**

- New upvote: +1
- New downvote: -1
- Toggle same vote off: reverses (+1 → -1, -1 → +1)
- Change vote from upvote to downvote: -2
- Change vote from downvote to upvote: +2

---

### ResourceService

**Class Name:** `ResourceService`

| Method Signature                                                                                       | What It Does                                                                                      | Dependencies Called                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ResourceResponse createResource(ResourceRequest request, String username)`                            | Creates resource from request, associates with user and resource type. Optionally links to alert. | userRepository.findByUsername, resourceTypeRepository.findById, alertRepository.findById, resourceRepository.save |
| `ResourceResponse getResourceById(Long id)`                                                            | Retrieves resource by ID, throws RuntimeException if not found.                                   | resourceRepository.findById                                                                                       |
| `List<ResourceResponse> getAllResources(int page, int size)`                                           | Fetches all resources paginated, sorted by createdAt descending.                                  | resourceRepository.findAll                                                                                        |
| `List<ResourceResponse> getResourcesByStatus(Resource.ResourceStatus status, int page, int size)`      | Gets resources filtered by status, paginated and sorted.                                          | resourceRepository.findByStatus                                                                                   |
| `List<ResourceResponse> getResourcesNearby(double lat, double lng, double radius, int page, int size)` | Gets available resources within radius (meters) of coordinates.                                   | resourceRepository.findNearbyAvailableResources                                                                   |
| `List<ResourceResponse> getResourcesByAlert(Long alertId, int page, int size)`                         | Gets resources associated with specific alert.                                                    | alertRepository.findById, resourceRepository.findByAlert                                                          |
| `ResourceResponse updateResourceStatus(Long id, Resource.ResourceStatus status, String username)`      | Updates resource status only if requester is creator.                                             | resourceRepository.findById, resourceRepository.save                                                              |
| `void deleteResource(Long id, String username)`                                                        | Deletes resource only if requester is creator.                                                    | resourceRepository.findById, resourceRepository.delete                                                            |

**Transactional Methods:** All methods marked with @Transactional (readOnly=true for queries)

---

### UserDetailsServiceImpl

**Class Name:** `UserDetailsServiceImpl`  
**Implements:** `UserDetailsService` (Spring Security)

| Method Signature                                  | What It Does                                                                                                                                  | Dependencies Called           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `UserDetails loadUserByUsername(String username)` | Loads User entity by username for authentication. Throws UsernameNotFoundException if not found. Returns User (which implements UserDetails). | userRepository.findByUsername |

**Transactional:** Yes (@Transactional)

---

## 5. CONTROLLERS & ENDPOINTS

### AlertController

**Base Path:** `/alerts`  
**CORS:** Enabled for all origins, maxAge=3600

| HTTP Method | Full Path           | Parameters                                                                                                         | Request Body        | Return Type                                                   | Service Called                                                                                                | Security                                        |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| POST        | /alerts             | -                                                                                                                  | @Valid AlertRequest | AlertResponse (HTTP 201)                                      | alertService.createAlert                                                                                      | @Authenticated                                  |
| GET         | /alerts/{id}        | id: Long (PathVariable)                                                                                            | -                   | AlertResponse                                                 | alertService.getAlertById                                                                                     | Permitted                                       |
| GET         | /alerts             | page=0 (default), size=20 (default), lat, lng, radius, minLat, maxLat, minLng, maxLng (all optional RequestParams) | -                   | List<AlertResponse>                                           | alertService.getAllAlerts OR alertService.getAlertsNearby OR alertService.getAlertsWithinBounds (conditional) | Permitted                                       |
| PATCH       | /alerts/{id}/status | id: Long (PathVariable), status: String (RequestParam)                                                             | -                   | AlertResponse                                                 | alertService.updateAlertStatus                                                                                | @Authenticated                                  |
| DELETE      | /alerts/{id}        | id: Long (PathVariable)                                                                                            | -                   | MessageResponse                                               | alertService.deleteAlert                                                                                      | @Authenticated                                  |
| POST        | /alerts/{id}/vote   | id: Long (PathVariable)                                                                                            | @Valid VoteRequest  | MessageResponse                                               | voteService.voteOnAlert                                                                                       | @Authenticated                                  |
| GET         | /alerts/{id}/votes  | id: Long (PathVariable)                                                                                            | -                   | VoteStats {upvotes: long, downvotes: long, userVote: Boolean} | voteService.getUpvoteCount, voteService.getDownvoteCount, voteService.getUserVote                             | Permitted (userVote is null if unauthenticated) |

---

### AuthController

**Base Path:** `/auth`  
**CORS:** Enabled for all origins, maxAge=3600

| HTTP Method | Full Path      | Parameters | Request Body         | Return Type     | Service/Component Called                                                                                         | Security  |
| ----------- | -------------- | ---------- | -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| POST        | /auth/login    | -          | @Valid LoginRequest  | JwtResponse     | authenticationManager.authenticate, jwtTokenProvider.generateJwtToken, userRepository (implicit via UserDetails) | Permitted |
| POST        | /auth/register | -          | @Valid SignupRequest | MessageResponse | userRepository.existsByUsername, userRepository.existsByEmail, passwordEncoder.encode, userRepository.save       | Permitted |

**LoginRequest Fields:** username (required, NotBlank), password (required, NotBlank)

**SignupRequest Fields:**

- username (required, 3-20 chars, NotBlank, Size)
- email (required, max 50, Email, NotBlank)
- password (required, 6-40 chars, NotBlank, Size)
- firstName (optional)
- lastName (optional)

**JwtResponse Fields:** token, type ("Bearer"), id, username, email, roles (List<String>)

---

### ResourceController

**Base Path:** `/resources`  
**CORS:** Enabled for all origins, maxAge=3600

| HTTP Method | Full Path              | Parameters                                                                                                              | Request Body           | Return Type                 | Service Called                                                                                                                                                     | Security       |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| POST        | /resources             | -                                                                                                                       | @Valid ResourceRequest | ResourceResponse (HTTP 201) | resourceService.createResource                                                                                                                                     | @Authenticated |
| GET         | /resources/{id}        | id: Long (PathVariable)                                                                                                 | -                      | ResourceResponse            | resourceService.getResourceById                                                                                                                                    | Permitted      |
| GET         | /resources             | page=0 (default), size=20 (default), status (optional), lat, lng, radius (optional), alertId (optional) (RequestParams) | -                      | List<ResourceResponse>      | resourceService.getResourcesByAlert OR resourceService.getResourcesNearby OR resourceService.getResourcesByStatus OR resourceService.getAllResources (conditional) | Permitted      |
| PATCH       | /resources/{id}/status | id: Long (PathVariable), status: String (RequestParam)                                                                  | -                      | ResourceResponse            | resourceService.updateResourceStatus                                                                                                                               | @Authenticated |
| DELETE      | /resources/{id}        | id: Long (PathVariable)                                                                                                 | -                      | MessageResponse             | resourceService.deleteResource                                                                                                                                     | @Authenticated |

---

## 6. DTOs & REQUEST/RESPONSE OBJECTS

### AlertRequest

**Class Name:** `AlertRequest`

| Field       | Type    | Validation Annotations                                                |
| ----------- | ------- | --------------------------------------------------------------------- |
| title       | String  | @NotBlank, @Size(max = 100)                                           |
| description | String  | None (optional)                                                       |
| alertTypeId | Integer | @NotNull                                                              |
| severity    | Integer | @NotNull, @Min(1), @Max(5)                                            |
| latitude    | Double  | @NotNull, @DecimalMin(value = "-90.0"), @DecimalMax(value = "90.0")   |
| longitude   | Double  | @NotNull, @DecimalMin(value = "-180.0"), @DecimalMax(value = "180.0") |

---

### AlertResponse

**Class Name:** `AlertResponse`

| Field            | Type          | Notes                             |
| ---------------- | ------------- | --------------------------------- |
| id               | Long          |                                   |
| title            | String        |                                   |
| description      | String        |                                   |
| alertType        | String        | (AlertType.name, not full object) |
| severity         | Integer       |                                   |
| latitude         | Double        |                                   |
| longitude        | Double        |                                   |
| status           | String        | (Alert.AlertStatus.name())        |
| reliabilityScore | Integer       |                                   |
| userId           | Long          |                                   |
| username         | String        |                                   |
| createdAt        | LocalDateTime |                                   |
| updatedAt        | LocalDateTime |                                   |

**Static Method:** `AlertResponse fromEntity(Alert alert)` - Converts Alert entity to DTO

---

### ResourceRequest

**Class Name:** `ResourceRequest`

| Field          | Type    | Validation Annotations                                        |
| -------------- | ------- | ------------------------------------------------------------- |
| title          | String  | @NotBlank, @Size(max = 100)                                   |
| description    | String  | None (optional)                                               |
| resourceTypeId | Integer | @NotNull                                                      |
| status         | String  | @NotBlank (values: AVAILABLE, REQUESTED, RESERVED, FULFILLED) |
| alertId        | Long    | None (optional)                                               |
| latitude       | Double  | @DecimalMin(value = "-90.0"), @DecimalMax(value = "90.0")     |
| longitude      | Double  | @DecimalMin(value = "-180.0"), @DecimalMax(value = "180.0")   |
| contactInfo    | String  | @Size(max = 255)                                              |

---

### ResourceResponse

**Class Name:** `ResourceResponse`

| Field        | Type          | Notes                                      |
| ------------ | ------------- | ------------------------------------------ |
| id           | Long          |                                            |
| title        | String        |                                            |
| description  | String        |                                            |
| resourceType | String        | (ResourceType.name, not full object)       |
| status       | String        | (Resource.ResourceStatus.name())           |
| userId       | Long          |                                            |
| username     | String        |                                            |
| alertId      | Long          | (nullable if resource not linked to alert) |
| latitude     | Double        |                                            |
| longitude    | Double        |                                            |
| contactInfo  | String        |                                            |
| createdAt    | LocalDateTime |                                            |
| updatedAt    | LocalDateTime |                                            |

**Static Method:** `ResourceResponse fromEntity(Resource resource)` - Converts Resource entity to DTO

---

### LoginRequest

**Class Name:** `LoginRequest`

| Field    | Type   | Validation Annotations |
| -------- | ------ | ---------------------- |
| username | String | @NotBlank              |
| password | String | @NotBlank              |

---

### SignupRequest

**Class Name:** `SignupRequest`

| Field     | Type   | Validation Annotations              |
| --------- | ------ | ----------------------------------- |
| username  | String | @NotBlank, @Size(min = 3, max = 20) |
| email     | String | @NotBlank, @Size(max = 50), @Email  |
| password  | String | @NotBlank, @Size(min = 6, max = 40) |
| firstName | String | None (optional)                     |
| lastName  | String | None (optional)                     |

---

### JwtResponse

**Class Name:** `JwtResponse`

| Field    | Type         | Default Value | Notes                                    |
| -------- | ------------ | ------------- | ---------------------------------------- |
| token    | String       | -             | JWT token string                         |
| type     | String       | "Bearer"      | Token type                               |
| id       | Long         | -             | User ID                                  |
| username | String       | -             | Username                                 |
| email    | String       | -             | User email                               |
| roles    | List<String> | -             | List of role names (e.g., ["ROLE_USER"]) |

**Constructor:** Two variants - one with all params, one without type (uses default)

---

### VoteRequest

**Class Name:** `VoteRequest`

| Field    | Type    | Validation Annotations |
| -------- | ------- | ---------------------- |
| isUpvote | Boolean | @NotNull               |

---

### MessageResponse

**Class Name:** `MessageResponse`

| Field   | Type   | Notes                  |
| ------- | ------ | ---------------------- |
| message | String | Generic message string |

**Annotations:** @AllArgsConstructor

---

## 7. SECURITY CONFIGURATION

### Authentication Mechanism

**Type:** JWT (JSON Web Tokens)

### Token Configuration

- **Secret Key:** `app.jwt.secret=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437`
- **Expiration:** `app.jwt.expiration-ms=86400000` (24 hours)
- **Algorithm:** HS512 (HMAC with SHA-512)

### JWT Token Provider

**Class Name:** `JwtTokenProvider`  
**Location:** `com.disasteralert.security`

**Key Methods:**

- `String generateJwtToken(Authentication authentication)` - Generates JWT token from authentication object
- `String getUserNameFromJwtToken(String token)` - Extracts username from token claims
- `boolean validateJwtToken(String authToken)` - Validates token signature and expiration

**Exception Handling:** Logs and catches SecurityException, MalformedJwtException, ExpiredJwtException, UnsupportedJwtException, IllegalArgumentException

### JWT Authentication Filter

**Class Name:** `JwtAuthenticationFilter`  
**Location:** `com.disasteralert.security`

**How It Works:**

1. Runs once per request (OncePerRequestFilter)
2. Extracts JWT from "Authorization" header (expects "Bearer {token}" format)
3. Validates token using JwtTokenProvider
4. Loads UserDetails from database via UserDetailsService
5. Creates UsernamePasswordAuthenticationToken and sets in SecurityContext

**Header Name:** `Authorization`  
**Token Prefix:** `Bearer ` (with space)

### JWT Authentication Entry Point

**Class Name:** `JwtAuthenticationEntryPoint`  
**Location:** `com.disasteralert.security`

**Behavior:** Returns 401 UNAUTHORIZED with JSON error response containing status, error, message, and path when authentication fails

### SecurityFilterChain Configuration

**Class Name:** `WebSecurityConfig`  
**Location:** `com.disasteralert.config`

**Rules:**

| Path Pattern                                      | Permission Level |
| ------------------------------------------------- | ---------------- |
| /auth/\*\*                                        | permitAll()      |
| /v3/api-docs/**, /swagger-ui/**, /swagger-ui.html | permitAll()      |
| /\*\* (all other paths)                           | authenticated()  |

**Configuration Details:**

- **CORS:** Enabled, configured to allow requests from http://localhost:3000
- **CSRF:** Disabled
- **Session Management:** STATELESS (SessionCreationPolicy.STATELESS)
- **Exception Handling:** Custom JwtAuthenticationEntryPoint
- **Filter Order:** JwtAuthenticationFilter added before UsernamePasswordAuthenticationFilter
- **Password Encoder:** BCryptPasswordEncoder
- **Method Security:** @EnableMethodSecurity (for @PreAuthorize, @RolesAllowed, etc.)

**CORS Configuration Details:**

- **Allowed Origins:** http://localhost:3000
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** authorization, content-type, x-auth-token
- **Exposed Headers:** x-auth-token
- **Credentials:** Allowed

### UserDetailsService Implementation

**Class Name:** `UserDetailsServiceImpl`  
**Location:** `com.disasteralert.service`

**Method:** `loadUserByUsername(String username)` returns User entity (implements UserDetails)

### Password Encoding

**Type:** BCryptPasswordEncoder

### Roles & Authorities

**Enum Name:** `Role` (located in User.java)

| Role Name  | String Value | Purpose            |
| ---------- | ------------ | ------------------ |
| ROLE_USER  | ROLE_USER    | Standard user role |
| ROLE_ADMIN | ROLE_ADMIN   | Administrator role |

**Storage:** Stored in User.roles as Set<Role> with EAGER fetch

---

## 8. EXCEPTION HANDLING

### GlobalExceptionHandler

**Class Name:** `GlobalExceptionHandler`  
**Location:** `com.disasteralert.exception`  
**Annotation:** @RestControllerAdvice

### Exception Handlers

| Exception Type                  | HTTP Status               | Handler Method                  | Response                                                |
| ------------------------------- | ------------------------- | ------------------------------- | ------------------------------------------------------- |
| ResourceNotFoundException       | 404 NOT_FOUND             | handleResourceNotFoundException | ErrorResponse                                           |
| UnauthorizedException           | 403 FORBIDDEN             | handleUnauthorizedException     | ErrorResponse                                           |
| UsernameNotFoundException       | 404 NOT_FOUND             | handleUsernameNotFoundException | ErrorResponse                                           |
| BadCredentialsException         | 401 UNAUTHORIZED          | handleBadCredentialsException   | ErrorResponse (message: "Invalid username or password") |
| MethodArgumentNotValidException | 400 BAD_REQUEST           | handleValidationExceptions      | Map<String, String> (field → error message)             |
| RuntimeException                | 500 INTERNAL_SERVER_ERROR | handleRuntimeException          | ErrorResponse                                           |
| Exception (generic)             | 500 INTERNAL_SERVER_ERROR | handleGenericException          | ErrorResponse (message: "An unexpected error occurred") |

### ErrorResponse Class

**Nested in:** GlobalExceptionHandler

| Field     | Type                   |
| --------- | ---------------------- |
| status    | int (HTTP status code) |
| message   | String                 |
| timestamp | LocalDateTime          |

### Custom Exception Classes

| Exception                 | Package                     | Parent Class     | Description                                          |
| ------------------------- | --------------------------- | ---------------- | ---------------------------------------------------- |
| ResourceNotFoundException | com.disasteralert.exception | RuntimeException | Thrown when entity not found (resource, alert, etc.) |
| UnauthorizedException     | com.disasteralert.exception | RuntimeException | Thrown when user lacks permission to perform action  |

---

## 9. CONFIGURATION & PROPERTIES

### application.properties

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/api

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/disaster_alert?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=2402megh
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

### @Configuration Classes

| Class Name        | Location                 | Beans Defined                                                                        |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| WebSecurityConfig | com.disasteralert.config | SecurityFilterChain, AuthenticationManager, PasswordEncoder, CorsConfigurationSource |
| DataInitializer   | com.disasteralert.config | CommandLineRunner (initializes default users, alert types, resource types)           |

### Main Application Class

**Class Name:** `DisasterAlertApplication`  
**Location:** `com.disasteralert`

**Annotations:**

- @SpringBootApplication
- @EnableScheduling (enables @Scheduled methods)

**Method:** `main(String[] args)` - Calls SpringApplication.run()

---

## 10. ENUMS

### Alert.AlertStatus

**Location:** Nested in Alert entity (`com.disasteralert.entity.Alert`)

| Value       |
| ----------- |
| ACTIVE      |
| RESOLVED    |
| FALSE_ALARM |

---

### Resource.ResourceStatus

**Location:** Nested in Resource entity (`com.disasteralert.entity.Resource`)

| Value     | Description                         |
| --------- | ----------------------------------- |
| AVAILABLE | Resource is available for use       |
| REQUESTED | Someone has requested this resource |
| RESERVED  | Resource is reserved for someone    |
| FULFILLED | Resource has been provided          |

---

### Role

**Location:** Defined in User.java (`com.disasteralert.entity.User`)

| Value      |
| ---------- |
| ROLE_USER  |
| ROLE_ADMIN |

---

## 11. EXISTING SCORING LOGIC

### Reliability Scoring System

**Location:** VoteService, AlertService

**Mechanism:** Vote-based reliability scoring for alerts

**Score Update Logic in VoteService.voteOnAlert():**

1. **New Vote (no prior vote):**
   - Upvote: +1 to reliability_score
   - Downvote: -1 to reliability_score

2. **Toggle Vote (same vote type already exists):**
   - Upvote toggle off: -1 to reliability_score
   - Downvote toggle off: +1 to reliability_score

3. **Change Vote (different vote type exists):**
   - Change from downvote to upvote: +2 to reliability_score
   - Change from upvote to downvote: -2 to reliability_score

**How It Works:**

- Each user can vote once per alert (unique constraint on alert_id + user_id)
- Toggle behavior: voting the same way again removes the vote
- Users can switch between upvote and downvote
- Reliability score affects alert credibility/visibility (foundation for trust system)

**Score Retrieval:**

- Stored in Alert.reliabilityScore field
- Updated by AlertService.updateReliabilityScore(Long alertId, int scoreDelta)
- Queries available: VoteRepository.countUpvotesByAlertId, countDownvotesByAlertId

**Current Usage:** Used to track alert credibility; foundation for future ranking/filtering features

---

## 12. DATABASE MIGRATIONS

### Migration Strategy

**Approach:** Hibernate auto DDL (spring.jpa.hibernate.ddl-auto=update)

**Note:** No Flyway or Liquibase migrations currently configured. Database schema is managed via:

1. JPA entity annotations
2. schema.sql initialization script
3. DataInitializer CommandLineRunner

### schema.sql

**Location:** `backend/src/main/resources/schema.sql`

**Tables Created:**

1. users
2. alert_types
3. alerts
4. votes
5. resource_types
6. resources
7. comments (defined in schema but no corresponding entity in current codebase)

**Initialization Data:**

- Alert Types: fire, flood, medical, power, other (5 default types)
- Resource Types: food, shelter, medical, transportation, volunteer, other (6 default types)

### DataInitializer CommandLineRunner

**Class Name:** DataInitializer  
**Execution:** Runs on application startup

**Initialization Tasks:**

1. **Users:**
   - Creates "admin" user (if not exists): admin@disaster.com / admin123
   - Creates "testuser" user (if not exists): test@disaster.com / test123

2. **Alert Types** (5 defaults):
   - Fire: "Fire-related emergencies" (🔥)
   - Flood: "Flooding and water-related disasters" (🌊)
   - Medical Emergency: "Medical emergencies requiring immediate attention" (🚑)
   - Power Outage: "Electrical power failures" (⚡)
   - Other: "Other types of emergencies" (⚠️)

3. **Resource Types** (6 defaults):
   - Food & Water: "Food and drinking water supplies" (🍽️)
   - Shelter: "Temporary shelter and accommodation" (🏠)
   - Medical Supplies: "Medical equipment and supplies" (💊)
   - Transportation: "Transportation and vehicle assistance" (🚗)
   - Volunteer Work: "Volunteer services and manpower" (👥)
   - Other: "Other types of resources" (📦)

---

## ADDITIONAL NOTES

### Frontend Integration

- **Frontend Port:** 3000 (React application)
- **Backend Base URL:** http://localhost:8080/api
- **CORS Allowed Origin:** http://localhost:3000

### API Documentation

- **Swagger UI Available:** http://localhost:8080/api/v3/api-docs
- **Library Used:** SpringDoc OpenAPI (springdoc-openapi-starter-webmvc-ui v2.2.0)

### Database

- **Database Name:** disaster_alert
- **Engine:** MySQL 8.0+
- **Character Set:** Default (UTF-8)

### Scheduling

- **Enabled:** Yes (@EnableScheduling on main application)
- **Current Usage:** None in current codebase (available for future features)

---

**Document Generated:** 2026-04-18  
**Project:** Disaster Alert Platform - Spring Boot Backend  
**Base Package:** com.disasteralert
