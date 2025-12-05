-- Add 'engineer' and 'executive_engineer' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'engineer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive_engineer';
