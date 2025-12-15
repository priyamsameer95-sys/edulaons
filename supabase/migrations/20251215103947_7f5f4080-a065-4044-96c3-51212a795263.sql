-- Update the 4 broken leads to CashKaro partner
UPDATE leads_new 
SET partner_id = '4d30adb1-65b8-4b8e-bd65-ebebd3bd3d52', -- CashKaro
    updated_at = now()
WHERE id IN (
  '7b4ef883-cdc4-48d7-81f4-175cb33aec67', -- EDU-1765780170717
  '5635fcec-d5c4-4101-9e6b-e1c697facf94', -- EDU-1765777057964
  'bc1a5c2e-6830-49e7-8531-05ffd2127a0c', -- EDU-1765775240212
  '244d7a23-cb61-4862-bb40-7be0f4314ae8'  -- EDU-1765774969972
)