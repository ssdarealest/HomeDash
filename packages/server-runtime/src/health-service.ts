import {
  MedicationTake,
  VitalsLogCreate,
  MedicalAllergyCreate,
} from '@homedash/protocol';

export interface MedicationRecord {
  id: string;
  householdId: string;
  patientMemberId: string;
  name: string;
  dosage: string;
  scheduleCron: string;
  remainingPills: number;
  refillThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLogRecord {
  id: string;
  householdId: string;
  medicationId: string;
  scheduledAt: string;
  takenAt?: string;
  status: 'taken' | 'skipped' | 'snoozed' | 'missed_escalated';
  photoProofUrl?: string;
  recordedByMemberId?: string;
  createdAt: string;
}

export interface CaregiverShiftRecord {
  id: string;
  householdId: string;
  patientMemberId: string;
  assignedMemberId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'swapped' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalsLogRecord {
  id: string;
  householdId: string;
  memberId: string;
  vitalType: string;
  valuePrimary: number;
  valueSecondary?: number;
  unit: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

export interface MedicalAllergyRecord {
  id: string;
  householdId: string;
  memberId: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'critical';
  reactionDescription?: string;
  createdAt: string;
}

export class HealthService {
  private medications = new Map<string, MedicationRecord>();
  private medicationLogs = new Map<string, MedicationLogRecord>();
  private shifts = new Map<string, CaregiverShiftRecord>();
  private vitals = new Map<string, VitalsLogRecord>();
  private allergies = new Map<string, MedicalAllergyRecord>();

  // --- Medications ---
  async getMedications(householdId: string): Promise<MedicationRecord[]> {
    return Array.from(this.medications.values()).filter(
      (m) => m.householdId === householdId
    );
  }

  async getMedication(id: string): Promise<MedicationRecord | null> {
    return this.medications.get(id) || null;
  }

  async createMedication(input: {
    householdId: string;
    patientMemberId: string;
    name: string;
    dosage: string;
    scheduleCron: string;
    remainingPills?: number;
    refillThreshold?: number;
    isActive?: boolean;
  }): Promise<MedicationRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: MedicationRecord = {
      id,
      householdId: input.householdId,
      patientMemberId: input.patientMemberId,
      name: input.name,
      dosage: input.dosage,
      scheduleCron: input.scheduleCron,
      remainingPills: input.remainingPills ?? 0,
      refillThreshold: input.refillThreshold ?? 5,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.medications.set(id, record);
    return record;
  }

  async takeMedication(
    medicationId: string,
    recordedByMemberId?: string,
    input?: MedicationTake
  ): Promise<{
    log: MedicationLogRecord;
    remainingPills: number;
    lowInventoryWarning: boolean;
  } | null> {
    const med = this.medications.get(medicationId);
    if (!med) return null;

    if (med.remainingPills > 0) {
      med.remainingPills -= 1;
    }
    med.updatedAt = new Date().toISOString();

    const logId = crypto.randomUUID();
    const now = new Date().toISOString();
    const doseTime = input?.takenAt || now;
    const log: MedicationLogRecord = {
      id: logId,
      householdId: med.householdId,
      medicationId: med.id,
      scheduledAt: doseTime,
      takenAt: doseTime,
      status: 'taken',
      photoProofUrl: input?.photoProofUrl,
      recordedByMemberId,
      createdAt: now,
    };
    this.medicationLogs.set(logId, log);

    const lowInventoryWarning = med.remainingPills <= med.refillThreshold;
    return {
      log,
      remainingPills: med.remainingPills,
      lowInventoryWarning,
    };
  }

  async snoozeMedication(
    medicationId: string,
    recordedByMemberId?: string,
    snoozeMinutes: number = 15
  ): Promise<MedicationLogRecord | null> {
    const med = this.medications.get(medicationId);
    if (!med) return null;

    const logId = crypto.randomUUID();
    const now = new Date().toISOString();
    const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
    const log: MedicationLogRecord = {
      id: logId,
      householdId: med.householdId,
      medicationId: med.id,
      scheduledAt: now,
      takenAt: snoozeUntil, // using takenAt to represent snooze target expiration
      status: 'snoozed',
      recordedByMemberId,
      createdAt: now,
    };
    this.medicationLogs.set(logId, log);
    return log;
  }

  async recordEscalatedLog(
    householdId: string,
    medicationId: string,
    scheduledAt: string
  ): Promise<MedicationLogRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const log: MedicationLogRecord = {
      id,
      householdId,
      medicationId,
      scheduledAt,
      status: 'missed_escalated',
      createdAt: now,
    };
    this.medicationLogs.set(id, log);
    return log;
  }

  async getMedicationLogs(
    householdId: string,
    medicationId?: string
  ): Promise<MedicationLogRecord[]> {
    return Array.from(this.medicationLogs.values()).filter(
      (l) => l.householdId === householdId && (!medicationId || l.medicationId === medicationId)
    );
  }

  // --- Caregiver Shifts ---
  async getShifts(householdId: string): Promise<CaregiverShiftRecord[]> {
    return Array.from(this.shifts.values()).filter(
      (s) => s.householdId === householdId
    );
  }

  async createShift(input: {
    householdId: string;
    patientMemberId: string;
    assignedMemberId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<CaregiverShiftRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const shift: CaregiverShiftRecord = {
      id,
      householdId: input.householdId,
      patientMemberId: input.patientMemberId,
      assignedMemberId: input.assignedMemberId,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'scheduled',
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.shifts.set(id, shift);
    return shift;
  }

  async swapShift(
    id: string,
    targetMemberId: string,
    notes?: string
  ): Promise<CaregiverShiftRecord | null> {
    const shift = this.shifts.get(id);
    if (!shift) return null;
    shift.assignedMemberId = targetMemberId;
    shift.status = 'swapped';
    if (notes) {
      shift.notes = shift.notes ? `${shift.notes}\n${notes}` : notes;
    }
    shift.updatedAt = new Date().toISOString();
    return shift;
  }

  async checkinShift(id: string, notes?: string): Promise<CaregiverShiftRecord | null> {
    const shift = this.shifts.get(id);
    if (!shift) return null;
    shift.status = 'in_progress';
    if (notes) {
      shift.notes = shift.notes ? `${shift.notes}\n${notes}` : notes;
    }
    shift.updatedAt = new Date().toISOString();
    return shift;
  }

  // --- Vitals ---
  async getVitals(
    householdId: string,
    memberId?: string,
    vitalType?: string
  ): Promise<VitalsLogRecord[]> {
    return Array.from(this.vitals.values()).filter(
      (v) =>
        v.householdId === householdId &&
        (!memberId || v.memberId === memberId) &&
        (!vitalType || v.vitalType === vitalType)
    );
  }

  async logVitals(input: VitalsLogCreate & { householdId: string }): Promise<VitalsLogRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: VitalsLogRecord = {
      id,
      householdId: input.householdId,
      memberId: input.memberId,
      vitalType: input.vitalType,
      valuePrimary: input.valuePrimary,
      valueSecondary: input.valueSecondary,
      unit: input.unit,
      notes: input.notes,
      recordedAt: input.recordedAt || now,
      createdAt: now,
    };
    this.vitals.set(id, record);
    return record;
  }

  async getVitalsTrends(
    householdId: string,
    memberId: string,
    vitalType: string
  ): Promise<{
    count: number;
    avgPrimary: number;
    minPrimary: number;
    maxPrimary: number;
    latest: VitalsLogRecord | null;
  }> {
    const records = (await this.getVitals(householdId, memberId, vitalType)).sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    if (records.length === 0) {
      return { count: 0, avgPrimary: 0, minPrimary: 0, maxPrimary: 0, latest: null };
    }

    const primaries = records.map((r) => r.valuePrimary);
    const sum = primaries.reduce((acc, v) => acc + v, 0);
    const avgPrimary = Math.round((sum / primaries.length) * 100) / 100;
    let minPrimary = primaries[0];
    let maxPrimary = primaries[0];
    for (const val of primaries) {
      if (val < minPrimary) minPrimary = val;
      if (val > maxPrimary) maxPrimary = val;
    }

    return {
      count: records.length,
      avgPrimary,
      minPrimary,
      maxPrimary,
      latest: records[0],
    };
  }

  // --- Allergies ---
  async getAllergies(
    householdId: string,
    memberId?: string
  ): Promise<MedicalAllergyRecord[]> {
    return Array.from(this.allergies.values()).filter(
      (a) => a.householdId === householdId && (!memberId || a.memberId === memberId)
    );
  }

  async createAllergy(
    input: MedicalAllergyCreate & { householdId: string }
  ): Promise<MedicalAllergyRecord> {
    const id = crypto.randomUUID();
    const record: MedicalAllergyRecord = {
      id,
      householdId: input.householdId,
      memberId: input.memberId,
      allergen: input.allergen,
      severity: input.severity,
      reactionDescription: input.reactionDescription,
      createdAt: new Date().toISOString(),
    };
    this.allergies.set(id, record);
    return record;
  }
}
