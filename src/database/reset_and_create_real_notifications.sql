-- Reset all reservation tracking data and create realistic test scenario
-- This uses REAL admin emails from the users table

-- Step 1: Clear all existing tracking data
UPDATE reservation 
SET 
  is_viewed = FALSE,
  last_viewed_by = NULL,
  last_viewed_at = NULL,
  last_modified_by = NULL,
  last_modified_at = NULL;

-- Step 2: Check which admins exist in the system
SELECT 'Available admins:' as info;
SELECT user_uuid, nom, email FROM users;

-- Step 3: Simulate scenario where mohamed viewed some reservations
-- (When omar logs in, he should see these notifications)
UPDATE reservation 
SET 
  is_viewed = TRUE,
  last_viewed_by = 'mohamed.chbani@email.com',
  last_viewed_at = CURRENT_TIMESTAMP - INTERVAL '30 minutes',
  last_modified_by = NULL,
  last_modified_at = NULL
WHERE reference IN ('MOR-13', 'MOR-14')
RETURNING reference, nomclient, last_viewed_by;

-- Step 4: Verify the setup
SELECT 
  reference,
  nomclient,
  prixtotal,
  is_viewed,
  last_viewed_by,
  u.nom as viewed_by_name,
  last_viewed_at
FROM reservation r
LEFT JOIN users u ON r.last_viewed_by = u.email
WHERE r.last_viewed_by IS NOT NULL
ORDER BY r.last_viewed_at DESC;

-- Info message
SELECT 'Setup complete! When omar (omardaou57@gmail.com) logs in, he will see notifications for reservations viewed by mohamed.' as result;

