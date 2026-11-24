import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  PlusCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface MedicationDoseItem {
  id: string;
  time: string;
  memberName: string;
  medicationName: string;
  dosage: string;
  status: 'taken' | 'scheduled' | 'snoozed';
  takenAt?: string;
  instructions?: string;
}

export interface MedicationTimelineCardProps {
  doses?: MedicationDoseItem[];
  onLogDose?: (doseId: string) => void;
  className?: string;
}

const DEFAULT_DOSES: MedicationDoseItem[] = [
  {
    id: 'dose-1',
    time: '08:00 AM',
    memberName: 'Robert Miller',
    medicationName: 'Metformin',
    dosage: '500mg',
    status: 'taken',
    takenAt: '08:05 AM',
    instructions: 'Take with morning meal',
  },
  {
    id: 'dose-2',
    time: '12:30 PM',
    memberName: 'Robert Miller',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    status: 'scheduled',
    instructions: 'Monitor blood pressure before dose',
  },
  {
    id: 'dose-3',
    time: '08:00 PM',
    memberName: 'Robert Miller',
    medicationName: 'Vitamin D3',
    dosage: '2000 IU',
    status: 'scheduled',
    instructions: 'Take with evening meal',
  },
  {
    id: 'dose-4',
    time: '09:00 PM',
    memberName: 'Sarah Miller',
    medicationName: 'Magnesium Glycinate',
    dosage: '400mg',
    status: 'scheduled',
    instructions: 'Take before sleep',
  },
];

export function MedicationTimelineCard({
  doses: propDoses,
  onLogDose,
  className = '',
}: MedicationTimelineCardProps) {
  const { surface } = useTheme();
  const [internalDoses, setInternalDoses] = useState<MedicationDoseItem[]>(DEFAULT_DOSES);

  const doses = propDoses ?? internalDoses;

  const handleLogDose = (doseId: string) => {
    if (onLogDose) {
      onLogDose(doseId);
    }
    if (!propDoses) {
      setInternalDoses((prev) =>
        prev.map((d) =>
          d.id === doseId
            ? {
                ...d,
                status: 'taken',
                takenAt: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }
            : d
        )
      );
    }
  };

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-100 shadow-xl'
    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md';

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const totalCount = doses.length;

  return (
    <div
      data-testid="medication-timeline-card"
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Pill className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Medication Schedule</h3>
            <p className="text-xs text-slate-400">Daily Regimen & Adherence</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/50 px-2.5 py-1 rounded-full border border-white/5">
          <Calendar className="h-3 w-3 text-blue-400" />
          <span>
            {takenCount} of {totalCount} completed
          </span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="py-3 space-y-3">
        {doses.map((dose, idx) => {
          const isTaken = dose.status === 'taken';
          const isSnoozed = dose.status === 'snoozed';

          return (
            <div
              key={dose.id}
              className="relative flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Timeline Indicator */}
              <div className="flex flex-col items-center mt-0.5">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isTaken
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isSnoozed
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {isTaken ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isSnoozed ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>

              {/* Medication Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                      {dose.medicationName}
                    </span>
                    <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {dose.dosage}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {dose.time}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>{dose.memberName}</span>
                  </div>
                  {dose.takenAt && (
                    <span className="text-[11px] text-emerald-400">
                      Taken at {dose.takenAt}
                    </span>
                  )}
                </div>

                {dose.instructions && (
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {dose.instructions}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="ml-2 flex items-center self-center">
                {isTaken ? (
                  <span className="text-[11px] font-medium text-emerald-400 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    Taken
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLogDose(dose.id)}
                    aria-label={`Log Dose for ${dose.medicationName}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition-all shadow-sm shadow-blue-500/20"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>Log Dose</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
