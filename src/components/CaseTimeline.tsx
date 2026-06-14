import { useMemo } from 'react';
import {
  User,
  Headphones,
  Scale,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Complaint, Compensation } from '@/types';
import { COMPLAINT_TYPE_LABELS } from '@/types';

interface CaseTimelineProps {
  complaint: Complaint;
  compensation?: Compensation;
  className?: string;
}

export function CaseTimeline({ complaint, compensation, className }: CaseTimelineProps) {
  const nodes = useMemo(() => {
    const result: Array<{
      id: string;
      title: string;
      icon: React.ReactNode;
      status: 'done' | 'active' | 'pending';
      person?: string;
      time?: string;
      summary?: string[];
    }> = [];

    result.push({
      id: 'submit',
      title: '投诉提交',
      icon: <User size={16} />,
      status: 'done',
      person: complaint.consumerName,
      time: complaint.createdAt,
      summary: [
        `投诉类型：${COMPLAINT_TYPE_LABELS[complaint.type]}`,
        `投诉金额：${formatCurrency(complaint.amount)}`,
        `问题描述：${complaint.title}`,
      ],
    });

    if (complaint.serviceName || complaint.mediationRecord) {
      const isDone = complaint.mediationRecord && (complaint.status === 'mediated' || complaint.status === 'arbitrating' || complaint.status === 'awarded' || complaint.status === 'closed');
      const isActive = complaint.status === 'assigned' || complaint.status === 'mediating';
      result.push({
        id: 'mediation',
        title: '客服调解',
        icon: <Headphones size={16} />,
        status: isDone ? 'done' : isActive ? 'active' : 'pending',
        person: complaint.serviceName,
        time: complaint.assignedAt || complaint.mediationRecord?.createdAt,
        summary: complaint.mediationRecord ? [
          `调解方案：${complaint.mediationRecord.solution}`,
          `建议赔付：${formatCurrency(complaint.mediationRecord.proposedAmount)}`,
          complaint.consumerSatisfied === true ? '消费者认可调解方案' : complaint.consumerSatisfied === false ? '消费者不认可，转入仲裁' : '调解进行中',
        ] : ['等待客服处理'],
      });
    }

    if (complaint.arbitratorName || complaint.award) {
      const isDone = !!complaint.award;
      const isActive = complaint.status === 'arbitrating' && !complaint.award;
      result.push({
        id: 'arbitration',
        title: complaint.isReArbitration ? '终裁裁决' : '仲裁裁决',
        icon: <Scale size={16} />,
        status: isDone ? 'done' : isActive ? 'active' : 'pending',
        person: complaint.arbitratorName,
        time: complaint.arbitrationAssignedAt || complaint.award?.createdAt,
        summary: complaint.award ? [
          `责任判定：${complaint.award.liability === 'merchant' ? '商家全责' : complaint.award.liability === 'consumer' ? '消费者责任' : '双方责任'}`,
          `赔付金额：${formatCurrency(complaint.award.compensationAmount)}`,
          complaint.isReArbitration || complaint.award.isFinal ? '本裁决为终裁结果' : '裁决已发布，可申请再次仲裁',
        ] : ['仲裁审理中'],
      });
    }

    if (complaint.award) {
      const comp = compensation;
      let status: 'done' | 'active' | 'pending' = 'pending';
      let statusText = '待赔付';
      if (comp) {
        if (comp.status === 'paid') {
          status = 'done';
          statusText = '已赔付';
        } else if (comp.status === 'failed') {
          status = 'pending';
          statusText = '打款失败';
        } else {
          status = 'active';
          statusText = '赔付中';
        }
      }
      result.push({
        id: 'compensation',
        title: '赔付执行',
        icon: <Wallet size={16} />,
        status,
        person: '平台财务',
        time: comp?.paidAt || comp?.createdAt,
        summary: [
          `赔付金额：${formatCurrency(complaint.award.compensationAmount)}`,
          comp ? `赔付单号：${comp.id}` : '赔付单待生成',
          comp && comp.status === 'paid' ? `到账时间：${formatDate(comp.paidAt || comp.createdAt, 'full')}` : '',
          comp && comp.status === 'failed' ? '打款失败，请联系客服' : '',
        ].filter(Boolean) as string[],
      });
    }

    return result;
  }, [complaint, compensation]);

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          案件流转看板
        </h3>
      </div>
      <div className="p-5">
        {complaint.isReArbitration && complaint.parentComplaintId && (
          <div className="mb-5 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 flex items-center gap-2">
            <RotateCcw size={16} className="text-purple-600" />
            <span className="text-sm text-purple-800">
              本案为 <span className="font-semibold">终裁复核案件</span>，原案件编号：
              <span className="font-mono font-medium">{complaint.parentComplaintId}</span>
            </span>
          </div>
        )}

        <div className="relative pl-2">
          {nodes.map((node, idx) => (
            <div key={node.id} className="relative pb-6 last:pb-0">
              {idx < nodes.length - 1 && (
                <div className={cn(
                  'absolute left-4 top-9 w-0.5 h-full -ml-px',
                  node.status === 'done' ? 'bg-success-300' : 'bg-neutral-200'
                )} />
              )}
              
              <div className="flex gap-4">
                <div className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  node.status === 'done' ? 'bg-success-500 text-white' :
                  node.status === 'active' ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
                  'bg-neutral-200 text-neutral-500'
                )}>
                  {node.status === 'done' ? <CheckCircle2 size={16} /> : node.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      'font-semibold',
                      node.status === 'done' ? 'text-neutral-800' :
                      node.status === 'active' ? 'text-primary-700' :
                      'text-neutral-400'
                    )}>
                      {node.title}
                    </h4>
                    {node.status === 'active' && (
                      <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                        进行中
                      </span>
                    )}
                    {node.status === 'done' && node.id === 'compensation' && compensation?.status === 'failed' && (
                      <span className="text-[10px] bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                        <AlertCircle size={10} />
                        打款失败
                      </span>
                    )}
                  </div>
                  {node.person && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {node.person}
                      {node.time && ` · ${formatDate(node.time, 'full')}`}
                    </p>
                  )}
                  {node.summary && node.summary.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {node.summary.map((item, i) => (
                        <p key={i} className="text-xs text-neutral-600 leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
