import { create } from 'zustand';
import type { RuleConfig, ReportData } from '../types';
import { mockRules, mockReportData } from '../mock/data';
import { generateId } from '../utils/format';

interface ConfigState {
  rules: RuleConfig[];
  reportData: ReportData[];
  getRulesByCategory: (category: RuleConfig['category']) => RuleConfig[];
  updateRule: (id: string, value: string | number | boolean, updatedBy: string) => void;
  addRule: (rule: Omit<RuleConfig, 'id' | 'updatedAt'>) => void;
  deleteRule: (id: string) => void;
  getReportByPeriod: (period: string) => ReportData[];
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  rules: mockRules,
  reportData: mockReportData,

  getRulesByCategory: (category) => get().rules.filter(r => r.category === category),

  updateRule: (id, value, updatedBy) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === id ? { ...r, value, updatedAt: new Date().toISOString(), updatedBy } : r
      ),
    }));
  },

  addRule: (rule) => {
    set(state => ({
      rules: [{ ...rule, id: generateId('rule'), updatedAt: new Date().toISOString() }, ...state.rules],
    }));
  },

  deleteRule: (id) => {
    set(state => ({ rules: state.rules.filter(r => r.id !== id) }));
  },

  getReportByPeriod: (period) => get().reportData.filter(r => r.period === period),
}));
