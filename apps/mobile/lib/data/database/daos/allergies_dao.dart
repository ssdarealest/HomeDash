import 'package:drift/drift.dart';
import '../tables.dart';

part 'allergies_dao.g.dart';

@DriftAccessor(tables: [LocalMedicalAllergies])
class AllergiesDao extends DatabaseAccessor<GeneratedDatabase> {
  AllergiesDao(GeneratedDatabase db) : super(db);

  Stream<List<LocalMedicalAllergy>> watchAllergies(String householdId, {String? memberId}) {
    final query = select(localMedicalAllergies)
      ..where((tbl) {
        var expr = tbl.householdId.equals(householdId) & tbl.isDeleted.equals(false);
        if (memberId != null) {
          expr = expr & tbl.memberId.equals(memberId);
        }
        return expr;
      })
      ..orderBy([(tbl) => OrderingTerm.asc(tbl.allergen)]);
    return query.watch();
  }

  Future<int> insertOrUpdateAllergy(LocalMedicalAllergiesCompanion allergy) {
    return into(localMedicalAllergies).insertOnConflictUpdate(allergy);
  }
}
