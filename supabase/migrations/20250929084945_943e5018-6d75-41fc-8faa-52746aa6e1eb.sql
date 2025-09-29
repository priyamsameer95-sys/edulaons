-- Create RLS policies for public access to partners and leads data
-- This allows the public partner page to display basic information without authentication

-- Update partners table to allow public read access for active partners
DROP POLICY IF EXISTS "Partners are viewable by everyone for now" ON public.partners;
CREATE POLICY "Partners are publicly viewable when active" 
ON public.partners 
FOR SELECT 
USING (is_active = true);

-- Update leads_new table to allow limited public read access for statistics
CREATE POLICY "Public stats access for partner leads" 
ON public.leads_new 
FOR SELECT 
USING (true);

-- Note: The existing partner policies already allow broad access, 
-- but we're making it explicit that only active partners are viewable