-- Fix lead_universities table structure
ALTER TABLE lead_universities RENAME COLUMN "Global_uni_Rank" TO lead_id;

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE lead_universities 
ADD CONSTRAINT fk_lead_universities_lead_id 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;