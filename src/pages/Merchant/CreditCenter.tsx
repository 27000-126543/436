import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  ShieldCheck,
  Filter,
  ChevronDown,
  FileText,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatDate, getCreditLevelColor, calculateCreditLevel } from '@/utils/format';

export default function MerchantCreditCenter() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { creditRecords } = useComplaintStore();

  const merchantId = currentUser?.id ?? 'merchant_001';
  const creditScore = currentUser?.creditScore ?? 87;
  const creditLevel = currentUser?.creditLevel ?? calculateCreditLevel(creditScore);
  const isFrozen = currentUser?.isFrozen ?? false;
  const merchantName = currentUser?.merchantName ?? '优品数码旗舰店';

  const [typeFilter, setTypeFilter] = useState<string>('all');

  const allRecords = useMemo(
    () => creditRecords.filter((r) => r.merchantId === merchantId),
    [creditRecords, merchantId]
  );

  const filteredRecords = useMemo(() => {
    if (typeFilter === 'all') return allRecords;
    return allRecords.filter((r) => r.type === typeFilter);
  }, [allRecords, typeFilter]);

  const totalDeducted = allRecords
    .filter((r) => r.type === 'deduct')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalAdded = allRecords
    .filter((r) => r.type === 'add')
    .reduce((sum, r) => sum + r.amount, 0);

  const levelThresholds = {
    A: { min: 90, max: 100, label: '优质商家', desc: '享流量扶持、降保证金等特权' },
    B: { min: 75, max: 89, label: '良好商家', desc: '正常经营权限，需保持服务质量' },
    C: { min: 60, max: 74, label: '合格商家', desc: '部分权限受限，建议尽快提升' },
    D: { min: 0, max: 59, label: '风险商家', desc: '冻结新商品上架，限制活动报名' },
  };

  const currentLevelInfo = levelThresholds[creditLevel];
  const nextLevel = creditLevel === 'A' ? null : creditLevel === 'B' ? 'A' : creditLevel === 'C' ? 'B' : 'C';
  const nextLevelInfo = nextLevel ? levelThresholds[nextLevel as keyof typeof levelThresholds] : null;
  const toNextLevel = nextLevelInfo ? nextLevelInfo.min - creditScore : 0;
  const toFreeze = Math.max(creditScore - 60, 0);

  const creditProgress = Math.min(((creditScore - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min + 1)) * 100, 100);
  const freezeProgress = Math.min(((creditScore - 60) / 40) * 100, 100);

  const circumference = 2 * Math.PI * 72;
  const strokeDashoffset = circumference - ((creditScore / 100) * circumference);

  const levelOrder = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">信用中心</h1>
          <p className="text-neutral-500 mt-1">{merchantName} · 信用评级管理</p>
        </div>
      </div>

      {isFrozen && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-danger-800">账户已被限制</h3>
            <p className="text-danger-700 text-sm mt-1">
              您的信用分为 {creditScore} 分，已低于冻结阈值（60分）。新商品上架、活动报名等权限已被限制。
              请提升服务质量，通过良好经营记录逐步恢复信用分。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
          <div className="relative flex items-center gap-8">
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="white"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{creditScore}</span>
                <span className="text-sm text-white/70 mt-1">当前信用分</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full">
                  <Award className="w-4 h-4 text-white" />
                  <span className="font-semibold">{creditLevel} 级 · {currentLevelInfo.label}</span>
                </div>
                {creditScore >= 90 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-warning-400/30 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-warning-200" />
                    <span className="text-xs font-medium text-warning-100">优质认证</span>
                  </div>
                )}
              </div>
              <p className="text-white/80 text-sm">{currentLevelInfo.desc}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-white/70">本级进度（{currentLevelInfo.min}-{currentLevelInfo.max}分）</span>
                    <span className="font-medium">
                      {creditLevel === 'A' ? '已达最高级' : `距离${nextLevel}级还需 ${toNextLevel} 分`}
                    </span>
                  </div>
                  <div className="w-full bg-white/15 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-white rounded-full h-2.5 transition-all duration-700"
                      style={{ width: `${creditProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-white/50">
                    <span>{currentLevelInfo.min}分</span>
                    <span>{currentLevelInfo.max}分</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-white/70 flex items-center gap-1">
                      距离冻结线
                      <Info className="w-3.5 h-3.5" />
                    </span>
                    <span className={`font-medium ${toFreeze <= 5 ? 'text-warning-300' : ''}`}>
                      {toFreeze} 分安全区间
                    </span>
                  </div>
                  <div className="w-full bg-white/15 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`rounded-full h-2.5 transition-all duration-700 ${toFreeze <= 5 ? 'bg-warning-400' : 'bg-success-400'}`}
                      style={{ width: `${Math.max(freezeProgress, 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-white/50">
                    <span>60分（冻结线）</span>
                    <span>100分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="w-11 h-11 rounded-lg bg-danger-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-danger-500" />
            </div>
            <p className="text-sm text-neutral-500 mt-4">累计扣减</p>
            <p className="text-3xl font-bold text-danger-600 mt-1">{totalDeducted}</p>
            <p className="text-xs text-neutral-400 mt-2">共 {allRecords.filter(r => r.type === 'deduct').length} 次</p>
          </div>
          <div className="card p-5">
            <div className="w-11 h-11 rounded-lg bg-success-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-success-500 rotate-180" />
            </div>
            <p className="text-sm text-neutral-500 mt-4">累计奖励</p>
            <p className="text-3xl font-bold text-success-600 mt-1">+{totalAdded}</p>
            <p className="text-xs text-neutral-400 mt-2">共 {allRecords.filter(r => r.type === 'add').length} 次</p>
          </div>
          <div className="card p-5 col-span-2 bg-neutral-50/50">
            <h4 className="font-medium text-neutral-800 mb-3">信用等级说明</h4>
            <div className="space-y-2">
              {levelOrder.map((lv) => {
                const info = levelThresholds[lv];
                return (
                  <div
                    key={lv}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      lv === creditLevel ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-white'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${getCreditLevelColor(lv)}`}
                    >
                      {lv}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">{info.label}</p>
                      <p className="text-xs text-neutral-500 truncate">{info.desc}</p>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {info.min}-{info.max}分
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="card p-5 xl:col-span-1">
          <h3 className="font-semibold text-neutral-800 mb-4">快速了解</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="font-medium text-primary-700 mb-1">如何提升信用分？</p>
              <p className="text-xs text-primary-600">
                保持30天无投诉可获得奖励分，积极配合调解、及时赔付也可获得额外加分。
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <p className="font-medium text-warning-700 mb-1">什么情况会扣分？</p>
              <p className="text-xs text-warning-600">
                仲裁裁定商家有责、超时未回应投诉、虚假宣传、质量问题等都会扣减信用分。
              </p>
            </div>
            <div className="p-3 bg-danger-50 rounded-lg">
              <p className="font-medium text-danger-700 mb-1">低于60分的后果</p>
              <p className="text-xs text-danger-600">
                新商品上架权限冻结、限制营销活动报名、搜索权重降低、保证金上浮等。
              </p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden xl:col-span-3">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">信用变动记录</h3>
              <span className="badge badge-neutral">{filteredRecords.length} 条</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input pr-10 appearance-none text-sm min-w-32 !py-1.5"
                >
                  <option value="all">全部类型</option>
                  <option value="add">加分记录</option>
                  <option value="deduct">扣分记录</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
              <button
                onClick={() => setTypeFilter('all')}
                className="btn btn-ghost !px-3 !py-1.5 text-sm inline-flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                重置
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-36">变动时间</th>
                  <th className="table-header w-24">类型</th>
                  <th className="table-header w-24 text-right">变动分数</th>
                  <th className="table-header">变动原因</th>
                  <th className="table-header w-40">关联投诉</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-neutral-400">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>暂无信用变动记录</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="table-cell">
                        <div>
                          <p className="text-sm text-neutral-700">
                            {formatDate(record.createdAt, 'date')}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {formatDate(record.createdAt, 'time')}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${
                            record.type === 'add' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {record.type === 'add' ? '加分' : '扣分'}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span
                          className={`text-lg font-bold ${
                            record.type === 'add' ? 'text-success-600' : 'text-danger-600'
                          }`}
                        >
                          {record.type === 'add' ? '+' : '-'}
                          {record.amount}
                        </span>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm text-neutral-700">{record.reason}</p>
                      </td>
                      <td className="table-cell">
                        {record.complaintId ? (
                          <button
                            onClick={() => navigate(`/complaints/${record.complaintId}`)}
                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-mono"
                          >
                            {record.complaintId}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
