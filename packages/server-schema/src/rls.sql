-- Enable Row Level Security
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_vault_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_escrow_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_wiki_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Base Multi-Tenant Isolation Policies (enforces current_setting('app.current_household_id'))
CREATE POLICY household_tenant_isolation ON finance_accounts
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON finance_transactions
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON utility_bills
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON grocery_items
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON meal_plans
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON chores
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

-- 2. Zero-Knowledge Vault Access (Admin Only)
CREATE POLICY vault_admin_access ON vault_items
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) = 'admin'
    );

-- 3. Break-Glass Escrow Access (Recipient can view their escrow share only when request is approved, or admin can manage)
CREATE POLICY vault_escrow_access ON vault_escrow_shares
    FOR SELECT
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND (
            current_setting('app.current_user_role', true) = 'admin'
            OR (
                recipient_user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
                AND EXISTS (
                    SELECT 1 FROM break_glass_requests bgr 
                    WHERE bgr.household_id = vault_escrow_shares.household_id 
                      AND bgr.requester_user_id = vault_escrow_shares.recipient_user_id 
                      AND bgr.status = 'approved'
                )
            )
        )
    );

-- 4. Medication Logs (Admins, Seniors, and Caregivers can view and log doses)
CREATE POLICY medication_caregiver_access ON medication_logs
    FOR SELECT
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) IN ('admin', 'senior', 'caregiver_guest')
    );

CREATE POLICY medication_caregiver_insert ON medication_logs
    FOR INSERT
    WITH CHECK (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) IN ('admin', 'senior', 'caregiver_guest')
    );
