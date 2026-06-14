import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Wallet,
  PlusCircle,
  Eye,
  Download,
  ChevronRight,
  Bell,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getStatusBadgeClass,
} from '@/utils/format';
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
  type Complaint,
  type Message,
} from '@/types';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'info' | 'warning' | 'success';
  trend?: string;
  trendUp?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
}: StatCardProps) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    info: 'bg-info-50 text-info-600',
    warning: 'bg-warning-50 text-warning-600',
    success: 'bg-success-50 text-success-600',
  };

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-800">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 flex items-center gap-1',
                trendUp ? 'text-success-600' : 'text-neutral-500'
              )}
            >
              <ArrowRight
                className={cn(
                  'w-3 h-3',
                  trendUp && '-rotate-45',
                  !trendUp && 'rotate-45'
                )}
              />
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colorClasses[color]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: string;
}

function QuickAction({
  label,
  description,
  icon: Icon,
  onClick,
  color,
}: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="card card-hover p-5 text-left group"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            color
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
              {label}
            </h3>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-sm text-neutral-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

function ComplaintCard({
  complaint,
  onClick,
}: {
  complaint: Complaint;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card card-hover p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <img
          src={complaint.orderInfo.productImage}
          alt={complaint.orderInfo.productName}
          className="w-16 h-16 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-neutral-800 text-sm line-clamp-1">
              {complaint.orderInfo.productName}
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
          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
            {complaint.title}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="badge badge-primary">
                {COMPLAINT_TYPE_LABELS[complaint.type]}
              </span>
              <span>{formatCurrency(complaint.amount)}</span>
            </div>
            <span className="text-xs text-neutral-400">
              {formatRelativeTime(complaint.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> =
    {
      complaint_assigned: FileText,
      mediation_needed: MessageSquare,
      arbitration_needed: AlertCircle,
      award_published: Award,
      credit_changed: ShieldCheck,
      compensation_done: Wallet,
      system: Bell,
      timeout_warning: AlertCircle,
    };

  const typeColors: Record<string, string> = {
    complaint_assigned: 'bg-primary-50 text-primary-600',
    mediation_needed: 'bg-info-50 text-info-600',
    arbitration_needed: 'bg-warning-50 text-warning-600',
    award_published: 'bg-success-50 text-success-600',
    credit_changed: 'bg-warning-50 text-warning-600',
    compensation_done: 'bg-success-50 text-success-600',
    system: 'bg-neutral-100 text-neutral-600',
    timeout_warning: 'bg-danger-50 text-danger-600',
  };

  const Icon = typeIcons[message.type] || Bell;
  const colorClass = typeColors[message.type] || 'bg-neutral-100 text-neutral-600';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        !message.isRead ? 'bg-primary-50/50' : 'hover:bg-neutral-50'
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          colorClass
        )}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm',
              !message.isRead
                ? 'font-medium text-neutral-800'
                : 'text-neutral-700'
            )}
          >
            {message.title}
          </p>
          {!message.isRead && (
            <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
          {message.content}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const {
    getConsumerComplaints,
    messages,
    compensations,
    autoProcessAssignments,
  } = useComplaintStore();

  const consumerId = currentUser?.id || 'consumer_001';
  const consumerName = currentUser?.realName || '张小明';

  const complaints = useMemo(
    () => getConsumerComplaints(consumerId),
    [consumerId, getConsumerComplaints]
  );

  useMemo(() => {
    autoProcessAssignments();
  }, [autoProcessAssignments]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const processing = complaints.filter(c =>
      ['pending', 'assigned', 'mediating', 'mediated', 'arbitrating'].includes(
        c.status
      )
    ).length;
    const completed = complaints.filter(c =>
      ['awarded', 'closed'].includes(c.status)
    ).length;

    const paidCompensations = compensations.filter(
      c => c.status === 'paid'
    );
    const complaintIdsWithPaidComp = paidCompensations.map(c => c.complaintId);
    const totalCompensation =
      paidCompensations.reduce((sum, c) => sum + c.amount, 0) +
      complaints
        .filter(
          c =>
            c.award &&
            c.award.compensationAmount > 0 &&
            !complaintIdsWithPaidComp.includes(c.id) &&
            c.status === 'awarded'
        )
        .reduce((sum, c) => sum + (c.award?.compensationAmount || 0), 0);

    return {
      total,
      processing,
      completed,
      totalCompensation,
    };
  }, [complaints, compensations]);

  const recentComplaints = useMemo(
    () => [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [complaints]
  );

  const recentMessages = useMemo(() => {
    return messages
      .filter(m => m.recipientId === consumerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [messages, consumerId]);

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 lg:p-8 border-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm text-primary-100">消费者权益保障中心</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              您好，{consumerName}
            </h1>
            <p className="text-primary-100 mt-1">
              您的权益我们守护，如有消费纠纷，请随时提交投诉
            </p>
          </div>
          <button
            onClick={() => navigate('/consumer/complaints/new')}
            className="btn bg-white text-primary-600 border-white hover:bg-primary-50 !py-3 !px-6 font-medium gap-2 self-start lg:self-center shadow-lg"
          >
            <PlusCircle className="w-5 h-5" />
            立即提交投诉
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="投诉总数"
          value={stats.total}
          icon={FileText}
          color="primary"
          trend="本月数据"
        />
        <StatCard
          title="处理中"
          value={stats.processing}
          icon={Clock}
          color="warning"
          trend="请耐心等待"
          trendUp={false}
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle}
          color="success"
          trend={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% 完成率`}
          trendUp
        />
        <StatCard
          title="累计获赔"
          value={formatCurrency(stats.totalCompensation)}
          icon={Wallet}
          color="info"
          trend="已到账金额"
          trendUp
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          label="提交投诉"
          description="快速发起消费纠纷投诉"
          icon={PlusCircle}
          onClick={() => navigate('/consumer/complaints/new')}
          color="bg-primary-50 text-primary-600"
        />
        <QuickAction
          label="查看进度"
          description="跟踪投诉处理进度"
          icon={Eye}
          onClick={() => navigate('/consumer/complaints')}
          color="bg-info-50 text-info-600"
        />
        <QuickAction
          label="下载裁决书"
          description="查看并下载仲裁裁决"
          icon={Download}
          onClick={() => navigate('/consumer/awards')}
          color="bg-success-50 text-success-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800">
              最近投诉
            </h2>
            <button
              onClick={() => navigate('/consumer/complaints')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onClick={() =>
                    navigate(`/consumer/complaints/${complaint.id}`)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">暂无投诉记录</p>
              <button
                onClick={() => navigate('/consumer/complaints/new')}
                className="btn btn-primary mt-4 gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                提交第一笔投诉
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-800">
              消息通知
            </h2>
            <span className="badge badge-primary">
              {recentMessages.filter(m => !m.isRead).length} 未读
            </span>
          </div>
          <div className="card divide-y divide-neutral-100">
            {recentMessages.length > 0 ? (
              recentMessages.map(message => (
                <MessageItem key={message.id} message={message} />
              ))
            ) : (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">暂无消息</p>
              </div>
            )}
          </div>
          <div className="card p-4 bg-primary-50/50 border-primary-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-800 text-sm">
                  权益保障小贴士
                </h4>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  如遇消费纠纷，请在收到商品后15日内提交投诉，并保留好聊天记录、商品照片等证据，有助于更快处理。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden">
        {formatDate('')}
      </div>
    </div>
  );
}
