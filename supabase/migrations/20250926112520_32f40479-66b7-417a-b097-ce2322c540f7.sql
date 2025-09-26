-- Add global_rank column to universities table (renaming rank to global_rank)
ALTER TABLE universities RENAME COLUMN rank TO global_rank;