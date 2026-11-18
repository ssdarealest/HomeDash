import 'package:drift/drift.dart';

// Canonical Local Tables Strictly Mirroring packages/client-schema/src/schema.sql

class LocalHouseholds extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get timezone => text().withDefault(const Constant('UTC'))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalUsers extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get email => text().nullable()();
  TextColumn get name => text()();
  TextColumn get role => text()(); // admin, senior, teen_child, caregiver_guest
  TextColumn get avatarUrl => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalFinanceAccounts extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get name => text()();
  TextColumn get accountType => text().withDefault(const Constant('shared_checking'))();
  IntColumn get balanceCents => integer().withDefault(const Constant(0))();
  TextColumn get currency => text().withDefault(const Constant('USD'))();
  TextColumn get ownerMemberId => text().nullable().references(LocalUsers, #id)();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalFinanceTransactions extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get accountId => text().references(LocalFinanceAccounts, #id)();
  IntColumn get amountCents => integer()();
  TextColumn get transactionType => text()();
  TextColumn get category => text()();
  TextColumn get description => text().nullable()();
  DateTimeColumn get transactionDate => dateTime()();
  TextColumn get source => text().withDefault(const Constant('manual'))();
  TextColumn get receiptUrl => text().nullable()();
  TextColumn get createdByMemberId => text().nullable().references(LocalUsers, #id)();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalUtilityBills extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get providerName => text()();
  TextColumn get billType => text()();
  DateTimeColumn get billingPeriodStart => dateTime().nullable()();
  DateTimeColumn get billingPeriodEnd => dateTime().nullable()();
  IntColumn get amountCents => integer()();
  DateTimeColumn get dueDate => dateTime()();
  TextColumn get status => text().withDefault(const Constant('detected'))();
  TextColumn get rawInvoiceUrl => text().nullable()();
  TextColumn get ocrMetadata => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMedications extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get patientMemberId => text().references(LocalUsers, #id)();
  TextColumn get name => text()();
  TextColumn get dosage => text()();
  TextColumn get instructions => text().nullable()();
  TextColumn get scheduleCron => text()();
  IntColumn get remainingPills => integer().withDefault(const Constant(0))();
  IntColumn get refillThreshold => integer().withDefault(const Constant(5))();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMedicationLogs extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get medicationId => text().references(LocalMedications, #id)();
  DateTimeColumn get scheduledAt => dateTime()();
  DateTimeColumn get takenAt => dateTime().nullable()();
  TextColumn get status => text().withDefault(const Constant('taken'))();
  TextColumn get photoProofPath => text().nullable()();
  TextColumn get recordedByMemberId => text().nullable().references(LocalUsers, #id)();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalCaregiverShifts extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get patientMemberId => text().references(LocalUsers, #id)();
  TextColumn get assignedMemberId => text().references(LocalUsers, #id)();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  TextColumn get status => text().withDefault(const Constant('scheduled'))();
  TextColumn get notes => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalVitalsLogs extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get memberId => text().references(LocalUsers, #id)();
  TextColumn get vitalType => text()();
  RealColumn get valuePrimary => real()();
  RealColumn get valueSecondary => real().nullable()();
  TextColumn get unit => text()();
  DateTimeColumn get recordedAt => dateTime()();
  TextColumn get notes => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMedicalAllergies extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get memberId => text().references(LocalUsers, #id)();
  TextColumn get allergen => text()();
  TextColumn get severity => text().withDefault(const Constant('critical'))();
  TextColumn get reactionDescription => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalGroceryItems extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get name => text()();
  TextColumn get quantity => text().withDefault(const Constant('1'))();
  TextColumn get aisleCategory => text().withDefault(const Constant('pantry'))();
  BoolColumn get isChecked => boolean().withDefault(const Constant(false))();
  TextColumn get checkedByMemberId => text().nullable().references(LocalUsers, #id)();
  DateTimeColumn get checkedAt => dateTime().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMealPlans extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  DateTimeColumn get plannedDate => dateTime()();
  TextColumn get mealType => text()();
  TextColumn get recipeTitle => text()();
  TextColumn get notes => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalChores extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get title => text()();
  TextColumn get assignedMemberId => text().nullable().references(LocalUsers, #id)();
  TextColumn get recurrenceRule => text().nullable()();
  IntColumn get rewardPoints => integer().withDefault(const Constant(0))();
  IntColumn get allowanceCents => integer().withDefault(const Constant(0))();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  BoolColumn get verifiedByAdmin => boolean().withDefault(const Constant(false))();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalHomeWikiCards extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get title => text()();
  TextColumn get category => text()();
  TextColumn get contentMarkdown => text()();
  TextColumn get metadata => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalVaultItems extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get title => text()();
  TextColumn get category => text()();
  TextColumn get encryptedPayload => text()();
  TextColumn get payloadNonce => text()();
  TextColumn get encryptedDek => text()();
  TextColumn get dekNonce => text()();
  IntColumn get keyVersion => integer().withDefault(const Constant(1))();
  TextColumn get createdByMemberId => text().nullable().references(LocalUsers, #id)();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalAssetRenewals extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get assetName => text()();
  DateTimeColumn get renewalDate => dateTime()();
  IntColumn get notificationLeadDays => integer().withDefault(const Constant(30))();
  TextColumn get notes => text().nullable()();
  // Universal Sync Columns
  IntColumn get syncState => integer().withDefault(const Constant(1))();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// Client-Side Outbox Mutation Table
class OutboxMutations extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text()();
  TextColumn get clientId => text()();
  TextColumn get entityTable => text()();
  TextColumn get entityId => text()();
  TextColumn get operation => text()(); // INSERT, UPDATE, DELETE
  TextColumn get recordPayload => text()(); // JSON string
  TextColumn get hlcTimestamp => text()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}
