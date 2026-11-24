import React, { useState, useEffect } from 'react';
import { X, HeartPulse, Clock, User, Pill, FileText } from 'lucide-react';

export interface DoseFormData {
  patient: string;
  medication: string;
  dosage: string;
  time: string;
  note?: string;
}

export interface DoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: DoseFormData) => void | Promise<void>;
  isLoading?: boolean;
}

const PATIENTS = [
  'Grandma Martha',
  'Dad (Robert)',
  'Mom (Sarah)',
  'Teen (Alex)',
  'Child (Leo)',
];

export function DoseModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: DoseModalProps) {
  const [patient, setPatient] = useState('Grandma Martha');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('12:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPatient('Grandma Martha');
      setMedication('');
      setDosage('');
      setTime('12:00');
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.trim() || !medication.trim() || !dosage.trim()) {
      setError('Please provide patient, medication, and dosage.');
      return;
    }

    setError(null);
    onSubmit?.({
      patient,
      medication,
      dosage,
      time,
      note: note.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dose-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h2 id="dose-modal-title" className="text-base font-semibold tracking-tight">
                Record Medication Intake
              </h2>
              <p className="text-xs text-slate-400">Log prescription adherence to health timeline</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Patient Selector */}
          <div>
            <label htmlFor="dose-patient" className="block text-xs font-medium text-slate-300 mb-1.5">
              Household Member
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <select
                id="dose-patient"
                data-testid="dose-patient-select"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer"
              >
                {PATIENTS.map((p) => (
                  <option key={p} value={p} className="bg-slate-900 text-slate-100">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medication Name & Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dose-medication" className="block text-xs font-medium text-slate-300 mb-1.5">
                Medication Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Pill className="h-4 w-4" />
                </div>
                <input
                  id="dose-medication"
                  data-testid="dose-medication-input"
                  type="text"
                  placeholder="e.g. Lisinopril"
                  required
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dose-dosage" className="block text-xs font-medium text-slate-300 mb-1.5">
                Dosage
              </label>
              <input
                id="dose-dosage"
                data-testid="dose-dosage-input"
                type="text"
                placeholder="e.g. 10mg"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* Intake Time */}
          <div>
            <label htmlFor="dose-time" className="block text-xs font-medium text-slate-300 mb-1.5">
              Intake Time
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="h-4 w-4" />
              </div>
              <input
                id="dose-time"
                data-testid="dose-time-input"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label htmlFor="dose-note" className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <input
                id="dose-note"
                data-testid="dose-note-input"
                type="text"
                placeholder="e.g., Taken with food"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white transition-all shadow-md shadow-cyan-900/30"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Recording...' : 'Record Dose'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
