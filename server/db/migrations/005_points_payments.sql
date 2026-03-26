-- Migration: 005_points_payments
-- Description: Create wallet and payment tables, update reputation for monthly leaderboard

-- 1. Add monthly_points to reputation for dynamic tracking
ALTER TABLE reputation ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0;

-- 2. User Points Wallet
CREATE TABLE IF NOT EXISTS user_points (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Points Transactions Ledger
CREATE TABLE IF NOT EXISTS points_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(20) CHECK (type IN ('earn', 'redeem')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payments table for Razorpay integration with discounts
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    points_used INTEGER DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
