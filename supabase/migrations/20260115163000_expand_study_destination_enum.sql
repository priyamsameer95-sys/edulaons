-- Migration: Expand study_destination_enum to include all countries from master list
-- This replaces the old enum with full country names (117 countries total)

-- Step 1: Create the new enum type with all countries
CREATE TYPE study_destination_enum_new AS ENUM (
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahrain',
  'Bangladesh',
  'Belarus',
  'Belgium',
  'Bosnia & Herzegovina',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Canada',
  'Chile',
  'China (Mainland)',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'Estonia',
  'Ethiopia',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Guatemala',
  'Honduras',
  'Hong Kong SAR',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kuwait',
  'Kyrgyzstan',
  'Latvia',
  'Lebanon',
  'Libya',
  'Lithuania',
  'Luxembourg',
  'Macau SAR',
  'Malaysia',
  'Malta',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Northern Cyprus',
  'Norway',
  'Oman',
  'Pakistan',
  'Palestine',
  'Panama',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Serbia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Thailand',
  'Tunisia',
  'Türkiye',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Venezuela',
  'Vietnam',
  'Other'
);

-- Step 2: Alter the leads_new table to use text temporarily
ALTER TABLE leads_new 
  ALTER COLUMN study_destination TYPE TEXT;

-- Step 3: Migrate existing data from old abbreviations to full names
UPDATE leads_new SET study_destination = 'United States' WHERE study_destination = 'USA';
UPDATE leads_new SET study_destination = 'United Kingdom' WHERE study_destination = 'UK';

-- Step 4: Drop the old enum type
DROP TYPE IF EXISTS study_destination_enum;

-- Step 5: Rename the new enum to the original name
ALTER TYPE study_destination_enum_new RENAME TO study_destination_enum;

-- Step 6: Convert the column back to the enum type
ALTER TABLE leads_new 
  ALTER COLUMN study_destination TYPE study_destination_enum 
  USING study_destination::study_destination_enum;

-- Step 7: Update any functions that reference this enum
-- (The check_duplicate_lead function uses this enum)
