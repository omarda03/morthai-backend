-- Add fields to track which admin viewed/modified a reservation
-- This helps identify reservations that were viewed but not updated

-- Add columns for tracking admin interactions
ALTER TABLE reservation 
ADD COLUMN IF NOT EXISTS last_viewed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP;

-- Add indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_reservation_last_viewed_by ON reservation(last_viewed_by);
CREATE INDEX IF NOT EXISTS idx_reservation_last_modified_at ON reservation(last_modified_at);

-- Add comments
COMMENT ON COLUMN reservation.last_viewed_by IS 'Email/username of admin who last viewed this reservation';
COMMENT ON COLUMN reservation.last_viewed_at IS 'Timestamp when reservation was last viewed';
COMMENT ON COLUMN reservation.last_modified_by IS 'Email/username of admin who last modified this reservation';
COMMENT ON COLUMN reservation.last_modified_at IS 'Timestamp when reservation was last modified';

