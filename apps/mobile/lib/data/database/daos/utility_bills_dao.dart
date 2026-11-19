import 'package:drift/drift.dart';
import '../tables.dart';

part 'utility_bills_dao.g.dart';

@DriftAccessor(tables: [LocalUtilityBills])
class UtilityBillsDao extends DatabaseAccessor<GeneratedDatabase> {
  UtilityBillsDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalUtilityBill>> watchUtilityBills(String householdId) {
    return (select(localUtilityBills)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false))
          ..orderBy([(tbl) => OrderingTerm.asc(tbl.dueDate)]))
        .watch();
  }

  Future<int> insertOrUpdateBill(LocalUtilityBillsCompanion bill) {
    return into(localUtilityBills).insertOnConflictUpdate(bill);
  }
}
