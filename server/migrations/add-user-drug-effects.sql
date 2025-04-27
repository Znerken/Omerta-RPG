-- Create the user_drug_effects table for tracking active drug effects on users
CREATE TABLE IF NOT EXISTS user_drug_effects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drug_id INTEGER NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  strength_bonus INTEGER DEFAULT 0,
  stealth_bonus INTEGER DEFAULT 0,
  charisma_bonus INTEGER DEFAULT 0,
  intelligence_bonus INTEGER DEFAULT 0,
  cash_gain_bonus INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  side_effect_triggered BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_drug_effects_user_id ON user_drug_effects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drug_effects_drug_id ON user_drug_effects(drug_id);
CREATE INDEX IF NOT EXISTS idx_user_drug_effects_active ON user_drug_effects(active);
CREATE INDEX IF NOT EXISTS idx_user_drug_effects_expires_at ON user_drug_effects(expires_at);