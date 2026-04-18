package com.disasteralert.config;

import com.disasteralert.entity.AlertType;
import com.disasteralert.entity.ResourceType;
import com.disasteralert.entity.User;
import com.disasteralert.repository.AlertTypeRepository;
import com.disasteralert.repository.ResourceTypeRepository;
import com.disasteralert.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, 
                                     PasswordEncoder passwordEncoder,
                                     AlertTypeRepository alertTypeRepository,
                                     ResourceTypeRepository resourceTypeRepository) {
        return args -> {
            logger.info("========================================");
            logger.info("Initializing hardcoded users...");
            
            // Check if hardcoded user already exists
            if (!userRepository.existsByUsername("admin")) {
                User adminUser = new User("admin", "admin@disaster.com", passwordEncoder.encode("admin123"));
                adminUser.setFirstName("Admin");
                adminUser.setLastName("User");
                adminUser.setRoles(new HashSet<>());
                adminUser.setEnabled(true);
                
                userRepository.save(adminUser);
                logger.info("✅ Admin user created - Username: admin | Password: admin123");
            } else {
                logger.info("ℹ️  Admin user already exists");
            }
            
            // Create a regular test user
            if (!userRepository.existsByUsername("testuser")) {
                User testUser = new User("testuser", "test@disaster.com", passwordEncoder.encode("test123"));
                testUser.setFirstName("Test");
                testUser.setLastName("User");
                testUser.setRoles(new HashSet<>());
                testUser.setEnabled(true);
                
                userRepository.save(testUser);
                logger.info("✅ Test user created - Username: testuser | Password: test123");
            } else {
                logger.info("ℹ️  Test user already exists");
            }
            
            // Initialize Alert Types
            logger.info("Initializing alert types...");
            if (alertTypeRepository.count() == 0) {
                createAlertType(alertTypeRepository, "Fire", "Fire-related emergencies", "🔥");
                createAlertType(alertTypeRepository, "Flood", "Flooding and water-related disasters", "🌊");
                createAlertType(alertTypeRepository, "Medical Emergency", "Medical emergencies requiring immediate attention", "🚑");
                createAlertType(alertTypeRepository, "Power Outage", "Electrical power failures", "⚡");
                createAlertType(alertTypeRepository, "Other", "Other types of emergencies", "⚠️");
                logger.info("✅ Created 5 default alert types");
            } else {
                logger.info("ℹ️  Alert types already exist");
            }
            
            // Initialize Resource Types
            logger.info("Initializing resource types...");
            if (resourceTypeRepository.count() == 0) {
                createResourceType(resourceTypeRepository, "Food & Water", "Food and drinking water supplies", "🍽️");
                createResourceType(resourceTypeRepository, "Shelter", "Temporary shelter and accommodation", "🏠");
                createResourceType(resourceTypeRepository, "Medical Supplies", "Medical equipment and supplies", "💊");
                createResourceType(resourceTypeRepository, "Transportation", "Transportation and vehicle assistance", "🚗");
                createResourceType(resourceTypeRepository, "Volunteer Work", "Volunteer services and manpower", "👥");
                createResourceType(resourceTypeRepository, "Other", "Other types of resources", "📦");
                logger.info("✅ Created 6 default resource types");
            } else {
                logger.info("ℹ️  Resource types already exist");
            }
            
            logger.info("========================================");
        };
    }
    
    private void createAlertType(AlertTypeRepository repository, String name, String description, String icon) {
        AlertType type = new AlertType();
        type.setName(name);
        type.setDescription(description);
        type.setIcon(icon);
        repository.save(type);
    }
    
    private void createResourceType(ResourceTypeRepository repository, String name, String description, String icon) {
        ResourceType type = new ResourceType();
        type.setName(name);
        type.setDescription(description);
        type.setIcon(icon);
        repository.save(type);
    }
}
