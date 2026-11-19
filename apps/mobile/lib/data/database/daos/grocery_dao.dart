import 'package:drift/drift.dart';
import '../tables.dart';

part 'grocery_dao.g.dart';

@DriftAccessor(tables: [LocalGroceryItems])
class GroceryDao extends DatabaseAccessor<GeneratedDatabase> {
  GroceryDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalGroceryItem>> watchGroceryItems(String householdId) {
    return (select(localGroceryItems)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false))
          ..orderBy([
            (tbl) => OrderingTerm.asc(tbl.aisleCategory),
            (tbl) => OrderingTerm.asc(tbl.name),
          ]))
        .watch();
  }

  Future<int> insertOrUpdateItem(LocalGroceryItemsCompanion item) {
    return into(localGroceryItems).insertOnConflictUpdate(item);
  }

  Future<int> checkItem(String itemId, bool isChecked, String? memberId, String hlc) {
    return (update(localGroceryItems)..where((tbl) => tbl.id.equals(itemId))).write(
      LocalGroceryItemsCompanion(
        isChecked: Value(isChecked),
        checkedByMemberId: Value(memberId),
        checkedAt: Value(isChecked ? DateTime.now() : null),
        hlcTimestamp: Value(hlc),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<int> archiveCheckedItems(String householdId, String hlc) {
    return (update(localGroceryItems)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isChecked.equals(true)))
        .write(
      LocalGroceryItemsCompanion(
        isDeleted: const Value(true),
        hlcTimestamp: Value(hlc),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }
}
