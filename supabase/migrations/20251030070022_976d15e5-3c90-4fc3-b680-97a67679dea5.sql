-- Phase 2: Ensure trigger exists to auto-calculate eligibility on lead creation

-- Drop trigger if exists (to recreate with correct definition)
DROP TRIGGER IF EXISTS trigger_calculate_eligibility ON leads_new;

-- Create trigger to calculate eligibility when lead is created or lender is changed
CREATE TRIGGER trigger_calculate_eligibility
  AFTER INSERT OR UPDATE OF lender_id ON leads_new
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_eligibility();