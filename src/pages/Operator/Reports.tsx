import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, FileText, Clock, CheckCircle,
  DollarSign, AlertTriangle, ChevronDown, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { useConfigStore } from '@/store/configStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ReportData } from '@/types';

// 投诉类型分布数据（mock）
const complaintTypeData = [
  { name: '商品质量', value: 425, color: '#3B82F6' },
  { name: '物流延误', value: 318, color: '#10B981' },
  { name: '虚假描述', value: 156, color: '#F59E0B' },
  { name: '价格问题', value: 89, color: '#EF4444' },
  { name: '售后服务', value: 127, color: '#8B5CF6' },
];

// 近6个月赔付趋势数据（mock）
const compensationTrendData = [
  { month: '2025-01', amount: 428500 },
  { month: '2025-02', amount: 386200 },
  { month: '2025-03', amount: 512800 },
  { month: '2025-04', amount: 631900 },
  { month: '2025-05', amount: 694200 },
  { month: '2025-06', amount: 756800 },
];

// 可选月份列表
const availableMonths = ['2025-06', '2025-05', '2025-04', '2025-03', '2025-02', '2025-01'];

const Reports: React.FC = () => {
  const { reportData, getReportByPeriod } = useConfigStore();
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 计算KPI数据
  const kpiData = useMemo(() => {
    const currentData = getReportByPeriod(selectedMonth);
    const prevMonth = availableMonths[availableMonths.indexOf(selectedMonth) + 1] || selectedMonth;
    const prevData = getReportByPeriod(prevMonth);

    const currentTotal = currentData.reduce((sum, d) => sum + d.complaintCount, 0);
    const prevTotal = prevData.reduce((sum, d) => sum + d.complaintCount, 0);
    const complaintCountChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1) : '0';

    const currentCompensation = currentData.reduce((sum, d) => sum + d.totalCompensation, 0);
    const prevCompensation = prevData.reduce((sum, d) => sum + d.totalCompensation, 0);
    const compensationChange = prevCompensation > 0 ? ((currentCompensation - prevCompensation) / prevCompensation * 100).toFixed(1) : '0';

    const currentAvgTime = currentData.length > 0 
      ? (currentData.reduce((sum, d) => sum + d.avgArbitrationTime, 0) / currentData.length).toFixed(1)
      : '0';
    const prevAvgTime = prevData.length > 0
      ? (prevData.reduce((sum, d) => sum + d.avgArbitrationTime, 0) / prevData.length).toFixed(1)
      : '0';
    const avgTimeChange = (parseFloat(currentAvgTime) - parseFloat(prevAvgTime)).toFixed(1);

    const currentSuccessRate = currentData.length > 0
      ? (currentData.reduce((sum, d) => sum + d.mediationSuccessRate, 0) / currentData.length).toFixed(1)
      : '0';
    const prevSuccessRate = prevData.length > 0
      ? (prevData.reduce((sum, d) => sum + d.mediationSuccessRate, 0) / prevData.length).toFixed(1)
      : '0';
    const successRateChange = (parseFloat(currentSuccessRate) - parseFloat(prevSuccessRate)).toFixed(1);

    return {
      complaintCount: currentTotal,
      complaintCountChange,
      totalCompensation: currentCompensation,
      compensationChange,
      avgArbitrationTime: currentAvgTime,
      avgTimeChange,
      mediationSuccessRate: currentSuccessRate,
      successRateChange,
    };
  }, [selectedMonth, reportData]);

  // 柱状图数据（本月vs上月）
  const barChartData = useMemo(() => {
    const currentData = getReportByPeriod(selectedMonth);
    const prevMonth = availableMonths[availableMonths.indexOf(selectedMonth) + 1] || selectedMonth;
    const prevData = getReportByPeriod(prevMonth);

    return currentData.map(d => ({
      category: d.category,
      本月: d.complaintCount,
      上月: prevData.find(p => p.category === d.category)?.complaintCount || 0,
    }));
  }, [selectedMonth, reportData]);

  // 处理导出
  const handleExport = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // KPI卡片组件
  const KPICard: React.FC<{
    title: string;
    value: string;
    change: string;
    isPositiveGood: boolean;
    icon: React.ReactNode;
    iconBg: string;
  }> = ({ title, value, change, isPositiveGood, icon, iconBg }) => {
    const changeNum = parseFloat(change);
    const isPositive = changeNum >= 0;
    const showPositive = isPositiveGood ? isPositive : !isPositive;

    return (
      <div className="card p-6 hover:shadow-elevation-2 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-neutral-500 mb-2">{title}</p>
            <p className="text-3xl font-bold text-neutral-800 mb-2">{value}</p>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              showPositive ? "text-success-600" : "text-danger-600"
            )}>
              {showPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{isPositive ? '+' : ''}{change}%</span>
              <span className="text-neutral-400 font-normal ml-1">环比</span>
            </div>
          </div>
          <div className={cn("p-3 rounded-xl", iconBg)}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">运营数据报表中心</h1>
          <p className="text-neutral-500">全面了解平台投诉处理情况和运营数据</p>
        </div>
        <div className="flex items-center gap-4">
          {/* 月份选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:border-primary-400 transition-colors"
            >
              <FileText className="w-4 h-4 text-primary-500" />
              <span className="font-medium">{selectedMonth}</span>
              <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform", showMonthDropdown && "rotate-180")} />
            </button>
            {showMonthDropdown && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-neutral-200 rounded-lg shadow-elevation-2 z-50 overflow-hidden">
                {availableMonths.map(month => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setShowMonthDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-primary-50 transition-colors",
                      selectedMonth === month ? "bg-primary-50 text-primary-600 font-medium" : "text-neutral-700"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      {/* 导出成功提示 */}
      {exportSuccess && (
        <div className="fixed top-6 right-6 bg-success-500 text-white px-6 py-3 rounded-lg shadow-elevation-3 flex items-center gap-2 z-50 animate-bounce-in">
          <CheckCircle className="w-5 h-5" />
          <span>报表导出成功！CSV文件已下载。</span>
        </div>
      )}

      {/* KPI指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="投诉总量"
          value={kpiData.complaintCount.toString()}
          change={kpiData.complaintCountChange}
          isPositiveGood={false}
          icon={<AlertTriangle className="w-6 h-6 text-primary-500" />}
          iconBg="bg-primary-100"
        />
        <KPICard
          title="赔付总额"
          value={formatCurrency(kpiData.totalCompensation)}
          change={kpiData.compensationChange}
          isPositiveGood={false}
          icon={<DollarSign className="w-6 h-6 text-danger-500" />}
          iconBg="bg-danger-100"
        />
        <KPICard
          title="平均处理时长"
          value={`${kpiData.avgArbitrationTime} 小时`}
          change={kpiData.avgTimeChange}
          isPositiveGood={false}
          icon={<Clock className="w-6 h-6 text-warning-500" />}
          iconBg="bg-warning-100"
        />
        <KPICard
          title="调解成功率"
          value={`${kpiData.mediationSuccessRate}%`}
          change={kpiData.successRateChange}
          isPositiveGood={true}
          icon={<CheckCircle className="w-6 h-6 text-success-500" />}
          iconBg="bg-success-100"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 柱状图 - 各品类投诉量对比 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-neutral-800">各品类投诉量对比</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="本月" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="上月" fill="#93C5FD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 饼图 - 投诉类型分布 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-neutral-800">投诉类型分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={complaintTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {complaintTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} 件`, '投诉数量']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 折线图 - 近6个月赔付总额趋势 */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-neutral-800">近6个月赔付总额趋势</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={compensationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '赔付总额']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 数据表格 - 各品类详细数据 */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">各品类详细数据</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">品类</th>
                <th className="table-header">投诉数</th>
                <th className="table-header">投诉率</th>
                <th className="table-header">赔付总额</th>
                <th className="table-header">平均仲裁时长</th>
                <th className="table-header">调解成功率</th>
              </tr>
            </thead>
            <tbody>
              {getReportByPeriod(selectedMonth).map((item: ReportData, index: number) => (
                <tr key={item.category} className={cn("hover:bg-neutral-50 transition-colors", index % 2 === 0 && "bg-neutral-50/50")}>
                  <td className="table-cell font-medium">{item.category}</td>
                  <td className="table-cell">{item.complaintCount}</td>
                  <td className="table-cell">
                    <span className={cn(
                      "badge",
                      item.complaintRate > 1.5 ? "badge-danger" : item.complaintRate > 1 ? "badge-warning" : "badge-success"
                    )}>
                      {item.complaintRate}%
                    </span>
                  </td>
                  <td className="table-cell font-medium text-danger-600">{formatCurrency(item.totalCompensation)}</td>
                  <td className="table-cell">{item.avgArbitrationTime} 小时</td>
                  <td className="table-cell">
                    <span className={cn(
                      "badge",
                      item.mediationSuccessRate >= 85 ? "badge-success" : item.mediationSuccessRate >= 75 ? "badge-warning" : "badge-danger"
                    )}>
                      {item.mediationSuccessRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
