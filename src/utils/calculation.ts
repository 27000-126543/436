import type { Complaint, ComplaintType } from '../types';
import { mockRules } from '../mock/data';

export const getCompensationRules = (type: ComplaintType) => {
  const categoryRules = mockRules.filter(r => r.category === 'compensation' && r.subCategory === type);
  const defaultRules = mockRules.filter(r => r.category === 'compensation' && r.subCategory === 'quality');
  const rules = categoryRules.length > 0 ? categoryRules : defaultRules;
  
  return {
    maxMultiple: Number(rules.find(r => r.key === 'maxMultiple')?.value || 3),
    minCompensation: Number(rules.find(r => r.key === 'minCompensation')?.value || 50),
  };
};

export const getCreditDeductRules = () => {
  const deductRules = mockRules.filter(r => r.category === 'credit' && r.subCategory === 'deduction');
  return {
    full: Number(deductRules.find(r => r.key === 'fullLiability')?.value || 10),
    partial: Number(deductRules.find(r => r.key === 'partialLiability')?.value || 5),
    timeout: Number(deductRules.find(r => r.key === 'timeout')?.value || 3),
  };
};

export const getCreditThreshold = (): number => {
  const threshold = mockRules.find(r => r.category === 'credit' && r.key === 'freezeScore');
  return Number(threshold?.value || 60);
};

export const getHighAmountThreshold = (): number => {
  const threshold = mockRules.find(r => r.category === 'credit' && r.key === 'highAmountMultiple');
  return Number(threshold?.value || 10000);
};

export const getTimelineRules = () => {
  const timelineRules = mockRules.filter(r => r.category === 'timeline');
  return {
    merchantResponseHours: Number(timelineRules.find(r => r.subCategory === 'merchant_response')?.value || 48),
    arbitrationHours: Number(timelineRules.find(r => r.subCategory === 'arbitration')?.value || 72),
    mediationHours: Number(timelineRules.find(r => r.subCategory === 'mediation')?.value || 24),
  };
};

export const calculateCompensation = (
  complaint: Complaint,
  liability: 'consumer' | 'merchant' | 'both',
  merchantLiabilityPercent: number
): number => {
  const { amount } = complaint;
  const rules = getCompensationRules(complaint.type);
  const maxMultiple = rules.maxMultiple;
  const minCompensation = rules.minCompensation;

  let compensation = 0;

  switch (liability) {
    case 'merchant':
      compensation = amount;
      break;
    case 'both':
      compensation = amount * (merchantLiabilityPercent / 100);
      break;
    case 'consumer':
      compensation = 0;
      break;
  }

  compensation = Math.min(compensation, amount * maxMultiple);
  compensation = Math.max(compensation, liability !== 'consumer' ? minCompensation : 0);

  return Math.round(compensation * 100) / 100;
};

export const calculateCreditChange = (
  currentScore: number,
  complaint: Complaint,
  liability: 'consumer' | 'merchant' | 'both'
): { newScore: number; deductAmount: number; isFrozen: boolean } => {
  const deductRules = getCreditDeductRules();
  const highAmountThreshold = getHighAmountThreshold();
  const freezeThreshold = getCreditThreshold();

  let deductAmount = 0;

  if (liability === 'merchant') {
    deductAmount = deductRules.full;
  } else if (liability === 'both') {
    deductAmount = deductRules.partial;
  }

  if (complaint.amount >= highAmountThreshold) {
    deductAmount *= 2;
  }

  if (complaint.merchantTimeout) {
    deductAmount += deductRules.timeout;
  }

  const newScore = Math.max(0, currentScore - deductAmount);
  const isFrozen = newScore < freezeThreshold;

  return { newScore, deductAmount, isFrozen };
};

export const determinePriority = (amount: number, type: ComplaintType): 'high' | 'medium' | 'low' => {
  const highPriorityTypes: ComplaintType[] = ['quality', 'misrepresentation'];
  
  if (amount >= 10000 || (highPriorityTypes.includes(type) && amount >= 5000)) {
    return 'high';
  }
  if (amount >= 1000 || highPriorityTypes.includes(type)) {
    return 'medium';
  }
  return 'low';
};

export const autoAssignService = (
  type: ComplaintType,
  priority: 'high' | 'medium' | 'low',
  services: Array<{ id: string; isSenior?: boolean; load: number; name: string }>
): { id: string; name: string } | null => {
  let eligibleServices = services;
  
  if (priority === 'high') {
    eligibleServices = services.filter(s => s.isSenior);
    if (eligibleServices.length === 0) {
      eligibleServices = services;
    }
  }

  if (eligibleServices.length === 0) return null;

  const sorted = [...eligibleServices].sort((a, b) => a.load - b.load);
  return { id: sorted[0].id, name: sorted[0].name };
};

export const autoAssignArbitrator = (
  arbitrators: Array<{ id: string; isSenior?: boolean; load: number; name: string; excludeId?: string }>,
  excludeId?: string
): { id: string; name: string } | null => {
  let eligibleArbitrators = arbitrators.filter(a => a.id !== excludeId);

  if (eligibleArbitrators.length === 0) return null;

  const sorted = [...eligibleArbitrators].sort((a, b) => a.load - b.load);
  return { id: sorted[0].id, name: sorted[0].name };
};
