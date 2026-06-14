import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Gavel,
  FileText,
  ArrowRight,
  Award,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  type Complaint,
} from '@/types';
import {
  formatCurrency,
  formatDate,
  getTimeRemaining,
  getPriorityBadgeClass,
} from '@/utils/format';
import { cn } from '@/lib/utils';

export default function ReviewList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { currentUser } = useAuthStore();
  const { complaints } = useComplaintStore();

  const reviewCases = useMemo(() => {
    return complaints.filter(c => c.isReArbitration);
  }, [complaints]);

  const filteredCases = useMemo(() => {
    let result = reviewCases;

    if (statusFilter === 'pending') {
      result = result.filter(c => !c.award);
    } else if (statusFilter === 'completed') {
      result = result.filter(c => c.award);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.parentComplaintId?.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.consumerName.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(c => c.type === typeFilter);
    }

    return result;
  }, [reviewCases, searchQuery, typeFilter, statusFilter]);

  const originalCaseMap = useMemo(() => {
    const map: Record<string, Complaint> = {};
    complaints.forEach(c => { map[c.id] = c; });
    return map;
  }, [complaints]);

  const stats = useMemo(() => ({
    total: reviewCases.length,
    pending: reviewCases.filter(c => !c.award).length,
    completed: reviewCases.filter(c => c.award).length,
  }), [reviewCases]);

  const TimeRemainingBadge = ({ complaint }: { complaint: Complaint }) => {
    if (!complaint.arbitrationAssignedAt) {
      return <span className="text-xs text-neutral-500">-</span>;
    }
    const deadline = new Date(new Date(complaint.arbitrationAssignedAt).getTime() + 72 * 60 * 60 * 1000).toISOString();
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

  const liabilityLabel = (liability: string) => {
    switch (liability) {
      case 'merchant': return '商家全责';
      case 'consumer': return '消费者责任';
      case 'both': return '双方责任';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 font-display flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            再次仲裁复核
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            终裁案件管理 - 本页面案件裁决结果为最终裁定，不可再上诉
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 border border-purple-200">
            <Shield size={16} className="text-purple-600" />
            <span className="text-sm text-purple-700 font-medium">终裁标识</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">复核案件总数</p>
              <p className="text-3xl font-bold text-purple-700 mt-2 font-display">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <RotateCcw size={22} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-200/50 flex items-center gap-2 text-xs text-purple-600">
            <Shield size={12} />
            <span>均为当事人申请的二次仲裁</span>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-warning-50 to-orange-50 border-warning-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning-600 font-medium">待终裁案件</p>
              <p className="text-3xl font-bold text-warning-700 mt-2 font-display">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Clock size={22} className="text-warning-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-warning-200/50 flex items-center gap-2 text-xs text-warning-600">
            <AlertCircle size={12} />
            <span>需在 72 小时内作出终裁</span>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-success-50 to-emerald-50 border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success-600 font-medium">已完成终裁</p>
              <p className="text-3xl font-bold text-success-700 mt-2 font-display">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <CheckCircle2 size={22} className="text-success-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-success-200/50 flex items-center gap-2 text-xs text-success-600">
            <Award size={12} />
            <span>裁决结果已生效</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索投诉号、原案件号、标题、消费者..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input w-32"
            >
              <option value="all">全部状态</option>
              <option value="pending">待终裁</option>
              <option value="completed">已完成</option>
            </select>
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
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {filteredCases.length === 0 ? (
          <div className="card py-16 text-center">
            <Shield size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-lg font-medium text-neutral-600">暂无复核案件</p>
            <p className="text-sm text-neutral-500 mt-1">当事人申请再次仲裁的案件将显示在此处</p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const originalCase = c.parentComplaintId ? originalCaseMap[c.parentComplaintId] : undefined;
            return (
              <div
                key={c.id}
                className="card overflow-hidden border-purple-200 bg-gradient-to-r from-purple-50/30 via-white to-transparent"
              >
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                      <Shield size={12} />
                      终裁案件
                    </span>
                    <span className="font-mono text-xs text-white/90 bg-white/10 px-2 py-0.5 rounded">
                      {c.id}
                    </span>
                    {originalCase && (
                      <span className="text-xs text-white/80 flex items-center gap-1">
                        原案件：
                        <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">
                          {originalCase.id}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge', getPriorityBadgeClass(c.priority))}>
                      {PRIORITY_LABELS[c.priority]}
                    </span>
                    <span className="badge badge-info">
                      {COMPLAINT_TYPE_LABELS[c.type]}
                    </span>
                    {!c.award ? (
                      <span className="badge badge-warning animate-pulse">
                        待终裁
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        已终裁
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      <img
                        src={c.orderInfo.productImage}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover border-2 border-purple-200"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-800 line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {c.description}
                      </p>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-info-100 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-info-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500">申诉方（消费者）</p>
                            <p className="font-medium text-neutral-800 text-xs">{c.consumerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
                            <Building2 size={13} className="text-warning-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500">被申诉方（商家）</p>
                            <p className="font-medium text-neutral-800 text-xs line-clamp-1">{c.orderInfo.merchantName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                            <Clock size={13} className="text-neutral-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500">分配时间</p>
                            <p className="font-medium text-neutral-800 text-xs">
                              {formatDate(c.arbitrationAssignedAt || c.createdAt, 'short')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-start">
                          {!c.award ? (
                            <TimeRemainingBadge complaint={c} />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded">
                              <CheckCircle2 size={12} />
                              已完成
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-neutral-500">涉案金额</p>
                      <p className="text-2xl font-bold text-purple-700 font-display">
                        {formatCurrency(c.amount)}
                      </p>
                      {c.award && (
                        <p className="text-xs text-success-600 mt-1 font-medium">
                          终裁赔付 {formatCurrency(c.award.compensationAmount)}
                        </p>
                      )}
                    </div>
                  </div>

                  {originalCase && originalCase.award && (
                    <div className="mt-5 p-4 bg-gradient-to-r from-neutral-50 to-purple-50/50 rounded-xl border border-neutral-200">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={14} className="text-purple-600" />
                        <span className="text-sm font-semibold text-neutral-700">原仲裁结果</span>
                        <span className="text-xs text-neutral-500">
                          （当事人不服本裁决，申请再次仲裁）
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-0.5">原裁决员</p>
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-neutral-400" />
                            <span className="font-medium text-neutral-800">{originalCase.award.arbitratorName}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-0.5">原责任判定</p>
                          <span className="inline-flex items-center px-2 py-0.5 bg-warning-100 text-warning-700 text-xs rounded font-medium">
                            {liabilityLabel(originalCase.award.liability)}
                            {originalCase.award.liability === 'both' && ` (${originalCase.award.merchantLiabilityPercent}%)`}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-0.5">原赔付金额</p>
                          <span className="font-bold text-neutral-800">{formatCurrency(originalCase.award.compensationAmount)}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-0.5">原裁决时间</p>
                          <span className="text-neutral-700">{formatDate(originalCase.award.createdAt, 'date')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-3 line-clamp-2 bg-white p-2.5 rounded-lg border border-neutral-100">
                        <span className="font-medium text-neutral-600">裁决摘要：</span>
                        {originalCase.award.content}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Gavel size={12} />
                      <span>本案为终裁，裁决结果具有最终法律效力</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {originalCase && (
                        <button
                          onClick={() => navigate(`/arbitrator/case/${originalCase.id}`)}
                          className="btn btn-secondary gap-1.5 text-xs"
                        >
                          <FileText size={14} />
                          查看原案件
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/arbitrator/case/${c.id}`)}
                        className={cn('btn gap-1.5', c.award ? 'btn-secondary' : 'btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent hover:from-purple-700 hover:to-indigo-700')}
                      >
                        <Shield size={14} />
                        {c.award ? '查看终裁结果' : '作出终裁裁决'}
                        <ArrowRight size={14} />
                      </button>
                    </div>
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
