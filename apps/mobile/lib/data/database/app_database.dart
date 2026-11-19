import 'package:drift/drift.dart';
import 'tables.dart';
import 'daos/chores_dao.dart';
import 'daos/medications_dao.dart';
import 'daos/finance_dao.dart';
import 'daos/outbox_dao.dart';
import 'daos/grocery_dao.dart';
import 'daos/meal_plans_dao.dart';
import 'daos/vitals_dao.dart';
import 'daos/allergies_dao.dart';
import 'daos/utility_bills_dao.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    LocalHouseholds,
    LocalUsers,
    LocalChores,
    LocalMedications,
    LocalMedicationLogs,
    LocalCaregiverShifts,
    LocalVitalsLogs,
    LocalMedicalAllergies,
    LocalFinanceAccounts,
    LocalFinanceTransactions,
    LocalVaultItems,
    LocalGroceryItems,
    LocalMealPlans,
    LocalHomeWikiCards,
    LocalUtilityBills,
    LocalAssetRenewals,
    OutboxMutations,
  ],
  daos: [
    ChoresDao,
    MedicationsDao,
    FinanceDao,
    OutboxDao,
    GroceryDao,
    MealPlansDao,
    VitalsDao,
    AllergiesDao,
    UtilityBillsDao,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
      );
}
