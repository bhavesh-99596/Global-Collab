-- Migration: Dynamic Plans & Subscriptions Enhancement

CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_inr INT NOT NULL DEFAULT 0,
    billing_type VARCHAR(50) DEFAULT 'monthly', -- 'monthly', 'yearly', 'forever'
    project_limit INT, -- NULL means unlimited
    member_limit INT,  -- NULL means unlimited
    ai_limit INT,      -- NULL means unlimited
    storage_limit BIGINT, -- in MB. NULL means unlimited
    features JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN
    BEGIN
        ALTER TABLE subscriptions RENAME COLUMN plan_type TO plan_id;
    EXCEPTION
        WHEN undefined_column THEN
    END;

    BEGIN
        ALTER TABLE subscriptions ALTER COLUMN plan_id TYPE VARCHAR(50);
        UPDATE subscriptions SET plan_id = LOWER(plan_id);
    EXCEPTION
        WHEN others THEN
    END;
    
    BEGIN
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        UPDATE subscriptions SET status = 'active' WHERE is_active = true;
        UPDATE subscriptions SET status = 'inactive' WHERE is_active = false;
        ALTER TABLE subscriptions DROP COLUMN IF EXISTS is_active;
    EXCEPTION
        WHEN duplicate_column THEN
            -- ignore
        WHEN undefined_column THEN
            -- ignore
    END;

    BEGIN
        ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    EXCEPTION
        WHEN duplicate_column THEN
    END;
END $$;
