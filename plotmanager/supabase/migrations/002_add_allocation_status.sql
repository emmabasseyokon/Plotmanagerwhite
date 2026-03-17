-- Add allocation_status column to buyers table
ALTER TABLE buyers
ADD COLUMN IF NOT EXISTS allocation_status TEXT NOT NULL DEFAULT 'not_allocated'
CHECK (allocation_status IN ('allocated', 'not_allocated'));
