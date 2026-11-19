import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Phase 5 Mobile Drift DAOs & AppDatabase Integration', () => {
  it('should define GroceryDao with watch and checkout methods', () => {
    const daoPath = path.resolve(__dirname, '../lib/data/database/daos/grocery_dao.dart');
    expect(fs.existsSync(daoPath)).toBe(true);
    const content = fs.readFileSync(daoPath, 'utf8');
    expect(content).toContain('class GroceryDao');
    expect(content).toContain('watchGroceryItems');
    expect(content).toContain('checkItem');
    expect(content).toContain('archiveCheckedItems');
  });

  it('should define MealPlansDao with watch and allergen matching query', () => {
    const daoPath = path.resolve(__dirname, '../lib/data/database/daos/meal_plans_dao.dart');
    expect(fs.existsSync(daoPath)).toBe(true);
    const content = fs.readFileSync(daoPath, 'utf8');
    expect(content).toContain('class MealPlansDao');
    expect(content).toContain('watchMealPlans');
    expect(content).toContain('insertOrUpdateMealPlan');
  });

  it('should define VitalsDao with watch and vitals logging', () => {
    const daoPath = path.resolve(__dirname, '../lib/data/database/daos/vitals_dao.dart');
    expect(fs.existsSync(daoPath)).toBe(true);
    const content = fs.readFileSync(daoPath, 'utf8');
    expect(content).toContain('class VitalsDao');
    expect(content).toContain('watchVitalsLogs');
    expect(content).toContain('insertVitalsLog');
  });

  it('should define AllergiesDao with watch active allergies', () => {
    const daoPath = path.resolve(__dirname, '../lib/data/database/daos/allergies_dao.dart');
    expect(fs.existsSync(daoPath)).toBe(true);
    const content = fs.readFileSync(daoPath, 'utf8');
    expect(content).toContain('class AllergiesDao');
    expect(content).toContain('watchAllergies');
    expect(content).toContain('insertOrUpdateAllergy');
  });

  it('should define UtilityBillsDao with watch bills', () => {
    const daoPath = path.resolve(__dirname, '../lib/data/database/daos/utility_bills_dao.dart');
    expect(fs.existsSync(daoPath)).toBe(true);
    const content = fs.readFileSync(daoPath, 'utf8');
    expect(content).toContain('class UtilityBillsDao');
    expect(content).toContain('watchUtilityBills');
  });

  it('should register all new DAOs in AppDatabase', () => {
    const dbPath = path.resolve(__dirname, '../lib/data/database/app_database.dart');
    expect(fs.existsSync(dbPath)).toBe(true);
    const content = fs.readFileSync(dbPath, 'utf8');
    expect(content).toContain('GroceryDao');
    expect(content).toContain('MealPlansDao');
    expect(content).toContain('VitalsDao');
    expect(content).toContain('AllergiesDao');
    expect(content).toContain('UtilityBillsDao');
  });
});
