import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileText,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Award,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatCurrency, formatDate, getCreditLevelColor, calculateCreditLevel } from '@/utils/format';
import { COMPLAINT_STATUS_LABELS } from '@/types';

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getMerchantComplaints, creditRecords, compensations } = useComplaintStore();

  const merchantId = currentUser?.id ?? 'merchant_001';
  const creditScore = currentUser?.creditScore ?? 87;
  const creditLevel = currentUser?.creditLevel ?? calculateCreditLevel(creditScore);
  const isFrozen = currentUser?.isFrozen ?? false;
  const merchantName = currentUser?.merchantName ?? '优品数码旗舰店';

  const complaints = useMemo(() => getMerchantComplaints(merchantId), [getMerchantComplaints, merchantId]);

  const pendingComplaints = complaints.filter(
    (c) => ['pending', 'assigned', 'mediating', 'arbitrating'].includes(c.status)
  );

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthComplaints = complaints.filter((c) => c.createdAt.startsWith(thisMonth));

  const merchantCreditRecords = creditRecords.filter((r) => r.merchantId === merchantId);
  const totalDeducted = merchantCreditRecords
    .filter((r) => r.type === 'deduct')
    .reduce((sum, r) => sum + r.amount, 0);

  const merchantCompensations = compensations.filter(
    (c) => complaints.find((cp) => cp.id === c.complaintId)
  );
  const totalCompensation = merchantCompensations.reduce((sum, c) => sum + c.amount, 0);

  const creditProgress = Math.min((creditScore / 100) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (creditProgress / 100) * circumference;

  const recentRecords = [...merchantCreditRecords].slice(0, 5);

  const statsCards = [
    {
      label: '待处理投诉',
      value: pendingComplaints.length,
      icon: FileText,
      color: 'text-info-600',
      bg: 'bg-info-50',
      path: '/merchant/complaints',
      trend: pendingComplaints.length > 0 ? '需及时处理' : '暂无待办',
    },
    {
      label: '本月投诉数',
      value: monthComplaints.length,
      icon: ShieldAlert,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      path: '/merchant/complaints/CP20250612001',
      trend: '较上月持平',
    },
    {
      label: '累计扣减信用分',
      value: totalDeducted,
      icon: TrendingDown,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      path: '/merchant/credit',
      trend: '注意信用风险',
    },
    {
      label: '累计赔付金额',
      value: formatCurrency(totalCompensation),
      icon: Wallet,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      path: '/merchant/compensations',
      trend: '赔付记录可查',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">商家工作台</h1>
          <p className="text-neutral-500 mt-1">
            {merchantName} · 欢迎回来，今天是 {formatDate(new Date().toISOString(), 'date')}
          </p>
        </div>
      </div>

      {isFrozen && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-danger-800">账户已冻结</h3>
            <p className="text-danger-700 text-sm mt-1">
              您的信用分已低于冻结阈值（60分），新商品上架权限已被限制。请及时处理现有投诉并提升服务质量，信用分恢复后将自动解除冻结。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-1 bg-gradient-to-br from-primary-500 to-primary-700 border-none text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/90">信用中心</h3>
            <Award className="w-5 h-5 text-white/70" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="white"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{creditScore}</span>
                <span className="text-xs text-white/70 mt-1">信用分</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getCreditLevelColor(
                    creditLevel
                  )}`}
                >
                  {creditLevel} 级商家
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">距离下一级</span>
                  <span className="font-medium text-white">
                    {creditLevel === 'A' ? '已达最高级' : `${creditLevel === 'B' ? 90 : creditLevel === 'C' ? 75 : 60} - ${creditScore} = ${Math.max(0, (creditLevel === 'B' ? 90 : creditLevel === 'C' ? 75 : 60) - creditScore)} 分`}
                  </span>
                </div>
                <div className="w-full bg-white/15 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{
                      width: `${creditLevel === 'A' ? 100 : Math.min(((creditScore - (creditLevel === 'B' ? 75 : creditLevel === 'C' ? 60 : 0)) / (creditLevel === 'B' ? 15 : creditLevel === 'C' ? 15 : 60)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">距离冻结线</span>
                  <span className={`font-medium ${creditScore <= 65 ? 'text-warning-300' : 'text-white'}`}>
                    {creditScore - 60} 分
                  </span>
                </div>
                <div className="w-full bg-white/15 rounded-full h-2">
                  <div
                    className={`rounded-full h-2 transition-all duration-500 ${creditScore <= 65 ? 'bg-warning-400' : 'bg-success-400'}`}
                    style={{ width: `${Math.max(Math.min(((creditScore - 60) / 40) * 100, 100), 0)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => navigate('/merchant/credit')}
                className="w-full mt-2 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium text-white transition-colors"
              >
                查看详情 <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:col-span-2">
          {statsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.path)}
                className="card p-5 cursor-pointer hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{card.value}</p>
                  <p className="text-xs text-neutral-400 mt-2">{card.trend}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">最近信用变动</h3>
            </div>
            <button
              onClick={() => navigate('/merchant/credit')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部
            </button>
          </div>
          {recentRecords.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无信用变动记录</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentRecords.map((record) => (
                <div key={record.id} className="px-5 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      record.type === 'add' ? 'bg-success-50' : 'bg-danger-50'
                    }`}
                  >
                    {record.type === 'add' ? (
                      <TrendingDown className="w-5 h-5 text-success-500 rotate-180" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-danger-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{record.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-xs text-neutral-500">
                        {formatDate(record.createdAt, 'date')}
                      </span>
                      {record.complaintId && (
                        <span className="text-xs text-primary-500">· {record.complaintId}</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold flex-shrink-0 ${
                      record.type === 'add' ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    {record.type === 'add' ? '+' : '-'}
                    {record.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">待处理投诉</h3>
              {pendingComplaints.length > 0 && (
                <span className="badge badge-danger">{pendingComplaints.length}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/merchant/complaints')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部
            </button>
          </div>
          {pendingComplaints.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无待处理投诉</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {pendingComplaints.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/merchant/complaints/${c.id}`)}
                  className="px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={c.orderInfo.productImage}
                      alt={c.orderInfo.productName}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {c.orderInfo.productName}
                        </p>
                        <span
                          className={`badge flex-shrink-0 ${
                            c.priority === 'high'
                              ? 'badge-danger'
                              : c.priority === 'medium'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {COMPLAINT_STATUS_LABELS[c.status]}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{c.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-neutral-400">{c.id}</span>
                        <span className="text-xs font-semibold text-danger-600">
                          {formatCurrency(c.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
