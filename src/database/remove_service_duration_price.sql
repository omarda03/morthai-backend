-- Migration script to remove NOT NULL constraints from durée and prix columns in service table
-- These fields are now handled by the service_offers table

-- Make durée column nullable first (if it exists and is NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'durée'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE service ALTER COLUMN durée DROP NOT NULL;
        RAISE NOTICE 'Made durée column nullable';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'durée'
    ) THEN
        RAISE NOTICE 'durée column exists but is already nullable';
    ELSE
        RAISE NOTICE 'durée column does not exist';
    END IF;
END $$;

-- Make prix column nullable first (if it exists and is NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'prix'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE service ALTER COLUMN prix DROP NOT NULL;
        RAISE NOTICE 'Made prix column nullable';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'prix'
    ) THEN
        RAISE NOTICE 'prix column exists but is already nullable';
    ELSE
        RAISE NOTICE 'prix column does not exist';
    END IF;
END $$;

-- Optionally, we can remove these columns entirely if desired
-- Uncomment the following blocks to completely remove the columns:
/*
-- Remove durée column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'durée'
    ) THEN
        ALTER TABLE service DROP COLUMN durée;
        RAISE NOTICE 'Removed durée column';
    ELSE
        RAISE NOTICE 'durée column does not exist';
    END IF;
END $$;

-- Remove prix column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'prix'
    ) THEN
        ALTER TABLE service DROP COLUMN prix;
        RAISE NOTICE 'Removed prix column';
    ELSE
        RAISE NOTICE 'prix column does not exist';
    END IF;
END $$;
*/

