-- Add preferred_rank column to lenders table (1 = first preferred, 2 = second preferred, null = regular)
ALTER TABLE public.lenders ADD COLUMN preferred_rank INTEGER DEFAULT null;

-- Add check constraint to ensure only values 1, 2, or null
ALTER TABLE public.lenders ADD CONSTRAINT lenders_preferred_rank_check CHECK (preferred_rank IS NULL OR preferred_rank IN (1, 2));

-- Create unique partial index to ensure only one lender can have rank 1 and one can have rank 2
CREATE UNIQUE INDEX idx_lenders_preferred_rank ON public.lenders (preferred_rank) WHERE preferred_rank IS NOT NULL;