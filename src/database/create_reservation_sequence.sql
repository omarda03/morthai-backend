-- Create sequence for reservation reference numbers
-- This ensures sequential auto-incrementing reference numbers like MOR-1, MOR-2, etc.

-- Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS reservation_reference_seq START 1;

-- If sequence exists and there are existing reservations, sync the sequence
DO $$ 
DECLARE
    max_ref_num INTEGER;
BEGIN
    -- Get the highest existing reference number
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM '^MOR-([0-9]+)$') AS INTEGER)), 0)
    INTO max_ref_num
    FROM reservation
    WHERE reference IS NOT NULL AND reference ~ '^MOR-[0-9]+$';
    
    -- Set sequence to the highest value if there are existing references
    IF max_ref_num > 0 THEN
        PERFORM setval('reservation_reference_seq', max_ref_num, true);
        RAISE NOTICE 'Sequence reservation_reference_seq synchronized to %', max_ref_num;
    ELSE
        RAISE NOTICE 'Sequence reservation_reference_seq created/ready (starting from 1)';
    END IF;
END $$;

