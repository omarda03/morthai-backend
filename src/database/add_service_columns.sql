-- Migration script to add new columns to service table
-- This adds nomservice_fr, nomservice_en, description_fr, description_en, meta_title, meta_description, reference columns

-- Add nomservice_fr column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'nomservice_fr'
    ) THEN
        ALTER TABLE service ADD COLUMN nomservice_fr VARCHAR(255);
        -- Copy existing nomservice to nomservice_fr for existing records
        UPDATE service 
        SET nomservice_fr = nomservice 
        WHERE nomservice_fr IS NULL AND nomservice IS NOT NULL;
        RAISE NOTICE 'Column nomservice_fr added successfully';
    ELSE
        RAISE NOTICE 'Column nomservice_fr already exists';
    END IF;
END $$;

-- Add nomservice_en column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'nomservice_en'
    ) THEN
        ALTER TABLE service ADD COLUMN nomservice_en VARCHAR(255);
        RAISE NOTICE 'Column nomservice_en added successfully';
    ELSE
        RAISE NOTICE 'Column nomservice_en already exists';
    END IF;
END $$;

-- Add description_fr column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'description_fr'
    ) THEN
        ALTER TABLE service ADD COLUMN description_fr TEXT;
        -- Copy existing description to description_fr for existing records
        UPDATE service 
        SET description_fr = description 
        WHERE description_fr IS NULL AND description IS NOT NULL;
        RAISE NOTICE 'Column description_fr added successfully';
    ELSE
        RAISE NOTICE 'Column description_fr already exists';
    END IF;
END $$;

-- Add description_en column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'description_en'
    ) THEN
        ALTER TABLE service ADD COLUMN description_en TEXT;
        RAISE NOTICE 'Column description_en added successfully';
    ELSE
        RAISE NOTICE 'Column description_en already exists';
    END IF;
END $$;

-- Add meta_title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'meta_title'
    ) THEN
        ALTER TABLE service ADD COLUMN meta_title VARCHAR(255);
        RAISE NOTICE 'Column meta_title added successfully';
    ELSE
        RAISE NOTICE 'Column meta_title already exists';
    END IF;
END $$;

-- Add meta_description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'meta_description'
    ) THEN
        ALTER TABLE service ADD COLUMN meta_description TEXT;
        RAISE NOTICE 'Column meta_description added successfully';
    ELSE
        RAISE NOTICE 'Column meta_description already exists';
    END IF;
END $$;

-- Add reference column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service' AND column_name = 'reference'
    ) THEN
        ALTER TABLE service ADD COLUMN reference VARCHAR(50);
        -- Make it unique after adding
        CREATE UNIQUE INDEX IF NOT EXISTS idx_service_reference ON service(reference) WHERE reference IS NOT NULL;
        RAISE NOTICE 'Column reference added successfully';
    ELSE
        RAISE NOTICE 'Column reference already exists';
    END IF;
END $$;

