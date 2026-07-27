-- Never edit an applied Flyway migration to change a seeded default.
-- Preserve an explicit value chosen by an administrator; only migrate the
-- original seven-day default to the Iteration 5 fourteen-day default.
UPDATE system_settings
SET setting_value = '14',
    updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'ESCROW_HOLDING_DAYS'
  AND setting_value = '7';
