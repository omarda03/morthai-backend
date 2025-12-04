-- Create reservation_notes table for storing order notes as a discussion thread
-- Each note is linked to a reservation and includes timestamp and user info

CREATE TABLE IF NOT EXISTS reservation_notes (
    note_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_uuid UUID NOT NULL,
    note TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL, -- Username of the admin who created the note
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_uuid) REFERENCES reservation(reservation_uuid) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reservation_notes_reservation ON reservation_notes(reservation_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_notes_created_at ON reservation_notes(created_at DESC);

-- Add comment to table
COMMENT ON TABLE reservation_notes IS 'Stores order notes for reservations as a discussion thread with timestamp and user info';

