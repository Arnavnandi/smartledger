package com.smartledger.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AuditLogSchemaInitializer {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogSchemaInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    public AuditLogSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateAuditLogsSchema() {
        try {
            logger.info("Verifying and migrating audit_logs database table schema...");
            
            // Add missing columns to audit_logs table dynamically
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action_type VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(550);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value TEXT;");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;");
            jdbcTemplate.execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SUCCESS';");

            // Remove obsolete NOT NULL constraints on legacy columns
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN action DROP NOT NULL;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN resource_type DROP NOT NULL;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN resource_id DROP NOT NULL;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE audit_logs ALTER COLUMN details DROP NOT NULL;");
            } catch (Exception ignored) {}

            // Populate action_type from legacy action column if present
            try {
                jdbcTemplate.execute("UPDATE audit_logs SET action_type = action WHERE action_type IS NULL AND action IS NOT NULL;");
                jdbcTemplate.execute("UPDATE audit_logs SET action = action_type WHERE action IS NULL AND action_type IS NOT NULL;");
                jdbcTemplate.execute("UPDATE audit_logs SET entity_type = resource_type WHERE entity_type IS NULL AND resource_type IS NOT NULL;");
                jdbcTemplate.execute("UPDATE audit_logs SET entity_id = resource_id WHERE entity_id IS NULL AND resource_id IS NOT NULL;");
                jdbcTemplate.execute("UPDATE audit_logs SET description = details WHERE description IS NULL AND details IS NOT NULL;");
            } catch (Exception e) {
                logger.debug("Legacy column sync skipped: {}", e.getMessage());
            }

            logger.info("audit_logs table schema migration completed successfully.");
        } catch (Exception e) {
            logger.error("Failed to execute audit_logs schema migration", e);
        }
    }
}
