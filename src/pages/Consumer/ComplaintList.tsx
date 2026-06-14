import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  truncateText,
} from '@/utils/format';
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  type ComplaintStatus,
  type ComplaintType,
  type Complaint,
} from '@/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | ComplaintStatus;
type TypeFilter = 'all' | ComplaintType;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'assigned', label: '已分派' },
  { value: 'mediating', label: '调解中' },
  { value: 'arbitrating', label: '仲裁中' },
  { value: 'awarded', label: '已裁决' },
  { value: 'closed', label: '已完成' },
  { value: 'reject', label: '已驳回' },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'quality', label: '商品质量' },
  { value: 'logistics', label: '物流延误' },
  { value: 'misrepresentation', label: '虚假描述' },
  { value: 'price', label: '价格问题' },
  { value: 'aftersale', label: '售后服务' },
];

const PAGE_SIZE = 5;

export default function ComplaintList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getConsumerComplaints, autoProcessAssignments } = useComplaintStore();

  const consumerId = currentUser?.id || 'consumer_001';

  useMemo(() => {
    autoProcessAssignments();
  }, [autoProcessAssignments]);

  const allComplaints = useMemo(
    () => getConsumerComplaints(consumerId),
    [consumerId, getConsumerComplaints]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredComplaints = useMemo(() => {
    let result = [...allComplaints];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.orderId.toLowerCase().includes(query) ||
          c.orderInfo.productName.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter);
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allComplaints, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredComplaints.length / PAGE_SIZE);
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredComplaints.slice(start, start + PAGE_SIZE);
  }, [filteredComplaints, currentPage]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allComplaints.length };
    STATUS_FILTERS.forEach(f => {
      if (f.value !== 'all') {
        counts[f.value] = allComplaints.filter(c => c.status === f.value).length;
      }
    });
    return counts;
  }, [allComplaints]);

  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">我的投诉</h1>
          <p className="text-sm text-neutral-500 mt-1">
            共 {filteredComplaints.length} 条投诉记录
          </p>
        </div>
        <button
          onClick={() => navigate('/consumer/complaints/new')}
          className="btn btn-primary gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          提交新投诉
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索订单号、商品名称、投诉编号..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn gap-2',
              showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-white/20 text-white text-xs rounded-full flex items-center justify-center">
                {(statusFilter !== 'all' ? 1 : 0) +
                  (typeFilter !== 'all' ? 1 : 0) +
                  (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {(showFilters || hasActiveFilters) && (
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                状态筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'btn !py-1.5 !px-3 text-xs',
                      statusFilter === filter.value
                        ? 'btn-primary'
                        : 'btn-secondary'
                    )}
                  >
                    {filter.label}
                    {statusCounts[filter.value] !== undefined && (
                      <span
                        className={cn(
                          'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                          statusFilter === filter.value
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        )}
                      >
                        {statusCounts[filter.value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                投诉类型
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setTypeFilter(filter.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'btn !py-1.5 !px-3 text-xs',
                      typeFilter === filter.value
                        ? 'btn-primary'
                        : 'btn-secondary'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-neutral-500 hover:text-danger-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">订单信息</th>
                <th className="table-header">投诉类型</th>
                <th className="table-header">金额</th>
                <th className="table-header">优先级</th>
                <th className="table-header">状态</th>
                <th className="table-header">提交时间</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComplaints.length > 0 ? (
                paginatedComplaints.map(complaint => (
                  <ComplaintRow
                    key={complaint.id}
                    complaint={complaint}
                    onView={() =>
                      navigate(`/consumer/complaints/${complaint.id}`)
                    }
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      onClear={clearFilters}
                      onCreate={() =>
                        navigate('/consumer/complaints/new')
                      }
                      hasFilters={hasActiveFilters}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3 p-4">
          {paginatedComplaints.length > 0 ? (
            paginatedComplaints.map(complaint => (
              <MobileComplaintCard
                key={complaint.id}
                complaint={complaint}
                onView={() =>
                  navigate(`/consumer/complaints/${complaint.id}`)
                }
              />
            ))
          ) : (
            <EmptyState
              onClear={clearFilters}
              onCreate={() => navigate('/consumer/complaints/new')}
              hasFilters={hasActiveFilters}
            />
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            第 {currentPage} / {totalPages} 页，共{' '}
            {filteredComplaints.length} 条记录
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary !p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'btn !w-9 !h-9 !p-0 text-sm',
                    currentPage === page
                      ? 'btn-primary'
                      : 'btn-secondary'
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage(p => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="btn btn-secondary !p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplaintRow({
  complaint,
  onView,
}: {
  complaint: Complaint;
  onView: () => void;
}) {
  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <img
            src={complaint.orderInfo.productImage}
            alt={complaint.orderInfo.productName}
            className="w-12 h-12 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium text-neutral-800 text-sm line-clamp-1">
              {truncateText(complaint.orderInfo.productName, 20)}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              订单：{complaint.orderId}
            </p>
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className="badge badge-primary">
          {COMPLAINT_TYPE_LABELS[complaint.type]}
        </span>
      </td>
      <td className="table-cell font-medium text-neutral-800">
        {formatCurrency(complaint.amount)}
      </td>
      <td className="table-cell">
        <span
          className={cn(
            'badge',
            getPriorityBadgeClass(complaint.priority)
          )}
        >
          {PRIORITY_LABELS[complaint.priority]}
        </span>
      </td>
      <td className="table-cell">
        <span
          className={cn(
            'badge',
            getStatusBadgeClass(complaint.status)
          )}
        >
          {COMPLAINT_STATUS_LABELS[complaint.status]}
        </span>
      </td>
      <td className="table-cell text-neutral-600 text-sm">
        {formatDate(complaint.createdAt, 'date')}
      </td>
      <td className="table-cell text-right">
        <button
          onClick={onView}
          className="btn btn-ghost text-primary-600 hover:text-primary-700 hover:bg-primary-50 !p-2"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function MobileComplaintCard({
  complaint,
  onView,
}: {
  complaint: Complaint;
  onView: () => void;
}) {
  return (
    <div
      onClick={onView}
      className="card card-hover p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <img
          src={complaint.orderInfo.productImage}
          alt={complaint.orderInfo.productName}
          className="w-14 h-14 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-neutral-800 text-sm line-clamp-1">
              {truncateText(complaint.orderInfo.productName, 18)}
            </h4>
            <span
              className={cn(
                'badge flex-shrink-0',
                getStatusBadgeClass(complaint.status)
              )}
            >
              {COMPLAINT_STATUS_LABELS[complaint.status]}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {complaint.orderId}
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="badge badge-primary text-xs">
              {COMPLAINT_TYPE_LABELS[complaint.type]}
            </span>
            <span className="text-sm font-medium text-neutral-800">
              {formatCurrency(complaint.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">
              {formatDate(complaint.createdAt, 'date')}
            </span>
            <span className="text-xs text-primary-600 flex items-center gap-1">
              查看详情
              <Eye className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onClear,
  onCreate,
  hasFilters,
}: {
  onClear: () => void;
  onCreate: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="p-12 text-center">
      <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
      {hasFilters ? (
        <>
          <p className="text-neutral-600 mb-1">没有找到匹配的投诉记录</p>
          <p className="text-sm text-neutral-500 mb-4">
            尝试调整筛选条件或清除筛选
          </p>
          <button onClick={onClear} className="btn btn-secondary gap-2">
            <X className="w-4 h-4" />
            清除筛选条件
          </button>
        </>
      ) : (
        <>
          <p className="text-neutral-600 mb-1">暂无投诉记录</p>
          <p className="text-sm text-neutral-500 mb-4">
            遇到消费纠纷？立即提交投诉，我们将为您维护权益
          </p>
          <button onClick={onCreate} className="btn btn-primary gap-2">
            <PlusCircle className="w-4 h-4" />
            提交投诉
          </button>
        </>
      )}
    </div>
  );
}
