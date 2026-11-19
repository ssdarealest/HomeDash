import 'package:drift/drift.dart';
import '../tables.dart';

part 'vitals_dao.g.dart';

@DriftAccessor(tables: [LocalVitalsLogs])
class VitalsDao extends DatabaseAccessor<GeneratedDatabase> {
  VitalsDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalVitalsLog>> watchVitalsLogs(String householdId, {String? memberId, String? vitalType}) {
    final query = select(localVitalsLogs)
      ..where((tbl) {
        var expr = tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false);
        if (memberId != null) {
          expr = expr & tbl.memberId.equals(memberId);
        }
        if (vitalType != null) {
          expr = expr & tbl.vitalType.equals(vitalType);
        }
        return expr;
      })
      ..orderBy([(tbl) => OrderingTerm.desc(tbl.recordedAt)]);
    return query.watch();
  }

  Future<int> insertVitalsLog(LocalVitalsLogsCompanion log) {
    return into(localVitalsLogs).insertOnConflictUpdate(log);
  }
}
