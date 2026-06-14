import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  HandCoins,
  UserPlus,
  CheckSquare,
  Square,
  AlertTriangle,
  Clock,
  Package,
  Calendar,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  type ComplaintType,
  type Priority,
} from '@/types';

export default function ServicePool() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getPendingAssignments, assignToService } = useComplaintStore();

  const serviceId = currentUser?.id ?? 'service_001';
  const serviceName = currentUser?.realName ?? '赵专员';

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const pendingAssignments = useMemo(() => getPendingAssignments(), [getPendingAssignments]);

  const filteredAssignments = useMemo(() => {
    return pendingAssignments.filter((c) => {
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !c.id.toLowerCase().includes(term) &&
          !c.title.toLowerCase().includes(term) &&
          !c.orderInfo.productName.toLowerCase().includes(term) &&
          !c.orderInfo.merchantName.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [pendingAssignments, priorityFilter, typeFilter, searchTerm]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAssignments.length && filteredAssignments.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssignments.map((c) => c.id)));
    }
  };

  const handleClaim = (id: string) => {
    setIsAssigning(true);
    setTimeout(() => {
      assignToService(id, serviceId, serviceName);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setIsAssigning(false);
      navigate(`/service/complaints/${id}`);
    }, 500);
  };

  const handleBatchAssignToMe = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setIsAssigning(true);
    setTimeout(() => {
      selectedIds.forEach((id) => {
        assignToService(id, serviceId, serviceName);
      });
      setSelectedIds(new Set());
      setIsAssigning(false);
      if (ids.length === 1) {
        navigate(`/service/complaints/${ids[0]}`);
      } else {
        navigate('/service/complaints');
      }
    }, 800);
  };

  const highPriorityCount = filteredAssignments.filter((c) => c.priority === 'high').length;
  const totalAmount = filteredAssignments.reduce((sum, c) => sum + c.amount, 0);

  const priorityOptions: { value: string; label: string }[] = [
    { value: 'all', label: '全部优先级' },
    ...Object.entries(PRIORITY_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  const typeOptions: { value: string; label: string }[] = [
    { value: 'all', label: '全部类型' },
    ...Object.entries(COMPLAINT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  const getRowClass = (priority: Priority) => {
    if (priority === 'high') return 'border-l-4 border-l-danger-500 bg-danger-50/30 hover:bg-danger-50/60';
    return '';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">待分派池</h1>
          <p className="text-neutral-500 mt-1">
            共 {filteredAssignments.length} 条待分派 · 高优先级 {highPriorityCount} 条 · 涉及金额{' '}
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
              <span className="text-sm text-primary-700 font-medium">
                已选 {selectedIds.size} 条
              </span>
              <button
                onClick={handleBatchAssignToMe}
                disabled={isAssigning}
                className="btn btn-primary !py-1.5 !px-3 text-sm inline-flex items-center gap-1"
              >
                {isAssigning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    分配中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    批量领取
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-2xl font-bold text-neutral-800">{pendingAssignments.length}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-3">待分派总数</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
            </div>
            <span className="text-2xl font-bold text-danger-600">{highPriorityCount}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-3">高优先级</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
              <HandCoins className="w-5 h-5 text-warning-500" />
            </div>
            <span className="text-2xl font-bold text-warning-600">
              ¥{(totalAmount / 10000).toFixed(1)}万
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-3">涉及总金额</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-info-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-info-500" />
            </div>
            <span className="text-2xl font-bold text-info-600">6.2h</span>
          </div>
          <p className="text-sm text-neutral-500 mt-3">平均等待时长</p>
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
              placeholder="搜索投诉号、标题、商品、商家..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="input pr-10 appearance-none min-w-36"
              >
                {priorityOptions.map((o) => (
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
            <button
              onClick={() => {
                setPriorityFilter('all');
                setTypeFilter('all');
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
                <th className="table-header w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-neutral-100 rounded transition-colors"
                  >
                    {selectedIds.size === filteredAssignments.length &&
                    filteredAssignments.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary-500" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="table-header w-40">投诉号</th>
                <th className="table-header min-w-56">商品/标题</th>
                <th className="table-header w-28">类型</th>
                <th className="table-header w-28">商家</th>
                <th className="table-header w-28 text-right">金额</th>
                <th className="table-header w-28">优先级</th>
                <th className="table-header w-36">投诉时间</th>
                <th className="table-header w-40 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-neutral-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>待分派池已清空，干得漂亮！</p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/service/complaints/${c.id}`)}
                    className={`cursor-pointer hover:bg-neutral-50 transition-colors ${getRowClass(
                      c.priority
                    )}`}
                  >
                    <td className="table-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(c.id);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                      >
                        {selectedIds.has(c.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary-500" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>
                    </td>
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
                          <p className="text-sm font-medium text-neutral-800 truncate max-w-56">
                            {c.orderInfo.productName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate max-w-56 mt-0.5">
                            {c.title}
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
                        <span className="text-sm truncate max-w-24">
                          {c.orderInfo.merchantName}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={`font-bold ${
                          c.priority === 'high' ? 'text-danger-600' : 'text-neutral-800'
                        }`}
                      >
                        {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge inline-flex items-center gap-1 ${
                          c.priority === 'high'
                            ? 'badge-danger'
                            : c.priority === 'medium'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {c.priority === 'high' && <AlertTriangle className="w-3 h-3" />}
                        {PRIORITY_LABELS[c.priority]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatDate(c.createdAt, 'date')}</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {formatDate(c.createdAt, 'time')}
                      </p>
                    </td>
                    <td className="table-cell text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`/service/complaints/${c.id}`)}
                          className="btn btn-ghost !px-3 !py-1.5 text-xs text-neutral-600 hover:text-primary-600"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleClaim(c.id)}
                          disabled={isAssigning}
                          className="btn btn-primary !px-3 !py-1.5 text-xs inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          一键领取
                        </button>
                      </div>
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
