import 'package:drift/drift.dart';
import '../tables.dart';

part 'outbox_dao.g.dart';

@DriftAccessor(tables: [OutboxMutations])
class OutboxDao extends DatabaseAccessor<GeneratedDatabase> {
  OutboxDao(GeneratedDatabase db) : super(db);

  Stream<List<OutboxMutation>> watchPendingMutations() {
    return (select(outboxMutations)
          ..where((tbl) => tbl.retryCount.isSmallerThanValue(5))
          ..orderBy([(tbl) => OrderingTerm.asc(tbl.createdAt)]))
        .watch();
  }

  Future<List<OutboxMutation>> getPendingMutations({int limit = 100}) {
    return (select(outboxMutations)
          ..where((tbl) => tbl.retryCount.isSmallerThanValue(5))
          ..orderBy([(tbl) => OrderingTerm.asc(tbl.createdAt)])
          ..limit(limit))
        .get();
  }

  Future<int> insertMutation(OutboxMutationsCompanion mutation) {
    return into(outboxMutations).insert(mutation);
  }

  Future<int> markSynced(String mutationId) {
    return (delete(outboxMutations)..where((tbl) => tbl.id.equals(mutationId))).go();
  }

  Future<int> incrementRetry(String mutationId) {
    return customUpdate(
      'UPDATE outbox_mutations SET retry_count = retry_count + 1 WHERE id = ?',
      variables: [Variable.withString(mutationId)],
      updates: {outboxMutations},
    );
  }
}
