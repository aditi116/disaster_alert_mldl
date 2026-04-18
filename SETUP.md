# Disaster Alert Platform - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17+** (for Spring Boot backend)
- **Maven 3.8+** (for building the backend)
- **Node.js 16+** and **npm** (for React frontend)
- **MySQL 8.0+** (for the database)

## Database Setup

### 1. Install MySQL

If you don't have MySQL installed, download and install it from [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)

### 2. Create Database and User

```sql
-- Login to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE disaster_alert;

-- Create user (optional, or use root)
CREATE USER 'disaster_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON disaster_alert.* TO 'disaster_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Run Database Schema

```bash
cd backend
mysql -u root -p disaster_alert < src/main/resources/schema.sql
```

## Backend Setup

### 1. Configure Database Connection

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/disaster_alert?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

# JWT Secret (change this to a secure random string)
app.jwt.secret=your_very_secure_jwt_secret_key_here_at_least_256_bits_long
```

### 2. Build and Run Backend

```bash
cd backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 3. Verify Backend

Open your browser and navigate to:
- API Documentation: `http://localhost:8080/swagger-ui.html`
- Health Check: `http://localhost:8080/api/actuator/health` (if actuator is enabled)

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API Endpoint (Optional)

If your backend is running on a different port, edit `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### 3. Run Frontend

```bash
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## Testing the Application

### 1. Register a New User

1. Navigate to `http://localhost:3000`
2. Click "Register here"
3. Fill in the registration form
4. Click "Create account"

### 2. Login

1. Use your credentials to login
2. You'll be redirected to the dashboard

### 3. Create an Alert

1. Click "New Alert" button
2. Fill in the alert details
3. Use "Use current location" or enter coordinates manually
4. Submit the alert

### 4. View Alerts on Map

- Alerts will appear as markers on the map
- Click on a marker to see alert details
- Alerts are also listed in the sidebar

### 5. Vote on Alerts

- Click the thumbs up/down buttons on alert cards
- The reliability score updates in real-time

### 6. Share Resources

1. Click "New Resource" button
2. Fill in resource details
3. Submit to share with the community

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/{id}` - Get alert by ID
- `POST /api/alerts` - Create new alert (requires auth)
- `PATCH /api/alerts/{id}/status` - Update alert status (requires auth)
- `DELETE /api/alerts/{id}` - Delete alert (requires auth)
- `POST /api/alerts/{id}/vote` - Vote on alert (requires auth)
- `GET /api/alerts/{id}/votes` - Get vote statistics

### Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources/{id}` - Get resource by ID
- `POST /api/resources` - Create new resource (requires auth)
- `PATCH /api/resources/{id}/status` - Update resource status (requires auth)
- `DELETE /api/resources/{id}` - Delete resource (requires auth)

## Troubleshooting

### Backend Issues

**Problem**: `java.sql.SQLException: Access denied for user`
**Solution**: Check your MySQL credentials in `application.properties`

**Problem**: `Port 8080 already in use`
**Solution**: Change the port in `application.properties`:
```properties
server.port=8081
```

**Problem**: `Table doesn't exist`
**Solution**: Run the schema.sql file or set `spring.jpa.hibernate.ddl-auto=create`

### Frontend Issues

**Problem**: `Cannot connect to backend`
**Solution**: Ensure backend is running on port 8080 and CORS is configured

**Problem**: Map not displaying
**Solution**: Check browser console for errors and ensure Leaflet CSS is loaded

**Problem**: `npm install` fails
**Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Production Deployment

### Backend

1. Build the JAR file:
```bash
mvn clean package
```

2. Run the JAR:
```bash
java -jar target/disaster-alert-backend-0.0.1-SNAPSHOT.jar
```

### Frontend

1. Build for production:
```bash
npm run build
```

2. Serve the `build` folder using a web server (nginx, Apache, etc.)

## Security Notes

- Change the JWT secret in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Use prepared statements (already implemented with JPA)

## Support

For issues or questions, please check:
- Backend logs: `backend/logs/`
- Frontend console: Browser Developer Tools
- Database logs: MySQL error log

## License

This project is for educational purposes.
