-- Phase 1: Database Optimization for 87K Courses
-- Add indexes and constraints for performance and data integrity

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Speed up university lookups during import (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_universities_name_lower 
ON universities (LOWER(name));

-- Speed up course queries by university (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_courses_university_id 
ON courses (university_id);

-- Speed up search by program name
CREATE INDEX IF NOT EXISTS idx_courses_program_name 
ON courses (program_name);

-- Speed up filtering by study level
CREATE INDEX IF NOT EXISTS idx_courses_study_level 
ON courses (study_level);

-- Composite index for duplicate detection during import
CREATE INDEX IF NOT EXISTS idx_courses_unique_lookup 
ON courses (university_id, program_name, study_level);

-- Full-text search index for program names (future search features)
CREATE INDEX IF NOT EXISTS idx_courses_program_name_gin 
ON courses USING gin(to_tsvector('english', program_name));

-- =====================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Prevent duplicate universities
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_university_name'
  ) THEN
    ALTER TABLE universities 
    ADD CONSTRAINT unique_university_name UNIQUE (name);
  END IF;
END $$;

-- Prevent duplicate courses per university
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_course_per_university'
  ) THEN
    ALTER TABLE courses
    ADD CONSTRAINT unique_course_per_university
    UNIQUE (university_id, program_name, study_level);
  END IF;
END $$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_universities_name_lower IS 
'Accelerates case-insensitive university name lookups during CSV imports';

COMMENT ON INDEX idx_courses_university_id IS 
'Speeds up queries filtering courses by university (most common pattern)';

COMMENT ON INDEX idx_courses_unique_lookup IS 
'Composite index for fast duplicate detection during bulk imports';

COMMENT ON INDEX idx_courses_program_name_gin IS 
'Full-text search index for program name search functionality';

-- Add comments for constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_university_name') THEN
    EXECUTE 'COMMENT ON CONSTRAINT unique_university_name ON universities IS ''Ensures no duplicate university names in the database''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_course_per_university') THEN
    EXECUTE 'COMMENT ON CONSTRAINT unique_course_per_university ON courses IS ''Prevents duplicate courses: same program + study level per university''';
  END IF;
END $$;