-- Migration script to add new columns to categorie table
-- Run this if the table already exists

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add nomcategorie_fr column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categorie' AND column_name = 'nomcategorie_fr') THEN
        ALTER TABLE categorie ADD COLUMN nomcategorie_fr VARCHAR(255);
    END IF;

    -- Add nomcategorie_en column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categorie' AND column_name = 'nomcategorie_en') THEN
        ALTER TABLE categorie ADD COLUMN nomcategorie_en VARCHAR(255);
    END IF;

    -- Add image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categorie' AND column_name = 'image') THEN
        ALTER TABLE categorie ADD COLUMN image VARCHAR(500);
    END IF;

    -- Copy existing nomcategorie to nomcategorie_fr if nomcategorie_fr is null
    UPDATE categorie 
    SET nomcategorie_fr = nomcategorie 
    WHERE nomcategorie_fr IS NULL AND nomcategorie IS NOT NULL;
END $$;

