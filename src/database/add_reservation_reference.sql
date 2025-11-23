-- Migration script to add reference column to reservation table
-- This adds a reference field for N° cmd (command number)

-- Add reference column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation' AND column_name = 'reference'
    ) THEN
        ALTER TABLE reservation ADD COLUMN reference VARCHAR(50);
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_reservation_reference ON reservation(reference) WHERE reference IS NOT NULL;
        -- Generate references for existing reservations
        UPDATE reservation 
        SET reference = 'MOR-' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0')
        WHERE reference IS NULL;
        RAISE NOTICE 'Column reference added successfully';
    ELSE
        RAISE NOTICE 'Column reference already exists';
    END IF;
END $$;

