import 'package:drift/drift.dart';

// Canonical Local Tables Mirroring packages/client-schema/src/schema.sql

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

class LocalChores extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get assignedTo => text().nullable().references(LocalUsers, #id)();
  IntColumn get tokenReward => integer().withDefault(const Constant(0))();
  TextColumn get recurrence => text().withDefault(const Constant('daily'))();
  TextColumn get status => text().withDefault(const Constant('pending'))();
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
  TextColumn get memberId => text().references(LocalUsers, #id)();
  TextColumn get name => text()();
  TextColumn get dosage => text()();
  TextColumn get instructions => text().nullable()();
  TextColumn get scheduleTimes => text()(); // JSON string
  IntColumn get pillCount => integer().withDefault(const Constant(0))();
  IntColumn get lowStockThreshold => integer().withDefault(const Constant(5))();
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
  TextColumn get recordedBy => text().references(LocalUsers, #id)();
  DateTimeColumn get takenAt => dateTime()();
  TextColumn get status => text().withDefault(const Constant('taken'))();
  TextColumn get photoProofPath => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalCaregiverShifts extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get caregiverId => text().references(LocalUsers, #id)();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  TextColumn get shiftNotes => text().nullable()();
  TextColumn get handoffNotes => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('scheduled'))();
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
  TextColumn get recordedBy => text().references(LocalUsers, #id)();
  TextColumn get vitalType => text()();
  RealColumn get metricValue => real()();
  TextColumn get metricUnit => text()();
  TextColumn get secondaryValue => text().nullable()();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get recordedAt => dateTime()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalMedicalAllergies extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get memberId => text().references(LocalUsers, #id)();
  TextColumn get allergen => text()();
  TextColumn get severity => text().withDefault(const Constant('moderate'))();
  TextColumn get reactionDetails => text().nullable()();
  TextColumn get emergencyProtocol => text().nullable()();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalFinanceAccounts extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get accountName => text()();
  TextColumn get accountType => text().withDefault(const Constant('checking'))();
  IntColumn get balanceCents => integer().withDefault(const Constant(0))();
  TextColumn get currency => text().withDefault(const Constant('USD'))();
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
  TextColumn get loggedBy => text().references(LocalUsers, #id)();
  IntColumn get amountCents => integer()();
  TextColumn get category => text()();
  TextColumn get description => text().nullable()();
  DateTimeColumn get transactionDate => dateTime()();
  TextColumn get receiptUrl => text().nullable()();
  TextColumn get hlcTimestamp => text()();
  BoolColumn get isDeleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalVaultItems extends Table {
  TextColumn get id => text()();
  TextColumn get householdId => text().references(LocalHouseholds, #id)();
  TextColumn get category => text().withDefault(const Constant('general'))();
  TextColumn get titleHint => text()();
  TextColumn get payloadCiphertext => text()();
  TextColumn get payloadNonce => text()();
  TextColumn get encryptedDek => text()();
  TextColumn get dekNonce => text()();
  TextColumn get kekSalt => text()();
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
  TextColumn get item => text()();
  IntColumn get quantity => integer().withDefault(const Constant(1))();
  TextColumn get category => text().nullable()();
  BoolColumn get isChecked => boolean().withDefault(const Constant(false))();
  TextColumn get addedBy => text().nullable().references(LocalUsers, #id)();
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
  DateTimeColumn get day => dateTime()();
  TextColumn get mealType => text()();
  TextColumn get recipeName => text()();
  TextColumn get notes => text().nullable()();
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
  TextColumn get content => text()();
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
  TextColumn get billName => text()();
  TextColumn get provider => text()();
  IntColumn get amountCents => integer()();
  DateTimeColumn get dueDate => dateTime()();
  BoolColumn get isPaid => boolean().withDefault(const Constant(false))();
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
  TextColumn get assetType => text()();
  DateTimeColumn get renewalDate => dateTime()();
  IntColumn get costCents => integer().withDefault(const Constant(0))();
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
