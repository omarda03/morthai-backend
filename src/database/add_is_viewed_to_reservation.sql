-- Add is_viewed field to reservation table to track if admin has opened/viewed the reservation
-- This helps identify new/untreated reservations

-- Add the column
ALTER TABLE reservation 
ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_reservation_is_viewed ON reservation(is_viewed);

-- Add comment
COMMENT ON COLUMN reservation.is_viewed IS 'Indicates if the reservation has been viewed/opened by an admin';

-- Update existing reservations to be viewed (optional - uncomment if you want to mark all existing as viewed)
-- UPDATE reservation SET is_viewed = TRUE WHERE created_at < NOW();

