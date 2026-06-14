import { useState, useMemo, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Clock,
  Shield,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Scale,
  Zap,
} from 'lucide-react';
import { useConfigStore } from '@/store/configStore';
import { useAuthStore } from '@/store/authStore';
import type { RuleConfig } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = 'compensation' | 'timeline' | 'credit';

const tabs: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'compensation', label: '赔付规则', icon: <DollarSign size={18} />, desc: '配置各类型投诉的赔付倍数与最低金额' },
  { key: 'timeline', label: '时效配置', icon: <Clock size={18} />, desc: '配置各环节处理时效要求' },
  { key: 'credit', label: '信用阈值', icon: <Shield size={18} />, desc: '配置信用分扣减规则与冻结阈值' },
];

export default function RulesConfig() {
  const [activeTab, setActiveTab] = useState<TabKey>('compensation');
  const { rules, getRulesByCategory, updateRule } = useConfigStore();
  const { currentUser } = useAuthStore();
  const [editMap, setEditMap] = useState<Record<string, string | number | boolean>>({});
  const [savedToast, setSavedToast] = useState(false);
  const [changedCount, setChangedCount] = useState(0);

  const currentRules = useMemo(() => getRulesByCategory(activeTab), [activeTab, getRulesByCategory]);

  useEffect(() => {
    const map: Record<string, string | number | boolean> = {};
    currentRules.forEach(r => { map[r.id] = r.value; });
    setEditMap(map);
  }, [currentRules]);

  useEffect(() => {
    let count = 0;
    currentRules.forEach(r => {
      if (editMap[r.id] !== undefined && editMap[r.id] !== r.value) count++;
    });
    setChangedCount(count);
  }, [editMap, currentRules]);

  const handleValueChange = (ruleId: string, newValue: string | number | boolean) => {
    setEditMap(prev => ({ ...prev, [ruleId]: newValue }));
  };

  const handleSaveRule = (rule: RuleConfig) => {
    const newValue = editMap[rule.id] ?? rule.value;
    updateRule(rule.id, newValue, currentUser?.realName || '系统管理员');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleSaveAll = () => {
    currentRules.forEach(rule => {
      const newValue = editMap[rule.id] ?? rule.value;
      if (newValue !== rule.value) {
        updateRule(rule.id, newValue, currentUser?.realName || '系统管理员');
      }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleReset = () => {
    const map: Record<string, string | number | boolean> = {};
    currentRules.forEach(r => { map[r.id] = r.value; });
    setEditMap(map);
  };

  const getPreview = () => {
    if (activeTab === 'compensation') {
      const qualityMax = Number(editMap['rule_001'] ?? 3);
      const qualityMin = Number(editMap['rule_002'] ?? 50);
      const misMax = Number(editMap['rule_003'] ?? 4);
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
            <Eye size={14} className="text-primary-600" />
            规则效果预览
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-[10px] text-primary-600 font-medium">质量问题（¥1000订单）</p>
              <p className="text-lg font-bold text-primary-700 font-display mt-1">
                {formatCurrency(Math.min(1000 * qualityMax, 1000 * qualityMax))}
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">最高 {qualityMax} 倍赔付</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg border border-warning-100">
              <p className="text-[10px] text-warning-600 font-medium">质量问题（¥30小额）</p>
              <p className="text-lg font-bold text-warning-700 font-display mt-1">
                {formatCurrency(Math.max(qualityMin, 30))}
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">最低 ¥{qualityMin} 保障</p>
            </div>
            <div className="p-3 bg-danger-50 rounded-lg border border-danger-100 col-span-2">
              <p className="text-[10px] text-danger-600 font-medium">虚假宣传（¥200订单）</p>
              <p className="text-lg font-bold text-danger-700 font-display mt-1">
                {formatCurrency(200 * misMax)}
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">退一赔三，共 {misMax} 倍（含本金）</p>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'timeline') {
      const merchantH = Number(editMap['rule_004'] ?? 48);
      const arbH = Number(editMap['rule_005'] ?? 72);
      const medH = Number(editMap['rule_006'] ?? 24);
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
            <Eye size={14} className="text-primary-600" />
            时效流程预览
          </h4>
          <div className="relative py-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-neutral-200 -translate-y-1/2 rounded" />
            <div className="relative flex justify-between">
              {[
                { label: '商家响应', hours: merchantH, color: 'warning', icon: <Clock size={14} /> },
                { label: '客服调解', hours: medH, color: 'info', icon: <Scale size={14} /> },
                { label: '仲裁裁决', hours: arbH, color: 'primary', icon: <Zap size={14} /> },
              ].map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center z-10">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md',
                    step.color === 'warning' ? 'bg-warning-500' :
                    step.color === 'info' ? 'bg-info-500' : 'bg-primary-500'
                  )}>
                    {step.icon}
                  </div>
                  <p className="text-xs font-medium text-neutral-700 mt-2">{step.label}</p>
                  <p className={cn(
                    'text-sm font-bold mt-0.5',
                    step.color === 'warning' ? 'text-warning-600' :
                    step.color === 'info' ? 'text-info-600' : 'text-primary-600'
                  )}>
                    {step.hours}小时
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 flex items-start gap-2">
            <Info size={14} className="text-neutral-500 flex-shrink-0 mt-0.5" />
            全流程最长处理时效：{merchantH + medH + arbH} 小时（约 {Math.ceil((merchantH + medH + arbH) / 24)} 天）
          </div>
        </div>
      );
    }
    if (activeTab === 'credit') {
      const full = Number(editMap['rule_007'] ?? 10);
      const partial = Number(editMap['rule_008'] ?? 5);
      const timeout = Number(editMap['rule_009'] ?? 3);
      const freeze = Number(editMap['rule_010'] ?? 60);
      const highThres = Number(editMap['rule_011'] ?? 10000);
      return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
            <Eye size={14} className="text-primary-600" />
            信用分影响预览
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-danger-50 rounded-lg border border-danger-100 text-center">
              <p className="text-[10px] text-danger-600 font-medium">全责裁定</p>
              <p className="text-2xl font-bold text-danger-700 font-display mt-1">-{full}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">信用分</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg border border-warning-100 text-center">
              <p className="text-[10px] text-warning-600 font-medium">部分责任</p>
              <p className="text-2xl font-bold text-warning-700 font-display mt-1">-{partial}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">信用分</p>
            </div>
            <div className="p-3 bg-info-50 rounded-lg border border-info-100 text-center">
              <p className="text-[10px] text-info-600 font-medium">超时未响应</p>
              <p className="text-2xl font-bold text-info-700 font-display mt-1">-{timeout}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">额外扣减</p>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-700">商家信用分状态</span>
              <span className="text-xs text-neutral-500">冻结阈值 {freeze} 分</span>
            </div>
            <div className="relative h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-success-500 via-warning-500 to-danger-500 rounded-full transition-all"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-neutral-800 rounded"
                style={{ left: `${freeze}%` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-neutral-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                  冻结线
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-neutral-500">
              <span>0</span>
              <span className="text-danger-600 font-medium">冻结 {freeze}</span>
              <span>60 及格</span>
              <span>75 B级</span>
              <span>90 A级</span>
              <span>100</span>
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-700 flex items-start gap-2">
            <TrendingUp size={14} className="flex-shrink-0 mt-0.5" />
            高金额案件（≥ ¥{highThres.toLocaleString()}）信用扣减加倍，如全责扣 {full * 2} 分
          </div>
        </div>
      );
    }
    return null;
  };

  const getInputType = (rule: RuleConfig) => {
    if (typeof rule.value === 'boolean') return 'switch';
    if (typeof rule.value === 'number') return 'number';
    return 'text';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 font-display flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Settings size={22} className="text-white" />
            </div>
            规则配置中心
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            管理平台消费者保障规则，修改后即时生效
          </p>
        </div>
        <div className="flex items-center gap-3">
          {changedCount > 0 && (
            <button
              onClick={handleReset}
              className="btn btn-secondary gap-2"
            >
              <RotateCcw size={16} />
              重置修改 ({changedCount})
            </button>
          )}
          <button
            onClick={handleSaveAll}
            disabled={changedCount === 0}
            className="btn btn-primary gap-2"
          >
            <Save size={16} />
            保存全部修改
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-6 py-4 text-left transition-all border-b-2',
                activeTab === tab.key
                  ? 'border-primary-500 bg-white'
                  : 'border-transparent hover:bg-neutral-100/50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-neutral-200 text-neutral-600'
                )}>
                  {tab.icon}
                </div>
                <div>
                  <p className={cn(
                    'font-semibold text-sm',
                    activeTab === tab.key ? 'text-primary-700' : 'text-neutral-700'
                  )}>
                    {tab.label}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{tab.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-700">
                共 {currentRules.length} 项规则配置
              </h3>
              <span className="text-xs text-neutral-500">
                规则代码：{activeTab.toUpperCase()}_*
              </span>
            </div>

            <div className="space-y-3">
              {currentRules.map((rule) => {
                const inputType = getInputType(rule);
                const currentVal = editMap[rule.id] ?? rule.value;
                const isChanged = currentVal !== rule.value;
                const numericVal = typeof currentVal === 'number' ? currentVal :
                  typeof currentVal === 'string' ? Number(currentVal) : 0;

                return (
                  <div
                    key={rule.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      isChanged
                        ? 'bg-primary-50/50 border-primary-200 shadow-sm'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                            {rule.subCategory}.{rule.key}
                          </span>
                          {isChanged && (
                            <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                              已修改
                            </span>
                          )}
                          {rule.updatedAt && rule.updatedAt !== '' && (
                            <span className="text-[10px] text-neutral-500">
                              {formatDate(rule.updatedAt, 'date')} · {rule.updatedBy}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-800 mt-1.5">
                          {rule.description}
                        </h4>
                      </div>

                      <div className="flex-shrink-0 w-48">
                        {inputType === 'number' ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={numericVal}
                              onChange={(e) => handleValueChange(rule.id, Number(e.target.value))}
                              className="input text-sm"
                              min={0}
                              step={rule.key.includes('Percent') || rule.key.includes('Rate') ? 1 : 1}
                            />
                            {activeTab === 'credit' && (rule.key === 'freezeScore' || rule.key === 'highAmountMultiple') && (
                              <input
                                type="range"
                                min={0}
                                max={rule.key === 'freezeScore' ? 100 : 50000}
                                step={rule.key === 'freezeScore' ? 5 : 1000}
                                value={numericVal}
                                onChange={(e) => handleValueChange(rule.id, Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary-500"
                              />
                            )}
                          </div>
                        ) : inputType === 'switch' ? (
                          <button
                            type="button"
                            onClick={() => handleValueChange(rule.id, !currentVal)}
                            className={cn(
                              'relative inline-flex h-6 w-12 items-center rounded-full transition-colors',
                              currentVal ? 'bg-primary-500' : 'bg-neutral-300'
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                                currentVal ? 'translate-x-6' : 'translate-x-0.5'
                              )}
                            />
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={String(currentVal)}
                            onChange={(e) => handleValueChange(rule.id, e.target.value)}
                            className="input text-sm"
                          />
                        )}
                      </div>
                    </div>

                    {isChanged && (
                      <div className="mt-3 pt-3 border-t border-primary-100/60 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-neutral-500 flex items-center gap-1">
                            <span className="line-through">{String(rule.value)}</span>
                          </span>
                          <ArrowRight className="text-neutral-400" size={12} />
                          <span className="font-medium text-primary-700">{String(currentVal)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleValueChange(rule.id, rule.value)}
                            className="text-xs text-neutral-600 hover:text-neutral-800 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
                          >
                            撤销
                          </button>
                          <button
                            onClick={() => handleSaveRule(rule)}
                            className="btn btn-primary text-xs py-1 px-3 gap-1"
                          >
                            <Save size={12} />
                            保存
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5 border-primary-100 bg-gradient-to-b from-primary-50/30 to-white sticky top-6">
              {getPreview()}
            </div>

            <div className="card p-5">
              <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                <Info size={14} className="text-info-500" />
                规则说明
              </h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                {activeTab === 'compensation' && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>maxMultiple：消费者可获得的最高赔付倍数（含商品本金）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>minCompensation：小额订单的最低赔付保障金额</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-warning-500 mt-0.5 flex-shrink-0" />
                      <span>虚假宣传类投诉默认适用"退一赔三"规则</span>
                    </li>
                  </>
                )}
                {activeTab === 'timeline' && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>商家响应超时将默认支持消费者主张</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>调解时限用于督促客服专员高效处理</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-warning-500 mt-0.5 flex-shrink-0" />
                      <span>仲裁超时将自动升级至资深仲裁员处理</span>
                    </li>
                  </>
                )}
                {activeTab === 'credit' && (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>信用分低于冻结阈值将限制新商品上架</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-success-500 mt-0.5 flex-shrink-0" />
                      <span>高金额投诉扣分会加倍，以震慑大额违规</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-warning-500 mt-0.5 flex-shrink-0" />
                      <span>信用分变化会实时同步并通知商家</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className="flex items-center gap-2.5 px-5 py-3 bg-success-600 text-white rounded-xl shadow-elevation-3">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">规则保存成功，已即时生效</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowRight({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
