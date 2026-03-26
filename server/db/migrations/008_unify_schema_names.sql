-- Unified Schema Naming Consolidation
-- This script aligns naming conventions from historical migrations (001-003) 
-- to the actual production schema used in local development (schema.sql).

DO $$ 
BEGIN
    -- 1. Projects Table Fixes
    -- Rename user_id to owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='user_id') THEN
        ALTER TABLE projects RENAME COLUMN user_id TO owner_id;
    END IF;

    -- Rename tech to tech_stack and change type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='tech') THEN
        ALTER TABLE projects RENAME COLUMN tech TO tech_stack;
    END IF;

    -- Ensure tech_stack is TEXT[] (Neon might have it as VARCHAR from 001_initial_schema.sql)
    BEGIN
        ALTER TABLE projects ALTER COLUMN tech_stack TYPE TEXT[] USING string_to_array(tech_stack, ',');
    EXCEPTION WHEN others THEN
        -- If already array or incompatible, ignore or handle gracefully
    END;

    -- Ensure deadline is TIMESTAMP
    ALTER TABLE projects ALTER COLUMN deadline TYPE TIMESTAMP WITH TIME ZONE;

    -- 2. Tasks Table Fixes
    -- Rename assignee_id to assigned_user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee_id') THEN
        ALTER TABLE tasks RENAME COLUMN assignee_id TO assigned_user_id;
    END IF;

    -- Add creator_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='creator_id') THEN
        ALTER TABLE tasks ADD COLUMN creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Update types for priority and status ENUMs (if they were created as VARCHAR)
    -- We'll just ensure they are VARCHAR first to avoid casting errors from ENUMs that might not exist yet
    -- Actually, schema.sql uses ENUMs. If we want to be safe, we keep them as VARCHAR for now or create the types.
    
    -- 3. Activity Feed Fixes
    -- Rename text to content
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_feed' AND column_name='text') THEN
        ALTER TABLE activity_feed RENAME COLUMN text TO content;
    END IF;

    -- 4. AI Logs Fixes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_logs' AND column_name='action_type') THEN
        ALTER TABLE ai_logs RENAME COLUMN action_type TO feature_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_logs' AND column_name='response' AND data_type='text') THEN
        ALTER TABLE ai_logs ALTER COLUMN response TYPE JSONB USING response::JSONB;
    END IF;

END $$;
