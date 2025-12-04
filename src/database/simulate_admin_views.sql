-- Simulate different admins viewing reservations
-- This creates a realistic scenario for testing notifications

-- First, check what admins exist in the system
SELECT user_uuid, nom, email FROM users LIMIT 5;

-- Update recent reservations to simulate different admins viewing them
-- Admin 1: Let's say admin@morthai.com viewed MOR-13 and MOR-14
UPDATE reservation 
SET 
  is_viewed = TRUE,
  last_viewed_by = 'admin@morthai.com',
  last_viewed_at = CURRENT_TIMESTAMP - INTERVAL '2 hours',
  last_modified_by = NULL,
  last_modified_at = NULL
WHERE reference IN ('MOR-13', 'MOR-14')
RETURNING reference, nomclient, last_viewed_by;

-- Admin 2: test@morthai.com viewed MOR-19
UPDATE reservation 
SET 
  is_viewed = TRUE,
  last_viewed_by = 'test@morthai.com',
  last_viewed_at = CURRENT_TIMESTAMP - INTERVAL '1 hour',
  last_modified_by = NULL,
  last_modified_at = NULL
WHERE reference = 'MOR-19'
RETURNING reference, nomclient, last_viewed_by;

-- Now check the results
SELECT 
  reference,
  nomclient,
  is_viewed,
  last_viewed_by,
  last_viewed_at,
  last_modified_by
FROM reservation 
WHERE last_viewed_by IS NOT NULL
ORDER BY last_viewed_at DESC
LIMIT 10;

