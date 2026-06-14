import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Package,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Video,
  File,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gavel,
  Scale,
  ChevronRight,
  Crown,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  type Evidence,
  type Award,
} from '@/types';
import {
  formatCurrency,
  formatDate,
  getTimeRemaining,
  truncateText,
  getStatusBadgeClass,
  getPriorityBadgeClass,
} from '@/utils/format';
import { calculateCompensation, getHighAmountThreshold } from '@/utils/calculation';
import { cn } from '@/lib/utils';

type LiabilityType = 'merchant' | 'both' | 'consumer';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getComplaintById, submitAward, addMessage } = useComplaintStore();

  const complaint = useMemo(() => (id ? getComplaintById(id) : undefined), [id, getComplaintById]);

  const [liability, setLiability] = useState<LiabilityType>('merchant');
  const [merchantPercent, setMerchantPercent] = useState<number>(100);
  const [awardContent, setAwardContent] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<Evidence | null>(null);

  useEffect(() => {
    if (complaint?.award) {
      setLiability(complaint.award.liability);
      setMerchantPercent(complaint.award.merchantLiabilityPercent);
      setAwardContent(complaint.award.content);
    }
  }, [complaint]);

  const isHighAmount = complaint ? complaint.amount >= getHighAmountThreshold() : false;
  const isReadOnly = !!complaint?.award;

  const compensationAmount = useMemo(() => {
    if (!complaint) return 0;
    return calculateCompensation(complaint, liability, merchantPercent);
  }, [complaint, liability, merchantPercent]);

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-600">案件不存在</h2>
        <button
          onClick={() => navigate('/arbitrator/cases')}
          className="btn btn-primary mt-4 gap-2"
        >
          <ArrowLeft size={16} />
          返回案件池
        </button>
      </div>
    );
  }

  const handleLiabilityChange = (value: LiabilityType) => {
    setLiability(value);
    if (value === 'merchant') setMerchantPercent(100);
    if (value === 'consumer') setMerchantPercent(0);
    if (value === 'both' && merchantPercent === 0) setMerchantPercent(50);
    if (value === 'both' && merchantPercent === 100) setMerchantPercent(50);
  };

  const handleSubmitAward = () => {
    if (!complaint || !currentUser) return;

    submitAward(complaint.id, {
      arbitratorId: currentUser.id,
      arbitratorName: currentUser.realName,
      content: awardContent,
      liability,
      merchantLiabilityPercent: merchantPercent,
      compensationAmount,
      documentUrl: `/documents/${complaint.id}.pdf`,
      isFinal: complaint.isReArbitration ? true : undefined,
    });

    addMessage({
      recipientId: complaint.consumerId,
      recipientRole: 'consumer',
      type: 'award_published',
      title: '仲裁结果已发布',
      content: `您的投诉（${complaint.orderInfo.productName.slice(0, 20)}...）已作出仲裁裁决${compensationAmount > 0 ? `，赔付金额${formatCurrency(compensationAmount)}` : ''}。`,
      relatedId: complaint.id,
      relatedType: 'award',
    });

    setShowConfirmModal(false);
  };

  const deadline = complaint.merchantResponseDeadline ||
    (complaint.arbitrationAssignedAt
      ? new Date(new Date(complaint.arbitrationAssignedAt).getTime() + 72 * 60 * 60 * 1000).toISOString()
      : new Date().toISOString());
  const remaining = getTimeRemaining(deadline);

  const EvidenceGallery = ({ evidence, side }: { evidence: Evidence[]; side: 'left' | 'right' }) => {
    const typeIcon = (type: Evidence['type']) => {
      switch (type) {
        case 'image': return <ImageIcon size={14} />;
        case 'chat': return <MessageSquare size={14} />;
        case 'video': return <Video size={14} />;
        case 'document': return <File size={14} />;
      }
    };

    return (
      <div className="grid grid-cols-3 gap-2">
        {evidence.map((evi) => (
          <button
            key={evi.id}
            onClick={() => evi.type === 'image' && setPreviewImage(evi)}
            className={cn(
              'group relative aspect-square rounded-lg overflow-hidden border transition-all',
              side === 'left' ? 'border-info-200 hover:border-info-400' : 'border-warning-200 hover:border-warning-400',
              evi.type === 'image' ? 'cursor-zoom-in' : 'cursor-pointer'
            )}
          >
            {evi.type === 'image' ? (
              <img src={evi.url} alt={evi.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className={cn(
                'w-full h-full flex flex-col items-center justify-center gap-1',
                side === 'left' ? 'bg-info-50 text-info-600' : 'bg-warning-50 text-warning-600'
              )}>
                {typeIcon(evi.type)}
                <span className="text-[10px] font-medium px-1 text-center truncate w-full">{evi.name}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white truncate">{evi.name}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/arbitrator/cases')}
            className="w-10 h-10 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} className="text-neutral-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-800 font-display">裁决工作台</h1>
              <span className="font-mono text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-semibold">
                {complaint.id}
              </span>
              {complaint.isReArbitration && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                  <Shield size={12} />
                  终裁案件
                </span>
              )}
              {isHighAmount && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full">
                  <Crown size={12} />
                  高金额
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              {COMPLAINT_TYPE_LABELS[complaint.type]} · {PRIORITY_LABELS[complaint.priority]} · 分配于 {formatDate(complaint.arbitrationAssignedAt || complaint.createdAt, 'full')}
            </p>
          </div>
        </div>
        {!isReadOnly && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border',
            remaining.isExpired ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'
          )}>
            <Clock size={16} className={remaining.isExpired ? 'text-danger-500' : 'text-warning-600'} />
            <div className="text-sm">
              <span className="text-neutral-600">剩余裁决时间：</span>
              <span className={cn('font-semibold', remaining.isExpired ? 'text-danger-600' : 'text-warning-700')}>
                {remaining.isExpired ? '已超时' : `${remaining.days > 0 ? remaining.days + '天' : ''}${remaining.hours}小时${remaining.minutes}分`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 bg-gradient-to-r from-primary-50/50 via-white to-warning-50/30">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            <img
              src={complaint.orderInfo.productImage}
              alt=""
              className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-800 line-clamp-1">{complaint.title}</h2>
                <div className="flex items-center gap-2 mt-1.5 text-sm text-neutral-600">
                  <Package size={14} />
                  <span className="line-clamp-1">{complaint.orderInfo.productName}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                  <span>订单号：<span className="font-mono text-neutral-700">{complaint.orderId}</span></span>
                  <span>下单时间：{formatDate(complaint.orderInfo.orderTime, 'date')}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-neutral-500">涉案金额</p>
                <p className={cn(
                  'text-2xl font-bold font-display',
                  isHighAmount ? 'text-orange-600' : 'text-primary-700'
                )}>
                  {formatCurrency(complaint.amount)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-info-100 flex items-center justify-center">
                  <User size={16} className="text-info-600" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500">消费者</p>
                  <p className="text-sm font-medium text-neutral-800">{complaint.consumerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-warning-100 flex items-center justify-center">
                  <Building2 size={16} className="text-warning-600" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500">商家</p>
                  <p className="text-sm font-medium text-neutral-800 line-clamp-1">{complaint.orderInfo.merchantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <Gavel size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500">仲裁员</p>
                  <p className="text-sm font-medium text-neutral-800">{complaint.arbitratorName || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', getStatusBadgeClass(complaint.status).replace('badge-', 'bg-').replace('text-', 'text-').split(' ')[0] + ' text-' + getStatusBadgeClass(complaint.status).replace('badge-', 'bg-').split(' text-')[1])}>
                  <Scale size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500">当前状态</p>
                  <span className={cn('badge', getStatusBadgeClass(complaint.status))}>
                    {complaint.award ? (complaint.isReArbitration || complaint.award.isFinal ? '已终裁' : '已裁决') : '仲裁中'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-info-500 to-info-600 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <h3 className="font-semibold">消费者主张</h3>
                <p className="text-xs text-info-100">{complaint.consumerName}</p>
              </div>
            </div>
            <div className="text-right text-xs text-info-100">
              <p>提交于</p>
              <p className="text-white font-medium">{formatDate(complaint.createdAt, 'short')}</p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-2">
                <FileText size={14} className="text-info-500" />
                投诉内容
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed bg-info-50/50 p-4 rounded-lg border border-info-100">
                {complaint.description}
              </p>
            </div>
            {complaint.mediationRecord && complaint.mediationRecord.communicationRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-2">
                  <MessageSquare size={14} className="text-info-500" />
                  沟通记录
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {complaint.mediationRecord.communicationRecords.map((record) => (
                    <div
                      key={record.id}
                      className={cn(
                        'p-3 rounded-lg text-sm border',
                        record.sender === 'consumer'
                          ? 'bg-info-50 border-info-100'
                          : record.sender === 'merchant'
                            ? 'bg-warning-50 border-warning-100'
                            : 'bg-neutral-50 border-neutral-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          'text-xs font-medium',
                          record.sender === 'consumer' ? 'text-info-700' :
                          record.sender === 'merchant' ? 'text-warning-700' : 'text-neutral-700'
                        )}>
                          {record.senderName}
                        </span>
                        <span className="text-[10px] text-neutral-500">{formatDate(record.createdAt, 'short')}</span>
                      </div>
                      <p className="text-neutral-600">{record.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-3">
                <ImageIcon size={14} className="text-info-500" />
                证据材料
                <span className="text-xs font-normal text-neutral-500">({complaint.evidence.length} 份)</span>
              </h4>
              {complaint.evidence.length > 0 ? (
                <EvidenceGallery evidence={complaint.evidence} side="left" />
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed border-neutral-200 rounded-lg">
                  暂无证据材料
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-warning-500 to-orange-500 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="font-semibold">商家申诉</h3>
                <p className="text-xs text-warning-100">{complaint.orderInfo.merchantName}</p>
              </div>
            </div>
            <div className="text-right text-xs text-warning-100">
              <p>提交于</p>
              <p className="text-white font-medium">
                {complaint.merchantAppeal ? formatDate(complaint.merchantAppeal.submittedAt, 'short') : '未申诉'}
              </p>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-2">
                <FileText size={14} className="text-warning-500" />
                申诉内容
              </h4>
              {complaint.merchantAppeal ? (
                <p className="text-sm text-neutral-600 leading-relaxed bg-warning-50/50 p-4 rounded-lg border border-warning-100">
                  {complaint.merchantAppeal.content}
                </p>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-center">
                  {complaint.merchantTimeout ? (
                    <div className="text-danger-600">
                      <AlertTriangle size={20} className="mx-auto mb-1" />
                      <p className="text-sm font-medium">商家已超时未回应</p>
                      <p className="text-xs text-neutral-500 mt-0.5">按规则将默认支持消费者主张</p>
                    </div>
                  ) : (
                    <div className="text-neutral-500">
                      <XCircle size={20} className="mx-auto mb-1" />
                      <p className="text-sm">商家暂未提交申诉</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {complaint.mediationRecord && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-2">
                  <MessageSquare size={14} className="text-warning-500" />
                  调解建议
                </h4>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
                  <p className="text-neutral-600">{complaint.mediationRecord.content}</p>
                  <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      调解员：{complaint.mediationRecord.serviceName}
                    </span>
                    <span className="text-xs text-primary-600 font-medium">
                      建议赔付：{formatCurrency(complaint.mediationRecord.proposedAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-3">
                <ImageIcon size={14} className="text-warning-500" />
                商家凭证
                <span className="text-xs font-normal text-neutral-500">({complaint.merchantAppeal?.evidence.length || 0} 份)</span>
              </h4>
              {complaint.merchantAppeal?.evidence && complaint.merchantAppeal.evidence.length > 0 ? (
                <EvidenceGallery evidence={complaint.merchantAppeal.evidence} side="right" />
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed border-neutral-200 rounded-lg">
                  暂无凭证材料
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden border-primary-200 bg-gradient-to-b from-primary-50/30 to-white">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Gavel size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">仲裁裁决</h3>
              <p className="text-xs text-primary-100">请根据双方举证作出公正裁决</p>
            </div>
          </div>
          {isReadOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              <CheckCircle2 size={14} />
              裁决已提交
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-3 block flex items-center gap-1.5">
              <Scale size={14} className="text-primary-600" />
              责任判定
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: 'merchant' as LiabilityType,
                  label: '商家全责',
                  desc: '商家承担全部责任',
                  icon: <Building2 size={20} />,
                  color: 'warning',
                },
                {
                  key: 'both' as LiabilityType,
                  label: '双方责任',
                  desc: '按比例分担责任',
                  icon: <Scale size={20} />,
                  color: 'info',
                },
                {
                  key: 'consumer' as LiabilityType,
                  label: '消费者责任',
                  desc: '消费者承担全部责任',
                  icon: <User size={20} />,
                  color: 'neutral',
                },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleLiabilityChange(option.key)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    liability === option.key
                      ? option.color === 'warning' ? 'border-warning-400 bg-warning-50 shadow-sm'
                        : option.color === 'info' ? 'border-info-400 bg-info-50 shadow-sm'
                        : 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300',
                    isReadOnly && 'cursor-not-allowed opacity-80'
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      liability === option.key
                        ? option.color === 'warning' ? 'bg-warning-500 text-white'
                          : option.color === 'info' ? 'bg-info-500 text-white'
                          : 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-500'
                    )}>
                      {option.icon}
                    </div>
                    <span className={cn(
                      'font-semibold',
                      liability === option.key
                        ? option.color === 'warning' ? 'text-warning-700'
                          : option.color === 'info' ? 'text-info-700'
                          : 'text-primary-700'
                        : 'text-neutral-700'
                    )}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 ml-10.5 pl-10.5" style={{ paddingLeft: 42 }}>
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {liability === 'both' && (
            <div className="bg-info-50/50 border border-info-200 rounded-xl p-5">
              <label className="text-sm font-semibold text-neutral-700 mb-4 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale size={14} className="text-info-600" />
                  责任比例划分
                </span>
                <span className="text-lg font-bold text-info-700 font-display">
                  商家 {merchantPercent}% / 消费者 {100 - merchantPercent}%
                </span>
              </label>
              <div className="relative px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={merchantPercent}
                  onChange={(e) => setMerchantPercent(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="w-full h-3 bg-gradient-to-r from-info-200 via-white to-primary-200 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed accent-info-500"
                  style={{
                    background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${merchantPercent}%, #e5e7eb ${merchantPercent}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-success-50 to-primary-50 rounded-xl p-5 border border-success-200/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success-600" />
                赔付金额（自动计算）
              </label>
              <span className="text-xs text-neutral-500">
                涉案金额 {formatCurrency(complaint.amount)} × 责任比例 {liability === 'merchant' ? '100%' : liability === 'consumer' ? '0%' : merchantPercent + '%'}
              </span>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-4xl font-bold font-display bg-gradient-to-r from-success-600 to-primary-600 bg-clip-text text-transparent">
                  {formatCurrency(compensationAmount)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {liability === 'consumer' ? '消费者自行承担，无需赔付' : `商家需向消费者赔付 ${formatCurrency(compensationAmount)}`}
                </p>
              </div>
              {liability !== 'consumer' && compensationAmount > 0 && (
                <div className="flex items-center gap-2 text-xs text-success-700 bg-white px-3 py-1.5 rounded-lg border border-success-200">
                  <CheckCircle2 size={12} />
                  已根据规则校验
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-3 block flex items-center gap-1.5">
              <FileText size={14} className="text-primary-600" />
              裁决理由
              <span className="text-xs font-normal text-neutral-500">（详细说明裁决依据）</span>
            </label>
            <textarea
              value={awardContent}
              onChange={(e) => setAwardContent(e.target.value)}
              disabled={isReadOnly}
              rows={6}
              placeholder="请详细说明裁决的事实依据、法律/规则依据，以及责任判定理由..."
              className="input-textarea text-sm leading-relaxed disabled:bg-neutral-50 disabled:text-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-2 text-right">
              {awardContent.length} 字 / 建议 200 字以上
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              {complaint.award && (
                <button className="btn btn-secondary gap-2">
                  <Download size={16} />
                  下载裁决书
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/arbitrator/cases')}
                className="btn btn-secondary"
              >
                返回案件池
              </button>
              {!isReadOnly && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!awardContent.trim() || awardContent.length < 50}
                  className="btn btn-primary gap-2 text-base px-6 py-2.5"
                >
                  <Gavel size={18} />
                  提交裁决
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-warning-500 to-orange-500 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">确认提交裁决</h3>
                  <p className="text-xs text-warning-100">裁决提交后将不可撤销</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <p className="text-sm text-warning-800 font-medium mb-2">请确认以下裁决信息：</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">案件编号：</span>
                    <span className="font-mono font-medium">{complaint.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">责任判定：</span>
                    <span className="font-medium">
                      {liability === 'merchant' ? '商家全责' : liability === 'consumer' ? '消费者责任' : `双方责任（商家${merchantPercent}%）`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">赔付金额：</span>
                    <span className="font-bold text-success-600 text-lg font-display">{formatCurrency(compensationAmount)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-neutral-600 pt-1">裁决摘要：</span>
                    <span className="text-neutral-700 max-w-[60%] text-right line-clamp-2">
                      {truncateText(awardContent, 60)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
                <Eye size={14} className="flex-shrink-0 mt-0.5 text-neutral-400" />
                <p>提交后系统将自动通知双方当事人，赔付将进入执行流程，信用分将实时更新。{complaint.isReArbitration ? '本案为终裁，裁决结果具有最终效力。' : '如当事人不服，可在规定时间内申请再次仲裁。'}</p>
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSubmitAward}
                className="btn btn-primary flex-1 gap-2"
              >
                <Gavel size={16} />
                确认提交
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="max-w-4xl w-full mx-4 bg-white rounded-xl overflow-hidden shadow-elevation-3 animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-800">{previewImage.name}</h4>
                <p className="text-xs text-neutral-500">{formatDate(previewImage.uploadTime, 'full')}</p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-neutral-600" />
              </button>
            </div>
            <div className="bg-neutral-900 p-8 flex items-center justify-center min-h-[400px]">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
