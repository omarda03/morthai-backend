-- Migration script to add new columns to categorie table
-- This adds nomcategorie_fr, nomcategorie_en, and image columns if they don't exist

-- Add nomcategorie_fr column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categorie' AND column_name = 'nomcategorie_fr'
    ) THEN
        ALTER TABLE categorie ADD COLUMN nomcategorie_fr VARCHAR(255);
        -- Copy existing nomcategorie to nomcategorie_fr for existing records
        UPDATE categorie 
        SET nomcategorie_fr = nomcategorie 
        WHERE nomcategorie_fr IS NULL AND nomcategorie IS NOT NULL;
        RAISE NOTICE 'Column nomcategorie_fr added successfully';
    ELSE
        RAISE NOTICE 'Column nomcategorie_fr already exists';
    END IF;
END $$;

-- Add nomcategorie_en column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categorie' AND column_name = 'nomcategorie_en'
    ) THEN
        ALTER TABLE categorie ADD COLUMN nomcategorie_en VARCHAR(255);
        RAISE NOTICE 'Column nomcategorie_en added successfully';
    ELSE
        RAISE NOTICE 'Column nomcategorie_en already exists';
    END IF;
END $$;

-- Add image column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categorie' AND column_name = 'image'
    ) THEN
        ALTER TABLE categorie ADD COLUMN image VARCHAR(500);
        RAISE NOTICE 'Column image added successfully';
    ELSE
        RAISE NOTICE 'Column image already exists';
    END IF;
END $$;

