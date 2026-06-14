import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileBarChart,
  DollarSign,
  Clock,
  Handshake,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Settings,
  BarChart3,
  Users,
  FileCheck2,
  Sparkles,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useComplaintStore } from '@/store/complaintStore';
import { useConfigStore } from '@/store/configStore';
import { useAuthStore } from '@/store/authStore';
import { COMPLAINT_TYPE_LABELS } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#1e3a5f', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: { value: number; up: boolean; label: string };
  highlight?: boolean;
}

function KpiCard({ icon, iconBg, label, value, unit, trend, highlight }: KpiCardProps) {
  return (
    <div className={cn(
      'card p-5 relative overflow-hidden',
      highlight && 'bg-gradient-to-br from-primary-600 to-primary-800 border-transparent'
    )}>
      {highlight && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      )}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            highlight ? 'bg-white/20' : iconBg
          )}>
            {icon}
          </div>
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            highlight
              ? 'bg-white/15 text-white'
              : trend.up ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
          )}>
            {trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.up ? '+' : ''}{trend.value}%
          </div>
        </div>
        <div className="mt-4">
          <p className={cn('text-sm font-medium', highlight ? 'text-primary-100' : 'text-neutral-500')}>
            {label}
          </p>
          <div className={cn('mt-1.5 flex items-baseline gap-1', highlight ? 'text-white' : 'text-neutral-800')}>
            <span className="text-3xl font-bold font-display">{value}</span>
            {unit && <span className={cn('text-sm', highlight ? 'text-primary-200' : 'text-neutral-500')}>{unit}</span>}
          </div>
        </div>
        <p className={cn('text-xs mt-2.5', highlight ? 'text-primary-200' : 'text-neutral-500')}>
          {trend.label}
        </p>
      </div>
    </div>
  );
}

interface TrendMiniCardProps {
  label: string;
  value: string;
  diff: number;
  up: boolean;
  color: string;
}

function TrendMiniCard({ label, value, diff, up, color }: TrendMiniCardProps) {
  return (
    <div className="p-4 bg-neutral-50 rounded-xl">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={cn('text-xl font-bold mt-1 font-display', color)}>{value}</p>
      <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', up ? 'text-success-600' : 'text-danger-600')}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {up ? '+' : ''}{diff}% 环比
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { complaints, compensations } = useComplaintStore();
  const { reportData } = useConfigStore();
  const { currentUser } = useAuthStore();

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthData = useMemo(() => {
    return complaints.filter(c => {
      const created = new Date(c.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    });
  }, [complaints, now]);

  const lastMonthData = useMemo(() => {
    return complaints.filter(c => {
      const created = new Date(c.createdAt);
      return created.getFullYear() === lastMonthDate.getFullYear() && created.getMonth() === lastMonthDate.getMonth();
    });
  }, [complaints, lastMonthDate]);

  const totalCompensation = useMemo(() => {
    return compensations.reduce((sum, c) => sum + (c.status === 'paid' ? c.amount : 0), 0);
  }, [compensations]);

  const closedCount = useMemo(() => {
    return complaints.filter(c => c.status === 'closed' || c.status === 'awarded').length;
  }, [complaints]);

  const mediationSuccess = useMemo(() => {
    const mediated = complaints.filter(c => c.mediationRecord);
    if (mediated.length === 0) return 76;
    const success = mediated.filter(c => c.consumerSatisfied).length;
    return Math.round((success / mediated.length) * 100) || 76;
  }, [complaints]);

  const avgArbitrationTime = useMemo(() => {
    const awarded = complaints.filter(c => c.award && c.arbitrationAssignedAt);
    if (awarded.length === 0) return 48;
    const totalHours = awarded.reduce((sum, c) => {
      const start = new Date(c.arbitrationAssignedAt!).getTime();
      const end = new Date(c.award!.createdAt).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
    return Math.round(totalHours / awarded.length);
  }, [complaints]);

  const pieData = useMemo(() => {
    const currentMonthReport = reportData.filter(r => r.period === thisMonth);
    if (currentMonthReport.length > 0) {
      return currentMonthReport.map(r => ({
        name: r.category,
        value: r.complaintCount,
      }));
    }
    const typeCount: Record<string, number> = {};
    thisMonthData.forEach(c => {
      const label = COMPLAINT_TYPE_LABELS[c.type];
      typeCount[label] = (typeCount[label] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  }, [thisMonthData, reportData, thisMonth]);

  const highRiskMerchants = useMemo(() => {
    return [
      { name: '潮流服饰专营店', count: 12, amount: 28600, trend: 23 },
      { name: '优品数码旗舰店', count: 8, amount: 45200, trend: -5 },
      { name: '美食生鲜馆', count: 6, amount: 8900, trend: 45 },
      { name: '美妆小铺', count: 5, amount: 12300, trend: 12 },
    ].sort((a, b) => b.amount - a.amount);
  }, []);

  const pendingActions = useMemo(() => [
    {
      id: '1',
      type: '高风险预警',
      title: '潮流服饰专营店信用分跌破阈值',
      desc: '当前信用分52分，已低于冻结阈值60分',
      time: '2小时前',
      urgent: true,
      action: '查看详情',
    },
    {
      id: '2',
      type: '规则优化建议',
      title: '品类虚假宣传投诉量激增',
      desc: '本月虚假描述类投诉较上月上升 32%，建议调整赔付规则',
      time: '5小时前',
      urgent: false,
      action: '调整规则',
    },
    {
      id: '3',
      type: '仲裁效率提醒',
      title: '8件案件临近裁决时效',
      desc: '其中3件高金额案件剩余时效不足12小时',
      time: '1天前',
      urgent: true,
      action: '催办提醒',
    },
    {
      id: '4',
      type: '报表生成完成',
      title: '月度运营报告已生成',
      desc: '2025年6月消费者权益保障报告已生成完毕',
      time: '3天前',
      urgent: false,
      action: '查看报告',
    },
  ], []);

  const kpis: KpiCardProps[] = [
    {
      icon: <FileBarChart size={22} className="text-primary-600" />,
      iconBg: 'bg-primary-100',
      label: '投诉总量（本月）',
      value: thisMonthData.length,
      unit: '件',
      trend: {
        value: Math.round(((thisMonthData.length - lastMonthData.length) / Math.max(lastMonthData.length, 1)) * 100),
        up: thisMonthData.length >= lastMonthData.length,
        label: `上月 ${lastMonthData.length} 件`,
      },
      highlight: true,
    },
    {
      icon: <DollarSign size={22} className="text-warning-600" />,
      iconBg: 'bg-warning-100',
      label: '赔付总额（累计）',
      value: formatCurrency(totalCompensation).replace('¥', ''),
      unit: '元',
      trend: {
        value: 15,
        up: true,
        label: '本月新增赔付 ¥68,400',
      },
    },
    {
      icon: <Clock size={22} className="text-info-600" />,
      iconBg: 'bg-info-100',
      label: '平均处理时长',
      value: avgArbitrationTime,
      unit: '小时',
      trend: {
        value: 8,
        up: false,
        label: '较上月缩短 4 小时',
      },
    },
    {
      icon: <Handshake size={22} className="text-success-600" />,
      iconBg: 'bg-success-100',
      label: '调解成功率',
      value: mediationSuccess,
      unit: '%',
      trend: {
        value: 3,
        up: true,
        label: `结案 ${closedCount} 件`,
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 font-display flex items-center gap-2">
            <LayoutDashboard size={26} className="text-primary-600" />
            运营控制台
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
              <Sparkles size={12} />
              实时数据
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {formatDate(new Date().toISOString(), 'full')} · 欢迎回来，{currentUser?.realName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operator/rules')}
            className="btn btn-secondary gap-2"
          >
            <Settings size={16} />
            规则配置
          </button>
          <button
            onClick={() => navigate('/operator/reports')}
            className="btn btn-primary gap-2"
          >
            <BarChart3 size={16} />
            查看报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-primary-600" />
            趋势对比（环比）
          </h3>
          <div className="space-y-3">
            <TrendMiniCard
              label="数码电器类投诉"
              value="328 件"
              diff={9}
              up={true}
              color="text-primary-700"
            />
            <TrendMiniCard
              label="服饰鞋包类投诉"
              value="512 件"
              diff={7}
              up={true}
              color="text-info-700"
            />
            <TrendMiniCard
              label="美妆个护类投诉"
              value="189 件"
              diff={7}
              up={true}
              color="text-warning-700"
            />
            <TrendMiniCard
              label="食品生鲜类投诉"
              value="145 件"
              diff={5}
              up={true}
              color="text-success-700"
            />
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <PieChartIcon size={16} />
              品类投诉分布
            </h3>
            <select className="input w-28 text-xs py-1.5 h-auto">
              <option>本月</option>
              <option>上月</option>
              <option>本季度</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} 件`, '投诉量']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-warning-600" />
            高风险商家
          </h3>
          <div className="space-y-3">
            {highRiskMerchants.map((merchant, idx) => (
              <div key={merchant.name} className="p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-5 h-5 rounded text-xs font-bold flex items-center justify-center',
                      idx === 0 ? 'bg-danger-500 text-white' :
                      idx === 1 ? 'bg-warning-500 text-white' :
                      idx === 2 ? 'bg-info-500 text-white' : 'bg-neutral-400 text-white'
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-neutral-800 line-clamp-1">{merchant.name}</span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    merchant.trend > 0 ? 'text-danger-600' : 'text-success-600'
                  )}>
                    {merchant.trend > 0 ? '↑' : '↓'}{Math.abs(merchant.trend)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500 mt-1.5 pl-7">
                  <span>{merchant.count} 件投诉</span>
                  <span className="font-medium text-neutral-700">{formatCurrency(merchant.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/operator/reports')}
            className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-primary-50 transition-colors"
          >
            查看完整榜单
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-danger-500" />
              待办事项
              <span className="text-xs font-normal text-neutral-500">({pendingActions.filter(p => p.urgent).length} 项紧急)</span>
            </h3>
          </div>
          <div className="space-y-3">
            {pendingActions.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  item.urgent
                    ? 'bg-danger-50/30 border-danger-200 hover:bg-danger-50'
                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    item.urgent ? 'bg-danger-100' : 'bg-info-100'
                  )}>
                    {item.urgent ? (
                      <AlertTriangle size={14} className="text-danger-600" />
                    ) : (
                      <Users size={14} className="text-info-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        item.urgent ? 'bg-danger-100 text-danger-700' : 'bg-neutral-200 text-neutral-700'
                      )}>
                        {item.type}
                      </span>
                      <span className="text-[10px] text-neutral-500">{item.time}</span>
                    </div>
                    <h4 className="text-sm font-medium text-neutral-800 mt-1.5">{item.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (item.id === '2') navigate('/operator/rules');
                      else if (item.id === '4') navigate('/operator/reports');
                    }}
                    className="btn btn-ghost text-xs gap-1 flex-shrink-0"
                  >
                    {item.action}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <FileCheck2 size={16} className="text-success-500" />
              近期裁决动态
            </h3>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              查看全部
            </button>
          </div>
          <div className="space-y-4">
            {complaints.filter(c => c.award).slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                <img
                  src={c.orderInfo.productImage}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 line-clamp-1">{c.orderInfo.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                      {c.id}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {c.award?.arbitratorName} 裁决
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    'text-sm font-bold',
                    c.award!.liability === 'consumer' ? 'text-neutral-500' : 'text-success-600'
                  )}>
                    {c.award!.liability === 'consumer' ? '驳回' : formatCurrency(c.award!.compensationAmount)}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {formatDate(c.award!.createdAt, 'short')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
