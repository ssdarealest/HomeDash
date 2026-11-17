-- Local SQLite Client Schema for Offline-First Synchronization

CREATE TABLE IF NOT EXISTS local_finance_accounts (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'shared_checking',
    balance_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    owner_member_id TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1, -- 0: synced, 1: pending_insert, 2: pending_update, 3: pending_delete
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_finance_transactions (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    transaction_date TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    receipt_url TEXT,
    created_by_member_id TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_utility_bills (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    bill_type TEXT NOT NULL,
    billing_period_start TEXT,
    billing_period_end TEXT,
    amount_cents INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'detected',
    raw_invoice_url TEXT,
    ocr_metadata TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_medications (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    patient_member_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    instructions TEXT,
    schedule_cron TEXT NOT NULL,
    remaining_pills INTEGER NOT NULL DEFAULT 0,
    refill_threshold INTEGER NOT NULL DEFAULT 5,
    is_active INTEGER NOT NULL DEFAULT 1,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_medication_logs (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    medication_id TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    taken_at TEXT,
    status TEXT NOT NULL DEFAULT 'taken',
    photo_proof_path TEXT,
    recorded_by_member_id TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_caregiver_shifts (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    patient_member_id TEXT NOT NULL,
    assigned_member_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_vitals_logs (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    vital_type TEXT NOT NULL,
    value_primary REAL NOT NULL,
    value_secondary REAL,
    unit TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    notes TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_medical_allergies (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    allergen TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'critical',
    reaction_description TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_grocery_items (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT NOT NULL DEFAULT '1',
    aisle_category TEXT NOT NULL DEFAULT 'pantry',
    is_checked INTEGER NOT NULL DEFAULT 0,
    checked_by_member_id TEXT,
    checked_at TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_meal_plans (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    planned_date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    recipe_title TEXT NOT NULL,
    notes TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_chores (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    title TEXT NOT NULL,
    assigned_member_id TEXT,
    recurrence_rule TEXT,
    reward_points INTEGER NOT NULL DEFAULT 0,
    allowance_cents INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    verified_by_admin INTEGER NOT NULL DEFAULT 0,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_home_wiki_cards (
    id TEXT PRIMARY KEY NOT NULL,
    household_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    metadata TEXT,
    -- Sync columns
    sync_state INTEGER NOT NULL DEFAULT 1,
    hlc_timestamp TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
