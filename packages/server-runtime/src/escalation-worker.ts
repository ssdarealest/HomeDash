import { HealthService } from './health-service';

export interface ExpectedDose {
  medicationId: string;
  householdId: string;
  scheduledAt: string;
}

export interface EscalationAlert {
  householdId: string;
  medicationId: string;
  medicationName: string;
  patientMemberId: string;
  scheduledAt: string;
  escalatedAt: string;
}

export interface EscalationWorkerOptions {
  healthService: HealthService;
  onEscalate?: (alert: EscalationAlert) => Promise<void>;
  escalationThresholdMinutes?: number;
}

export class EscalationWorker {
  private healthService: HealthService;
  private onEscalate?: (alert: EscalationAlert) => Promise<void>;
  private thresholdMinutes: number;
  private expectedDoses: ExpectedDose[] = [];
  private escalatedDoseKeys = new Set<string>();

  constructor(opts: EscalationWorkerOptions) {
    this.healthService = opts.healthService;
    this.onEscalate = opts.onEscalate;
    this.thresholdMinutes = opts.escalationThresholdMinutes ?? 30;
  }

  registerExpectedDose(dose: ExpectedDose): void {
    this.expectedDoses.push(dose);
    if (this.expectedDoses.length > 5000) {
      this.expectedDoses.splice(0, 1000);
    }
  }

  async evaluateMissedDoses(currentDate: Date = new Date()): Promise<{
    escalatedCount: number;
    alerts: EscalationAlert[];
  }> {
    const alerts: EscalationAlert[] = [];
    const nowTime = currentDate.getTime();
    const cutoffTime = nowTime - this.thresholdMinutes * 60 * 1000;

    for (const expected of this.expectedDoses) {
      const scheduledTime = new Date(expected.scheduledAt).getTime();
      const key = `${expected.medicationId}_${expected.scheduledAt}`;

      if (scheduledTime > cutoffTime || this.escalatedDoseKeys.has(key)) {
        continue;
      }

      // Check logs for this specific medication
      const logs = await this.healthService.getMedicationLogs(
        expected.householdId,
        expected.medicationId
      );

      // Check if this specific dose was taken (within 45m tolerance of scheduled dose time)
      const isTaken = logs.some((l) => {
        if (l.status !== 'taken') return false;
        const logTime = new Date(l.scheduledAt).getTime();
        return Math.abs(logTime - scheduledTime) < 45 * 60 * 1000;
      });
      if (isTaken) {
        continue;
      }

      // Check if this specific dose was snoozed with active window
      const activeSnooze = logs.find((l) => {
        if (l.status === 'snoozed' && l.takenAt) {
          const logScheduledTime = new Date(l.scheduledAt).getTime();
          const matchesDose = Math.abs(logScheduledTime - scheduledTime) < 45 * 60 * 1000;
          return matchesDose && new Date(l.takenAt).getTime() > nowTime;
        }
        return false;
      });

      if (activeSnooze) {
        // Active snooze suppresses escalation
        continue;
      }

      // Escalation condition met: persist escalation log into health service
      await this.healthService.recordEscalatedLog(
        expected.householdId,
        expected.medicationId,
        expected.scheduledAt
      );

      const med = await this.healthService.getMedication(expected.medicationId);
      const alert: EscalationAlert = {
        householdId: expected.householdId,
        medicationId: expected.medicationId,
        medicationName: med?.name || 'Unknown Medication',
        patientMemberId: med?.patientMemberId || '',
        scheduledAt: expected.scheduledAt,
        escalatedAt: new Date(nowTime).toISOString(),
      };

      this.escalatedDoseKeys.add(key);
      if (this.escalatedDoseKeys.size > 5000) {
        this.escalatedDoseKeys.clear();
      }
      alerts.push(alert);

      if (this.onEscalate) {
        await this.onEscalate(alert);
      }
    }

    return {
      escalatedCount: alerts.length,
      alerts,
    };
  }
}
