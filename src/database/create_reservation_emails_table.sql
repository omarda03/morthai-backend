-- Create reservation_emails table for storing email conversations
-- This table stores both sent emails and received replies

CREATE TABLE IF NOT EXISTS reservation_emails (
    email_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_uuid UUID NOT NULL,
    email_type VARCHAR(50), -- confirm, reminder, cancel, change, reply, etc.
    subject VARCHAR(500) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    message_id VARCHAR(500), -- Gmail message ID
    thread_id VARCHAR(500), -- Gmail thread ID for conversation grouping
    in_reply_to VARCHAR(500), -- Message ID this email is replying to
    direction VARCHAR(10) NOT NULL, -- 'sent' or 'received'
    sent_by VARCHAR(255), -- Username of admin who sent (for sent emails)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_uuid) REFERENCES reservation(reservation_uuid) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reservation_emails_reservation ON reservation_emails(reservation_uuid);
CREATE INDEX IF NOT EXISTS idx_reservation_emails_thread ON reservation_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_reservation_emails_message_id ON reservation_emails(message_id);
CREATE INDEX IF NOT EXISTS idx_reservation_emails_created_at ON reservation_emails(created_at DESC);

-- Add comment to table
COMMENT ON TABLE reservation_emails IS 'Stores email conversations for reservations including sent emails and received replies from Gmail';

