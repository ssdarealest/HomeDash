import 'package:drift/drift.dart';
import '../tables.dart';

part 'finance_dao.g.dart';

@DriftAccessor(tables: [LocalFinanceAccounts, LocalFinanceTransactions])
class FinanceDao extends DatabaseAccessor<GeneratedDatabase> {
  FinanceDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalFinanceAccount>> watchAccounts(String householdId) {
    return (select(localFinanceAccounts)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false)))
        .watch();
  }

  Stream<List<LocalFinanceTransaction>> watchRecentTransactions(String householdId, {int limit = 20}) {
    return (select(localFinanceTransactions)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false))
          ..orderBy([(tbl) => OrderingTerm.desc(tbl.transactionDate)])
          ..limit(limit))
        .watch();
  }

  Future<int> insertTransaction(LocalFinanceTransactionsCompanion tx) {
    return into(localFinanceTransactions).insert(tx);
  }
}
