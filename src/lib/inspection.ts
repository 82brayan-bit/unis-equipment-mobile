export type CheckResult = 'pass' | 'fail' | 'na';

export type CheckItem = {
  key: string;
  label: string;
  result: CheckResult;
};

/** Default equipment safety checklist (edit to match your facility's form). */
export const DEFAULT_CHECKLIST: Omit<CheckItem, 'result'>[] = [
  { key: 'tires', label: 'Tires / wheels' },
  { key: 'brakes', label: 'Brakes' },
  { key: 'lights', label: 'Lights & horn' },
  { key: 'fluids', label: 'Fluid levels' },
  { key: 'hydraulics', label: 'Hydraulics / mast' },
  { key: 'forks', label: 'Forks / attachments' },
  { key: 'battery', label: 'Battery / fuel' },
  { key: 'safety', label: 'Seatbelt & safety devices' },
  { key: 'leaks', label: 'Leaks' },
  { key: 'cleanliness', label: 'Cleanliness / damage' },
];

export const makeChecklist = (): CheckItem[] =>
  DEFAULT_CHECKLIST.map((i) => ({ ...i, result: 'pass' }));

export const overallStatus = (items: CheckItem[]): 'pass' | 'fail' =>
  items.some((i) => i.result === 'fail') ? 'fail' : 'pass';
