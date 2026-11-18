import 'package:drift/drift.dart';
import '../tables.dart';

part 'medications_dao.g.dart';

@DriftAccessor(tables: [LocalMedications, LocalMedicationLogs])
class MedicationsDao extends DatabaseAccessor<GeneratedDatabase> {
  MedicationsDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalMedication>> watchAllMedications(String householdId) {
    return (select(localMedications)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false)))
        .watch();
  }

  Stream<List<LocalMedicationLog>> watchTodayLogs(String householdId) {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    return (select(localMedicationLogs)
          ..where((tbl) =>
              tbl.householdId.equals(householdId) &
              tbl.takenAt.isBiggerOrEqualValue(startOfDay) &
              tbl.isDeleted.equals(false))
          ..orderBy([(tbl) => OrderingTerm.desc(tbl.takenAt)]))
        .watch();
  }

  Future<int> logDose(LocalMedicationLogsCompanion logEntry) {
    return into(localMedicationLogs).insert(logEntry);
  }
}
