import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  BellRing,
  ArrowUpRight,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  Award,
  Timer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatDate, getTimeRemaining } from '@/utils/format';
import { COMPLAINT_STATUS_LABELS } from '@/types';

export default function ServiceDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getServiceComplaints, getPendingAssignments, messages } = useComplaintStore();

  const serviceId = currentUser?.id ?? 'service_001';
  const userName = currentUser?.realName ?? '赵专员';
  const isSenior = currentUser?.isSenior ?? true;
  const successRate = currentUser?.successRate ?? 89;
  const caseCount = currentUser?.caseCount ?? 328;

  const myComplaints = useMemo(
    () => getServiceComplaints(serviceId),
    [getServiceComplaints, serviceId]
  );
  const pendingPool = useMemo(() => getPendingAssignments(), [getPendingAssignments]);

  const today = new Date().toISOString().slice(0, 10);
  const todayProcessed = myComplaints.filter(
    (c) => c.assignedAt?.startsWith(today) || c.updatedAt.startsWith(today)
  ).length;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthProcessed = myComplaints.filter((c) => c.updatedAt.startsWith(thisMonth)).length;

  const mediatedComplaints = myComplaints.filter(
    (c) => c.status === 'mediated' || c.status === 'closed' || c.status === 'awarded'
  );
  const mediationSuccessRate =
    mediatedComplaints.length > 0
      ? Math.round(
          (mediatedComplaints.filter((c) => c.consumerSatisfied).length /
            mediatedComplaints.filter((c) => c.consumerSatisfied !== undefined).length) *
            100
        )
      : successRate;

  const avgProcessingTime = 36;

  const myPending = myComplaints.filter((c) => ['assigned', 'mediating'].includes(c.status));

  const urgentCount = myPending.filter((c) => {
    if (!c.assignedAt) return false;
    const hoursSince = (Date.now() - new Date(c.assignedAt).getTime()) / (1000 * 60 * 60);
    return hoursSince > 18;
  }).length;

  const unreadMessages = messages.filter(
    (m) => m.recipientId === serviceId && !m.isRead
  ).length;

  const chartData = [
    { day: '6/7', count: 12, success: 10 },
    { day: '6/8', count: 15, success: 13 },
    { day: '6/9', count: 8, success: 7 },
    { day: '6/10', count: 18, success: 15 },
    { day: '6/11', count: 14, success: 12 },
    { day: '6/12', count: 20, success: 18 },
    { day: '6/13', count: todayProcessed || 11, success: todayProcessed ? Math.round(todayProcessed * 0.85) : 9 },
  ];

  const statsCards = [
    {
      label: '今日处理',
      value: todayProcessed,
      icon: ClipboardCheck,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
      suffix: '件',
      trend: '+3 较昨日',
      trendUp: true,
    },
    {
      label: '本月处理',
      value: monthProcessed,
      icon: Calendar,
      color: 'text-info-600',
      bg: 'bg-info-50',
      suffix: '件',
      trend: `累计 ${caseCount} 件`,
      trendUp: true,
    },
    {
      label: '调解成功率',
      value: mediationSuccessRate,
      icon: TrendingUp,
      color: 'text-success-600',
      bg: 'bg-success-50',
      suffix: '%',
      trend: successRate + '% 历史均值',
      trendUp: true,
    },
    {
      label: '平均处理时长',
      value: avgProcessingTime,
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      suffix: '时',
      trend: '目标 ≤48h',
      trendUp: true,
    },
  ];

  const todoItems = [
    {
      label: '我的待处理投诉',
      count: myPending.length,
      type: 'primary' as const,
      path: '/complaints',
      desc: '需要您处理的投诉',
    },
    {
      label: '待分派投诉池',
      count: pendingPool.length,
      type: 'info' as const,
      path: '/assignments',
      desc: '可领取或分派给其他专员',
    },
    {
      label: '即将超时案件',
      count: urgentCount,
      type: 'warning' as const,
      path: '/complaints',
      desc: '超过18小时未完成',
    },
    {
      label: '未读消息',
      count: unreadMessages,
      type: 'danger' as const,
      path: '/messages',
      desc: '系统通知和案件提醒',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">客服工作台</h1>
          <p className="text-neutral-500 mt-1">
            {userName}
            {isSenior && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-warning-100 text-warning-700 text-xs font-medium">
                <Award className="w-3 h-3" />
                资深专员
              </span>
            )}
            · 今天是 {formatDate(new Date().toISOString(), 'date')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                {card.trend && (
                  <span
                    className={`text-xs font-medium ${card.trendUp ? 'text-success-600' : 'text-danger-600'}`}
                  >
                    {card.trend}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-bold text-neutral-800">{card.value}</span>
                <span className="text-sm text-neutral-500 mb-1">{card.suffix}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">近7天处理量趋势</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-500" />
                <span className="text-neutral-600">处理总量</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-success-500" />
                <span className="text-neutral-600">成功调解</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
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
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  cursor={{ fill: 'rgba(30, 58, 95, 0.05)' }}
                />
                <Bar
                  dataKey="count"
                  name="处理总量"
                  fill="#1e3a5f"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="success"
                  name="成功调解"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-neutral-800">待办提醒</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {todoItems.map((item, idx) => {
              const colorMap = {
                primary: {
                  bg: 'bg-primary-50',
                  text: 'text-primary-600',
                  border: 'border-primary-200',
                  badge: 'badge-primary',
                },
                info: {
                  bg: 'bg-info-50',
                  text: 'text-info-600',
                  border: 'border-info-200',
                  badge: 'badge-info',
                },
                warning: {
                  bg: 'bg-warning-50',
                  text: 'text-warning-600',
                  border: 'border-warning-200',
                  badge: 'badge-warning',
                },
                danger: {
                  bg: 'bg-danger-50',
                  text: 'text-danger-600',
                  border: 'border-danger-200',
                  badge: 'badge-danger',
                },
              };
              const c = colorMap[item.type];
              return (
                <div
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                        {item.type === 'primary' ? (
                          <FileText className={`w-4 h-4 ${c.text}`} />
                        ) : item.type === 'info' ? (
                          <Users className={`w-4 h-4 ${c.text}`} />
                        ) : item.type === 'warning' ? (
                          <Timer className={`w-4 h-4 ${c.text}`} />
                        ) : (
                          <BellRing className={`w-4 h-4 ${c.text}`} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{item.label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${c.badge} text-sm px-2.5 py-0.5 font-semibold`}>
                        {item.count}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">我的待处理案件</h3>
              {myPending.length > 0 && (
                <span className="badge badge-danger">{myPending.length}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/complaints')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部
            </button>
          </div>
          {myPending.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-success-500" />
              <p>暂无待处理案件，干得漂亮！</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {myPending.slice(0, 5).map((c) => {
                const hoursSince = c.assignedAt
                  ? (Date.now() - new Date(c.assignedAt).getTime()) / (1000 * 60 * 60)
                  : 0;
                const isUrgent = hoursSince > 18;
                const deadlineInfo = c.merchantResponseDeadline
                  ? getTimeRemaining(c.merchantResponseDeadline)
                  : null;
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className={`px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      isUrgent ? 'bg-warning-50/50 border-l-4 border-l-warning-500' : ''
                    }`}
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
                          <span className="text-xs font-mono text-primary-500">{c.id}</span>
                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-600">
                              <AlertTriangle className="w-3 h-3" />
                              即将超时
                            </span>
                          ) : deadlineInfo && !deadlineInfo.isExpired ? (
                            <span className="text-xs text-neutral-400">
                              剩余 {deadlineInfo.days > 0 && `${deadlineInfo.days}天`}
                              {deadlineInfo.hours}时
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-neutral-800">待分派池</h3>
              {pendingPool.length > 0 && (
                <span className="badge badge-info">{pendingPool.length}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/assignments')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              分派管理
            </button>
          </div>
          {pendingPool.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>待分派池已清空</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
              {pendingPool.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/assignments')}
                  className={`px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    c.priority === 'high'
                      ? 'bg-danger-50/30 border-l-4 border-l-danger-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary-500">{c.id}</span>
                        {c.priority === 'high' && (
                          <span className="badge badge-danger">高优先级</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-800 truncate mt-1">
                        {c.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {c.orderInfo.productName}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-danger-600">
                        ¥{c.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatDate(c.createdAt, 'short')}
                      </p>
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
