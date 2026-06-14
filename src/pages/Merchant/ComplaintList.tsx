import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  Eye,
  ChevronDown,
  AlertTriangle,
  User,
  Package,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  formatCurrency,
  formatDate,
  getTimeRemaining,
  truncateText,
} from '@/utils/format';
import {
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_LABELS,
  type ComplaintStatus,
  type ComplaintType,
} from '@/types';

export default function MerchantComplaintList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getMerchantComplaints } = useComplaintStore();

  const merchantId = currentUser?.id ?? 'merchant_001';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const allComplaints = useMemo(
    () => getMerchantComplaints(merchantId),
    [getMerchantComplaints, merchantId]
  );

  const filteredComplaints = useMemo(() => {
    return allComplaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (new Date(c.createdAt).getTime() < cutoff) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !c.id.toLowerCase().includes(term) &&
          !c.title.toLowerCase().includes(term) &&
          !c.orderInfo.productName.toLowerCase().includes(term) &&
          !c.consumerName.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allComplaints, statusFilter, typeFilter, dateRange, searchTerm]);

  const renderRemainingTime = (deadline?: string) => {
    if (!deadline) return <span className="text-neutral-400">-</span>;
    const remaining = getTimeRemaining(deadline);
    if (remaining.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 text-danger-600 font-semibold text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          已超时
        </span>
      );
    }
    const totalHours = remaining.days * 24 + remaining.hours;
    const isUrgent = totalHours < 6;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          isUrgent ? 'text-danger-600' : 'text-warning-600'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        {remaining.days > 0 && `${remaining.days}天`}
        {remaining.hours}时{remaining.minutes}分
      </span>
    );
  };

  const getRowClass = (c: typeof allComplaints[0]) => {
    if (c.merchantTimeout) return 'bg-danger-50 border-l-4 border-l-danger-500';
    if (c.merchantResponseDeadline) {
      const remaining = getTimeRemaining(c.merchantResponseDeadline);
      if (!remaining.isExpired) {
        const totalHours = remaining.days * 24 + remaining.hours;
        if (totalHours < 6) return 'bg-warning-50/50 border-l-4 border-l-warning-500';
      }
    }
    return '';
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(COMPLAINT_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  const typeOptions: { value: string; label: string }[] = [
    { value: 'all', label: '全部类型' },
    ...Object.entries(COMPLAINT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  const dateOptions = [
    { value: 'all', label: '全部时间' },
    { value: '7', label: '近7天' },
    { value: '30', label: '近30天' },
    { value: '90', label: '近90天' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">投诉处理</h1>
          <p className="text-neutral-500 mt-1">共 {filteredComplaints.length} 条投诉记录</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索投诉号、标题、商品、投诉人..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
                className="input pr-10 appearance-none min-w-36"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ComplaintType | 'all')}
                className="input pr-10 appearance-none min-w-36"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input pr-10 appearance-none min-w-36"
              >
                {dateOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setDateRange('all');
                setSearchTerm('');
              }}
              className="btn btn-ghost inline-flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-40">投诉号</th>
                <th className="table-header min-w-56">商品信息</th>
                <th className="table-header w-28">类型</th>
                <th className="table-header w-28">投诉人</th>
                <th className="table-header w-28">金额</th>
                <th className="table-header w-28">状态</th>
                <th className="table-header w-36">剩余响应时间</th>
                <th className="table-header w-36">投诉时间</th>
                <th className="table-header w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-neutral-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>暂无符合条件的投诉记录</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/merchant/complaints/${c.id}`)}
                    className={`cursor-pointer hover:bg-neutral-50 transition-colors ${getRowClass(c)}`}
                  >
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium text-primary-600">
                        {c.id}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.orderInfo.productImage}
                          alt={c.orderInfo.productName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate max-w-48">
                            {truncateText(c.orderInfo.productName, 25)}
                          </p>
                          <p className="text-xs text-neutral-500 truncate max-w-48 mt-0.5">
                            {truncateText(c.title, 25)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{COMPLAINT_TYPE_LABELS[c.type]}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm">{c.consumerName}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-danger-600">
                        {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          c.status === 'pending' || c.status === 'arbitrating'
                            ? 'badge-warning'
                            : c.status === 'mediating' || c.status === 'assigned'
                            ? 'badge-primary'
                            : c.status === 'closed' || c.status === 'mediated'
                            ? 'badge-neutral'
                            : c.status === 'awarded'
                            ? 'badge-success'
                            : 'badge-danger'
                        }`}
                      >
                        {COMPLAINT_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="table-cell">{renderRemainingTime(c.merchantResponseDeadline)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatDate(c.createdAt, 'date')}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/merchant/complaints/${c.id}`);
                        }}
                        className="btn btn-ghost !px-2 !py-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
