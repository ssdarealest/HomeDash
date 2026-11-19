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

      // Check logs for this medication
      const logs = await this.healthService.getMedicationLogs(
        expected.householdId,
        expected.medicationId
      );

      // Check if taken
      const isTaken = logs.some((l) => l.status === 'taken');
      if (isTaken) {
        continue;
      }

      // Check if snoozed with active window
      const activeSnooze = logs.find((l) => {
        if (l.status === 'snoozed' && l.takenAt) {
          return new Date(l.takenAt).getTime() > nowTime;
        }
        return false;
      });

      if (activeSnooze) {
        // Active snooze suppresses escalation
        continue;
      }

      // Escalation condition met
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
