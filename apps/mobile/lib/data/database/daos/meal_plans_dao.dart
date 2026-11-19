import 'package:drift/drift.dart';
import '../tables.dart';

part 'meal_plans_dao.g.dart';

@DriftAccessor(tables: [LocalMealPlans])
class MealPlansDao extends DatabaseAccessor<GeneratedDatabase> {
  MealPlansDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalMealPlan>> watchMealPlans(String householdId) {
    return (select(localMealPlans)
          ..where((tbl) => tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false))
          ..orderBy([(tbl) => OrderingTerm.asc(tbl.plannedDate)]))
        .watch();
  }

  Future<int> insertOrUpdateMealPlan(LocalMealPlansCompanion plan) {
    return into(localMealPlans).insertOnConflictUpdate(plan);
  }
}
