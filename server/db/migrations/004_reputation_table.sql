-- Migration: 004_reputation_table
-- Description: Create dedicated reputation tracking table

CREATE TABLE IF NOT EXISTS reputation (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points  INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed from existing users.reputation column
INSERT INTO reputation (user_id, points)
SELECT id, COALESCE(reputation, 0) FROM users
ON CONFLICT (user_id) DO NOTHING;
