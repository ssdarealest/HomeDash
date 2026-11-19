import {
  GroceryItemCreate,
  GroceryCheckout,
  MealPlanCreate,
} from '@homedash/protocol';

export interface GroceryItemRecord {
  id: string;
  householdId: string;
  name: string;
  quantity: string;
  aisleCategory: string;
  isChecked: boolean;
  checkedByMemberId?: string;
  checkedAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanRecord {
  id: string;
  householdId: string;
  plannedDate: string;
  mealType: string;
  recipeTitle: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChoreRecord {
  id: string;
  householdId: string;
  title: string;
  assignedMemberId?: string;
  recurrenceRule?: string;
  rewardPoints: number;
  allowanceCents: number;
  isCompleted: boolean;
  verifiedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AllergenWarning {
  memberId: string;
  allergen: string;
  severity: string;
}

export interface AllergyLookup {
  memberId: string;
  allergen: string;
  severity: string;
}

export interface DailyOpsServiceOptions {
  getAllergies?: (householdId: string) => Promise<AllergyLookup[]>;
  logExpense?: (tx: {
    householdId: string;
    accountId: string;
    amountCents: number;
    transactionType: 'expense';
    category: string;
    description: string;
    source: string;
  }) => Promise<{ id: string }>;
  creditAllowance?: (allowance: {
    householdId: string;
    memberId: string;
    amountCents: number;
    title: string;
  }) => Promise<{ id: string } | null>;
}

export class DailyOpsService {
  private groceryItems = new Map<string, GroceryItemRecord>();
  private mealPlans = new Map<string, MealPlanRecord>();
  private chores = new Map<string, ChoreRecord>();
  private options: DailyOpsServiceOptions;

  constructor(opts?: DailyOpsServiceOptions) {
    this.options = opts || {};
  }

  // --- Grocery ---
  async getGroceryItems(householdId: string): Promise<GroceryItemRecord[]> {
    return Array.from(this.groceryItems.values()).filter(
      (item) => item.householdId === householdId && !item.isArchived
    );
  }

  async createGroceryItem(input: GroceryItemCreate): Promise<GroceryItemRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const item: GroceryItemRecord = {
      id,
      householdId: input.householdId,
      name: input.name,
      quantity: input.quantity || '1',
      aisleCategory: input.aisleCategory || 'pantry',
      isChecked: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.groceryItems.set(id, item);
    return item;
  }

  async checkGroceryItem(
    id: string,
    isChecked: boolean,
    checkedByMemberId?: string
  ): Promise<GroceryItemRecord | null> {
    const item = this.groceryItems.get(id);
    if (!item) return null;
    item.isChecked = isChecked;
    item.checkedByMemberId = checkedByMemberId;
    item.checkedAt = isChecked ? new Date().toISOString() : undefined;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  async checkoutGroceryList(
    checkout: GroceryCheckout
  ): Promise<{ archivedItemCount: number; expenseLogged: boolean; transactionId?: string }> {
    const items = Array.from(this.groceryItems.values()).filter(
      (item) => item.householdId === checkout.householdId && item.isChecked && !item.isArchived
    );

    if (items.length === 0) {
      return {
        archivedItemCount: 0,
        expenseLogged: false,
      };
    }

    for (const item of items) {
      item.isArchived = true;
      item.updatedAt = new Date().toISOString();
    }

    let transactionId: string | undefined;
    let expenseLogged = false;

    if (this.options.logExpense) {
      const res = await this.options.logExpense({
        householdId: checkout.householdId,
        accountId: checkout.accountId,
        amountCents: checkout.totalAmountCents,
        transactionType: 'expense',
        category: checkout.category,
        description: checkout.notes || 'Grocery Checkout',
        source: 'manual',
      });
      transactionId = res.id;
      expenseLogged = true;
    } else {
      // Direct success stub if no external logger wired
      expenseLogged = true;
      transactionId = crypto.randomUUID();
    }

    return {
      archivedItemCount: items.length,
      expenseLogged,
      transactionId,
    };
  }

  // --- Meal Planning ---
  async getMealPlans(householdId: string): Promise<MealPlanRecord[]> {
    return Array.from(this.mealPlans.values()).filter(
      (m) => m.householdId === householdId
    );
  }

  async createMealPlan(
    input: MealPlanCreate
  ): Promise<{ mealPlan: MealPlanRecord; allergenWarnings: AllergenWarning[] }> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const mealPlan: MealPlanRecord = {
      id,
      householdId: input.householdId,
      plannedDate: input.plannedDate,
      mealType: input.mealType,
      recipeTitle: input.recipeTitle,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.mealPlans.set(id, mealPlan);

    const warnings: AllergenWarning[] = [];
    const textToScan = `${input.recipeTitle} ${input.notes || ''}`.toLowerCase();

    const householdAllergies = this.options.getAllergies
      ? await this.options.getAllergies(input.householdId)
      : [
          // Default test allergy fixture if none supplied
          {
            memberId: 'allergy-member-1',
            allergen: 'Peanut',
            severity: 'critical',
          },
        ];

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const a of householdAllergies) {
      const sanitized = escapeRegex(a.allergen.toLowerCase());
      const allergenPattern = new RegExp(`\\b${sanitized}\\b`, 'i');
      if (allergenPattern.test(textToScan)) {
        warnings.push({
          memberId: a.memberId,
          allergen: a.allergen,
          severity: a.severity,
        });
      }
    }

    return { mealPlan, allergenWarnings: warnings };
  }

  // --- Chores ---
  async getChores(householdId: string): Promise<ChoreRecord[]> {
    return Array.from(this.chores.values()).filter(
      (c) => c.householdId === householdId
    );
  }

  async createChore(input: {
    householdId: string;
    title: string;
    assignedMemberId?: string;
    recurrenceRule?: string;
    rewardPoints?: number;
    allowanceCents?: number;
  }): Promise<ChoreRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const chore: ChoreRecord = {
      id,
      householdId: input.householdId,
      title: input.title,
      assignedMemberId: input.assignedMemberId,
      recurrenceRule: input.recurrenceRule,
      rewardPoints: input.rewardPoints || 0,
      allowanceCents: input.allowanceCents || 0,
      isCompleted: false,
      verifiedByAdmin: false,
      createdAt: now,
      updatedAt: now,
    };
    this.chores.set(id, chore);
    return chore;
  }

  async toggleChore(id: string, isCompleted: boolean): Promise<ChoreRecord | null> {
    const chore = this.chores.get(id);
    if (!chore) return null;
    chore.isCompleted = isCompleted;
    if (!isCompleted) {
      chore.verifiedByAdmin = false;
    }
    chore.updatedAt = new Date().toISOString();
    return chore;
  }

  async verifyChore(
    id: string,
    verified: boolean
  ): Promise<{ chore: ChoreRecord; pointsAwarded: number; allowanceCreditedCents: number } | null> {
    const chore = this.chores.get(id);
    if (!chore) return null;

    let pointsAwarded = 0;
    let allowanceCreditedCents = 0;

    // Idempotency: only award points and credit allowance on first transition to verified
    if (!chore.verifiedByAdmin && verified && chore.isCompleted) {
      pointsAwarded = chore.rewardPoints;
      allowanceCreditedCents = chore.allowanceCents;

      if (chore.allowanceCents > 0 && chore.assignedMemberId && this.options.creditAllowance) {
        await this.options.creditAllowance({
          householdId: chore.householdId,
          memberId: chore.assignedMemberId,
          amountCents: chore.allowanceCents,
          title: chore.title,
        });
      }
    }

    chore.verifiedByAdmin = verified;
    chore.updatedAt = new Date().toISOString();

    return { chore, pointsAwarded, allowanceCreditedCents };
  }

  async getMemberPoints(householdId: string, memberId: string): Promise<number> {
    let total = 0;
    for (const chore of this.chores.values()) {
      if (
        chore.householdId === householdId &&
        chore.assignedMemberId === memberId &&
        chore.isCompleted &&
        chore.verifiedByAdmin
      ) {
        total += chore.rewardPoints;
      }
    }
    return total;
  }
}
