# ResQNet

A real-time, mobile-responsive application for crowdsourced disaster alerts and resource sharing.

## Features

- User authentication (Register/Login)
- Geo-tagged disaster alerts with severity levels
- **Machine Learning Integrations:**
  - **Naive Bayes Classification** for automated Alert Credibility Analysis.
  - **K-Means Clustering** for geospatial Disaster Hotspot grouping.
  - **K-Nearest Neighbors (KNN)** algorithms for Proximity Resource Matching and Smart Duplicate Detection.
- Upvote/downvote system for alert verification
- Dynamic Meritocratic Reputation logic (points and tiered statuses)
- ResQNet AI Assistant (Smart Context Chatbot)
- Resource sharing (offers/requests)
- Interactive map view
- Real-time updates

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Mapbox/Leaflet
- **Backend**: Java Spring Boot, Spring Security, JWT
- **Database**: MySQL
- **Build Tools**: Maven, npm

## Getting Started

### Prerequisites

- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.8+

### Setup

1. **Backend Setup**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Machine Learning Testing Suite** (Optional)
   The project includes a `testcases/` array featuring 6 self-contained python scripts (using `requests` and `mysql-connector-python`) specifically designed to populate mock data automatically. Navigate to `testcases/` and run modules like `demo_knn_duplicates.py` from the shell string to emulate localized datasets cleanly.

## API Documentation

API documentation will be available at `http://localhost:8080/swagger-ui.html` after starting the backend.

## Database Schema

See `backend/src/main/resources/schema.sql` for the database schema.

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/disaster_alert?createDatabaseIfNotExist=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=yourpassword
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION_MS=86400000
```
