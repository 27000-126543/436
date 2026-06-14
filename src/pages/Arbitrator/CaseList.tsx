import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Search,
  Filter,
  Crown,
  Clock,
  User,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Award,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  type Complaint,
} from '@/types';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getTimeRemaining,
  getStatusBadgeClass,
  getPriorityBadgeClass,
} from '@/utils/format';
import { getHighAmountThreshold } from '@/utils/calculation';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'pending' | 'awarded' | 'review';

const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'all', label: '全部案件', icon: <Scale size={16} />, desc: '查看所有分配的案件' },
  { key: 'pending', label: '待裁决', icon: <Clock size={16} />, desc: '需要及时处理的案件' },
  { key: 'awarded', label: '已裁决', icon: <CheckCircle2 size={16} />, desc: '已完成裁决的案件' },
  { key: 'review', label: '复核案件', icon: <RotateCcw size={16} />, desc: '需要再次仲裁的案件' },
];

export default function CaseList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { currentUser } = useAuthStore();
  const { complaints } = useComplaintStore();

  const highAmountThreshold = getHighAmountThreshold();

  const myCases = useMemo(() => {
    if (!currentUser) return [];
    return complaints.filter(c => c.arbitratorId === currentUser.id);
  }, [complaints, currentUser]);

  const filteredCases = useMemo(() => {
    let result = myCases;

    switch (activeTab) {
      case 'pending':
        result = result.filter(c => c.status === 'arbitrating' && !c.award);
        break;
      case 'awarded':
        result = result.filter(c => c.award);
        break;
      case 'review':
        result = result.filter(c => c.isReArbitration);
        break;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.consumerName.toLowerCase().includes(q) ||
        c.orderInfo.merchantName.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(c => c.priority === priorityFilter);
    }

    return result;
  }, [myCases, activeTab, searchQuery, typeFilter, priorityFilter]);

  const tabCounts = useMemo(() => ({
    all: myCases.length,
    pending: myCases.filter(c => c.status === 'arbitrating' && !c.award).length,
    awarded: myCases.filter(c => c.award).length,
    review: myCases.filter(c => c.isReArbitration).length,
  }), [myCases]);

  const isHighAmount = (amount: number) => amount >= highAmountThreshold;

  const TimeRemainingBadge = ({ complaint }: { complaint: Complaint }) => {
    if (!complaint.merchantResponseDeadline && !complaint.arbitrationAssignedAt) {
      return <span className="text-xs text-neutral-500">-</span>;
    }
    const deadline = complaint.merchantResponseDeadline ||
      new Date(new Date(complaint.arbitrationAssignedAt!).getTime() + 72 * 60 * 60 * 1000).toISOString();
    const remaining = getTimeRemaining(deadline);

    if (remaining.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600 bg-danger-50 px-2 py-1 rounded">
          <AlertCircle size={12} />
          已超时
        </span>
      );
    }

    const isUrgent = remaining.days === 0 && remaining.hours < 12;

    return (
      <span className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded',
        isUrgent ? 'text-danger-600 bg-danger-50' : 'text-warning-600 bg-warning-50'
      )}>
        <Clock size={12} />
        {remaining.days > 0 ? `${remaining.days}天${remaining.hours}小时` : `${remaining.hours}小时${remaining.minutes}分`}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 font-display flex items-center gap-2">
          <Scale size={26} className="text-primary-600" />
          仲裁案件池
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          共 {filteredCases.length} 件案件，{tabCounts.pending} 件待裁决
        </p>
      </div>

      <div className="card p-1.5 inline-flex gap-1 bg-neutral-100/50">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === tab.key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-white/50'
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'
            )}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索投诉号、订单号、标题、双方名称..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-36"
            >
              <option value="all">全部类型</option>
              {Object.entries(COMPLAINT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部优先级</option>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="card py-16 text-center">
            <Scale size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-lg font-medium text-neutral-600">暂无符合条件的案件</p>
            <p className="text-sm text-neutral-500 mt-1">尝试调整筛选条件</p>
          </div>
        ) : (
          filteredCases.map((complaint) => {
            const highAmt = isHighAmount(complaint.amount);
            return (
              <div
                key={complaint.id}
                onClick={() => navigate(`/arbitrator/case/${complaint.id}`)}
                className={cn(
                  'card card-hover cursor-pointer p-5 transition-all',
                  highAmt && 'border-warning-300 bg-gradient-to-r from-warning-50/50 to-transparent'
                )}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <img
                      src={complaint.orderInfo.productImage}
                      alt=""
                      className={cn(
                        'w-20 h-20 rounded-lg object-cover border-2',
                        highAmt ? 'border-warning-300' : 'border-neutral-200'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded">
                            {complaint.id}
                          </span>
                          <span className={cn('badge', getStatusBadgeClass(complaint.status))}>
                            {COMPLAINT_STATUS_LABELS[complaint.status]}
                          </span>
                          <span className={cn('badge', getPriorityBadgeClass(complaint.priority))}>
                            {PRIORITY_LABELS[complaint.priority]}
                          </span>
                          <span className="badge badge-info">
                            {COMPLAINT_TYPE_LABELS[complaint.type]}
                          </span>
                          {complaint.isReArbitration && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                              <RotateCcw size={12} />
                              复核案件
                            </span>
                          )}
                          {highAmt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
                              <Crown size={12} />
                              高金额 ¥{highAmountThreshold}+
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-neutral-800 mt-2 line-clamp-1">
                          {complaint.title}
                        </h3>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          'text-2xl font-bold font-display',
                          highAmt ? 'text-orange-600' : 'text-neutral-800'
                        )}>
                          {formatCurrency(complaint.amount)}
                        </p>
                        {complaint.award && (
                          <p className="text-xs text-success-600 mt-0.5 font-medium">
                            已赔付 {formatCurrency(complaint.award.compensationAmount)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <div className="w-7 h-7 rounded-full bg-info-100 flex items-center justify-center flex-shrink-0">
                          <User size={13} className="text-info-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500">消费者</p>
                          <p className="font-medium text-neutral-800 text-xs">{complaint.consumerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <div className="w-7 h-7 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
                          <Building2 size={13} className="text-warning-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500">商家</p>
                          <p className="font-medium text-neutral-800 text-xs line-clamp-1">{complaint.orderInfo.merchantName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <Clock size={13} className="text-neutral-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500">收到时间</p>
                          <p className="font-medium text-neutral-800 text-xs">
                            {formatDate(complaint.arbitrationAssignedAt || complaint.createdAt, 'short')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-start">
                        {!complaint.award ? (
                          <TimeRemainingBadge complaint={complaint} />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded">
                            <Award size={12} />
                            {formatRelativeTime(complaint.award.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500 mt-3 line-clamp-2 bg-neutral-50 p-3 rounded-lg">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end justify-between h-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/arbitrator/case/${complaint.id}`);
                      }}
                      className={cn(
                        'btn gap-1.5',
                        complaint.award ? 'btn-secondary' : 'btn-primary'
                      )}
                    >
                      {complaint.award ? '查看裁决' : '领取裁决'}
                      <ChevronRight size={14} />
                    </button>
                    {complaint.arbitratorName && (
                      <span className="text-[10px] text-neutral-500">
                        仲裁员：{complaint.arbitratorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
