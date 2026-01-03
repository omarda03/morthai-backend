-- Migration script to add status column to offre table
-- This adds a status field with default value 'en attente'

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'offre' AND column_name = 'status'
    ) THEN
        ALTER TABLE offre ADD COLUMN status VARCHAR(50) DEFAULT 'en attente';
        -- Set default status for existing records
        UPDATE offre 
        SET status = 'en attente'
        WHERE status IS NULL;
        RAISE NOTICE 'Column status added successfully';
    ELSE
        RAISE NOTICE 'Column status already exists';
    END IF;
END $$;

