-- Script to test admin notifications
-- This simulates an admin viewing a reservation without modifying it

-- First, let's check if we have any reservations
SELECT 
  reservation_uuid, 
  reference,
  nomclient,
  is_viewed,
  last_viewed_by,
  last_viewed_at,
  last_modified_by,
  last_modified_at
FROM reservation 
LIMIT 5;

-- Update a recent reservation to simulate another admin viewing it
-- Replace 'test@example.com' with a different admin email than the one you're logged in with
UPDATE reservation 
SET 
  is_viewed = TRUE,
  last_viewed_by = 'other_admin@morthai.com',
  last_viewed_at = CURRENT_TIMESTAMP,
  last_modified_by = NULL,
  last_modified_at = NULL
WHERE reservation_uuid = (
  SELECT reservation_uuid 
  FROM reservation 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING 
  reservation_uuid,
  reference,
  nomclient,
  last_viewed_by,
  last_viewed_at;

-- Verify the update
SELECT 
  reservation_uuid,
  COALESCE(reference, 'MOR-' || SUBSTRING(reservation_uuid::text, 1, 8)) as reference,
  nomclient,
  is_viewed,
  last_viewed_by,
  last_viewed_at,
  last_modified_by,
  last_modified_at
FROM reservation 
WHERE last_viewed_by IS NOT NULL
ORDER BY last_viewed_at DESC
LIMIT 5;

