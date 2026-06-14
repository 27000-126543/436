import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  FileCheck2,
  Target,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Timer,
  BadgeCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS_LABELS } from '@/types';
import { formatCurrency, formatDate, formatRelativeTime, getTimeRemaining } from '@/utils/format';
import { cn } from '@/lib/utils';

const caseTrendData = [
  { month: '1月', 待裁决: 8, 已裁决: 22 },
  { month: '2月', 待裁决: 12, 已裁决: 28 },
  { month: '3月', 待裁决: 6, 已裁决: 35 },
  { month: '4月', 待裁决: 15, 已裁决: 30 },
  { month: '5月', 待裁决: 10, 已裁决: 42 },
  { month: '6月', 待裁决: 18, 已裁决: 38 },
];

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  subValue?: string;
  subColor?: string;
  trend?: { value: number; up: boolean };
}

function StatCard({ icon, iconBg, label, value, subValue, subColor, trend }: StatCardProps) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-2 font-display">{value}</p>
          {subValue && (
            <p className={cn('text-xs mt-1.5', subColor || 'text-neutral-500')}>{subValue}</p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <TrendingUp size={12} className={trend.up ? 'text-success-600' : 'text-danger-600 rotate-180'} />
          <span className={trend.up ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
            {trend.up ? '+' : ''}{trend.value}%
          </span>
          <span className="text-neutral-400">较上月</span>
        </div>
      )}
    </div>
  );
}

export default function ArbitratorDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { complaints, messages, getUnreadCount } = useComplaintStore();

  const myCases = useMemo(() => {
    if (!currentUser) return [];
    return complaints.filter(c => c.arbitratorId === currentUser.id);
  }, [complaints, currentUser]);

  const pendingCases = useMemo(() => {
    return myCases.filter(c => c.status === 'arbitrating' && !c.award);
  }, [myCases]);

  const awardedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return myCases.filter(c => {
      if (!c.award) return false;
      const awardDate = new Date(c.award.createdAt);
      return awardDate >= monthStart;
    });
  }, [myCases]);

  const urgentCases = useMemo(() => {
    return pendingCases.filter(c => {
      if (!c.merchantResponseDeadline) return false;
      const remaining = getTimeRemaining(c.merchantResponseDeadline);
      return !remaining.isExpired && remaining.days === 0 && remaining.hours < 24;
    });
  }, [pendingCases]);

  const reviewCases = useMemo(() => {
    return myCases.filter(c => c.isReArbitration && !c.award);
  }, [myCases]);

  const todoReminders = useMemo(() => {
    const reminders: Array<{ id: string; type: string; title: string; time: string; urgent: boolean; icon: React.ReactNode }> = [];
    urgentCases.forEach(c => {
      const remaining = getTimeRemaining(c.merchantResponseDeadline!);
      reminders.push({
        id: `case-${c.id}`,
        type: '紧急案件',
        title: `${COMPLAINT_TYPE_LABELS[c.type]} - ${c.orderInfo.productName.slice(0, 20)}...`,
        time: `剩余 ${remaining.hours}小时${remaining.minutes}分`,
        urgent: true,
        icon: <Timer size={16} className="text-danger-500" />,
      });
    });
    reviewCases.forEach(c => {
      reminders.push({
        id: `review-${c.id}`,
        type: '复核案件',
        title: `终裁案件：${c.title.slice(0, 25)}...`,
        time: formatRelativeTime(c.arbitrationAssignedAt || c.createdAt),
        urgent: false,
        icon: <BadgeCheck size={16} className="text-warning-500" />,
      });
    });
    if (currentUser) {
      const unread = messages
        .filter(m => m.recipientId === currentUser.id && !m.isRead)
        .slice(0, 3);
      unread.forEach(m => {
        reminders.push({
          id: `msg-${m.id}`,
          type: '未读消息',
          title: m.title,
          time: formatRelativeTime(m.createdAt),
          urgent: m.type === 'timeout_warning' || m.type === 'arbitration_needed',
          icon: <AlertTriangle size={16} className="text-info-500" />,
        });
      });
    }
    return reminders.slice(0, 6);
  }, [urgentCases, reviewCases, messages, currentUser]);

  const stats: StatCardProps[] = [
    {
      icon: <Scale size={22} className="text-primary-600" />,
      iconBg: 'bg-primary-100',
      label: '待裁决案件',
      value: pendingCases.length,
      subValue: urgentCases.length > 0 ? `${urgentCases.length} 件紧急` : undefined,
      subColor: urgentCases.length > 0 ? 'text-danger-600 font-medium' : undefined,
      trend: { value: 12, up: true },
    },
    {
      icon: <FileCheck2 size={22} className="text-success-600" />,
      iconBg: 'bg-success-100',
      label: '本月裁决',
      value: awardedThisMonth.length,
      subValue: `累计 ${myCases.filter(c => c.award).length} 件`,
      trend: { value: 8, up: true },
    },
    {
      icon: <Target size={22} className="text-warning-600" />,
      iconBg: 'bg-warning-100',
      label: '裁决准确率',
      value: `${currentUser?.successRate || 95}%`,
      subValue: currentUser?.isSenior ? '资深仲裁员' : '普通仲裁员',
      subColor: currentUser?.isSenior ? 'text-primary-600 font-medium' : undefined,
      trend: { value: 2, up: true },
    },
    {
      icon: <Clock size={22} className="text-info-600" />,
      iconBg: 'bg-info-100',
      label: '平均裁决时长',
      value: '42h',
      subValue: '较平台均值快 6h',
      subColor: 'text-success-600 font-medium',
      trend: { value: 5, up: false },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 font-display">
            欢迎回来，{currentUser?.realName}
            {currentUser?.isSenior && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs rounded-full font-medium">
                <Sparkles size={12} />
                资深仲裁员
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            今天是 {formatDate(new Date().toISOString(), 'full')}，共 {pendingCases.length} 件案件待处理
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/arbitrator/cases')}
            className="btn btn-primary gap-2"
          >
            <Scale size={16} />
            进入案件池
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">案件趋势</h2>
              <p className="text-sm text-neutral-500 mt-0.5">近6个月案件处理情况</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-info-400" />
                <span className="text-neutral-600">待裁决</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-500" />
                <span className="text-neutral-600">已裁决</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={caseTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="待裁决"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  dot={{ fill: '#60a5fa', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="已裁决"
                  stroke="#1e3a5f"
                  strokeWidth={2.5}
                  dot={{ fill: '#1e3a5f', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">待办提醒</h2>
              <p className="text-sm text-neutral-500 mt-0.5">{todoReminders.length} 项待处理</p>
            </div>
            {currentUser && getUnreadCount(currentUser.id) > 0 && (
              <span className="badge badge-danger">
                {getUnreadCount(currentUser.id)} 未读
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {todoReminders.length === 0 ? (
              <div className="py-12 text-center">
                <Sparkles size={32} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">暂无待办事项</p>
              </div>
            ) : (
              todoReminders.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id.startsWith('case-')) {
                      navigate(`/arbitrator/case/${item.id.replace('case-', '')}`);
                    } else if (item.id.startsWith('review-')) {
                      navigate(`/arbitrator/review`);
                    } else {
                      navigate('/messages');
                    }
                  }}
                  className={cn(
                    'w-full text-left p-3.5 rounded-lg border transition-all',
                    item.urgent
                      ? 'bg-danger-50/50 border-danger-100 hover:bg-danger-50 hover:border-danger-200'
                      : 'bg-neutral-50 border-neutral-100 hover:bg-neutral-100 hover:border-neutral-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      item.urgent ? 'bg-danger-100' : 'bg-white border border-neutral-200'
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded',
                          item.urgent ? 'bg-danger-100 text-danger-700' : 'bg-neutral-200 text-neutral-700'
                        )}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-800 mt-1.5 font-medium line-clamp-1">{item.title}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        item.urgent ? 'text-danger-600 font-medium' : 'text-neutral-500'
                      )}>
                        {item.time}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">我的案件概览</h2>
            <p className="text-sm text-neutral-500 mt-0.5">近期分配的案件</p>
          </div>
          <button
            onClick={() => navigate('/arbitrator/cases')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            查看全部
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">投诉号</th>
                <th className="table-header">类型</th>
                <th className="table-header">商品</th>
                <th className="table-header">金额</th>
                <th className="table-header">消费者</th>
                <th className="table-header">商家</th>
                <th className="table-header">状态</th>
                <th className="table-header">分配时间</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {myCases.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="table-cell font-mono text-xs text-primary-600 font-medium">{c.id}</td>
                  <td className="table-cell">
                    <span className="badge badge-primary">{COMPLAINT_TYPE_LABELS[c.type]}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <img
                        src={c.orderInfo.productImage}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-sm line-clamp-1 max-w-[200px]">{c.orderInfo.productName}</span>
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-neutral-800">{formatCurrency(c.amount)}</td>
                  <td className="table-cell text-sm">{c.consumerName}</td>
                  <td className="table-cell text-sm">{c.orderInfo.merchantName}</td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      c.status === 'arbitrating' ? 'badge-warning' :
                      c.status === 'awarded' ? 'badge-success' : 'badge-neutral'
                    )}>
                      {COMPLAINT_STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-neutral-500">
                    {formatDate(c.arbitrationAssignedAt || c.createdAt, 'short')}
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => navigate(`/arbitrator/case/${c.id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {c.award ? '查看裁决' : '立即裁决'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
