-- PostgreSQL 17+ Row Level Security (RLS) Policies & CDC Sync Trigger

-- 1. Enable Row Level Security on all multi-tenant tables
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

-- 2. Core Household & Member Access Policies
CREATE POLICY household_access ON households
    FOR ALL
    USING (id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_modules_access ON household_modules
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_members_isolation ON household_members
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

-- 3. Base Multi-Tenant Isolation Policies
CREATE POLICY household_tenant_isolation ON finance_accounts
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) != 'caregiver_guest'
    );

CREATE POLICY household_tenant_isolation ON finance_transactions
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) != 'caregiver_guest'
    );

CREATE POLICY household_tenant_isolation ON utility_bills
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) != 'caregiver_guest'
    );

CREATE POLICY household_tenant_isolation ON medications
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON caregiver_shifts
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON vitals_logs
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON medical_allergies
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON asset_renewals
    FOR ALL
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON home_wiki_cards
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

CREATE POLICY household_tenant_isolation ON sync_changes
    FOR SELECT
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY household_tenant_isolation ON audit_logs
    FOR SELECT
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

-- 4. Zero-Knowledge Vault Access (Admin Only)
CREATE POLICY vault_admin_access ON vault_items
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) = 'admin'
    );

CREATE POLICY vault_keys_access ON household_vault_keys
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
            OR current_setting('app.current_user_role', true) = 'admin'
        )
    );

-- 5. Break-Glass Requests Policy (Eliminates Escrow Deadlock)
CREATE POLICY break_glass_select ON break_glass_requests
    FOR SELECT
    USING (household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID);

CREATE POLICY break_glass_insert ON break_glass_requests
    FOR INSERT
    WITH CHECK (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND requester_user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
    );

CREATE POLICY break_glass_admin_update ON break_glass_requests
    FOR UPDATE
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) = 'admin'
    );

-- 6. Break-Glass Escrow Access (Recipient can view their share only when request is approved, or admin can manage)
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

CREATE POLICY vault_escrow_admin_all ON vault_escrow_shares
    FOR ALL
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) = 'admin'
    );

-- 7. Medication Logs (Admins, Seniors, and Caregivers can view, log, and update status)
CREATE POLICY medication_caregiver_select ON medication_logs
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

CREATE POLICY medication_caregiver_update ON medication_logs
    FOR UPDATE
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) IN ('admin', 'senior', 'caregiver_guest')
    );

CREATE POLICY medication_admin_delete ON medication_logs
    FOR DELETE
    USING (
        household_id = NULLIF(current_setting('app.current_household_id', true), '')::UUID
        AND current_setting('app.current_user_role', true) = 'admin'
    );

-- 8. PostgreSQL CDC Trigger Function for sync_changes Journaling
CREATE OR REPLACE FUNCTION fn_record_sync_change()
RETURNS TRIGGER AS $$
DECLARE
    target_household_id UUID;
    target_hlc TEXT;
    op VARCHAR(10);
    payload JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_household_id := OLD.household_id;
        target_hlc := to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
        op := 'DELETE';
        payload := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        target_household_id := NEW.household_id;
        target_hlc := to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
        IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at <> NEW.deleted_at) THEN
            -- Soft delete tombstone captured as DELETE operation with NULL payload
            op := 'DELETE';
            payload := NULL;
        ELSE
            op := 'UPDATE';
            payload := to_jsonb(NEW);
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        target_household_id := NEW.household_id;
        target_hlc := to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
        op := 'INSERT';
        payload := to_jsonb(NEW);
    END IF;

    INSERT INTO sync_changes (
        household_id,
        entity_table,
        entity_id,
        hlc_timestamp,
        operation,
        record_payload
    ) VALUES (
        target_household_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        target_hlc,
        op,
        payload
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 9. Attach CDC Triggers for Local-First Collaborative Tables
CREATE OR REPLACE TRIGGER trg_sync_finance_accounts
    AFTER INSERT OR UPDATE OR DELETE ON finance_accounts
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_finance_transactions
    AFTER INSERT OR UPDATE OR DELETE ON finance_transactions
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_utility_bills
    AFTER INSERT OR UPDATE OR DELETE ON utility_bills
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_medications
    AFTER INSERT OR UPDATE OR DELETE ON medications
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_medication_logs
    AFTER INSERT OR UPDATE OR DELETE ON medication_logs
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_caregiver_shifts
    AFTER INSERT OR UPDATE OR DELETE ON caregiver_shifts
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_vitals_logs
    AFTER INSERT OR UPDATE OR DELETE ON vitals_logs
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_medical_allergies
    AFTER INSERT OR UPDATE OR DELETE ON medical_allergies
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_vault_items
    AFTER INSERT OR UPDATE OR DELETE ON vault_items
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_asset_renewals
    AFTER INSERT OR UPDATE OR DELETE ON asset_renewals
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_home_wiki_cards
    AFTER INSERT OR UPDATE OR DELETE ON home_wiki_cards
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_grocery_items
    AFTER INSERT OR UPDATE OR DELETE ON grocery_items
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_meal_plans
    AFTER INSERT OR UPDATE OR DELETE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();

CREATE OR REPLACE TRIGGER trg_sync_chores
    AFTER INSERT OR UPDATE OR DELETE ON chores
    FOR EACH ROW EXECUTE FUNCTION fn_record_sync_change();
