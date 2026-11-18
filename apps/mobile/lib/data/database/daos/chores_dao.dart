import 'package:drift/drift.dart';
import '../tables.dart';

part 'chores_dao.g.dart';

@DriftAccessor(tables: [LocalChores])
class ChoresDao extends DatabaseAccessor<GeneratedDatabase> {
  ChoresDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalChore>> watchAllChores(String householdId) {
    return (select(localChores)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false))
          ..orderBy([(tbl) => OrderingTerm.asc(tbl.title)]))
        .watch();
  }

  Future<int> insertOrUpdateChore(LocalChoresCompanion chore) {
    return into(localChores).insertOnConflictUpdate(chore);
  }

  Future<int> toggleChoreStatus(String choreId, String newStatus, String hlc) {
    return (update(localChores)..where((tbl) => tbl.id.equals(choreId))).write(
      LocalChoresCompanion(
        status: Value(newStatus),
        hlcTimestamp: Value(hlc),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }
}
