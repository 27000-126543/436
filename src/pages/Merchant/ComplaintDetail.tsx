import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Upload,
  X,
  Paperclip,
  FileText,
  MessageSquare,
  Shield,
  User,
  Package,
  Send,
  Check,
  Image,
  Video,
  File,
  MessageCircle,
  Store,
  Headphones,
  CheckCircle2,
  Scale,
  Wallet,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComplaintStore } from '@/store/complaintStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getTimeRemaining,
} from '@/utils/format';
import {
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_LABELS,
  PRIORITY_LABELS,
  type Evidence,
} from '@/types';
import { CaseTimeline } from '@/components/CaseTimeline';

export default function MerchantComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromMessages = searchParams.get('from') === 'messages';
  const { getComplaintById, complaints, submitMerchantAppeal, compensations } = useComplaintStore();
  const { currentUser } = useAuthStore();

  const complaint = useMemo(() => (id ? getComplaintById(id) : undefined), [id, getComplaintById]);

  const originalCase = useMemo(() => {
    if (!complaint?.parentComplaintId) return undefined;
    return getComplaintById(complaint.parentComplaintId);
  }, [complaint?.parentComplaintId, getComplaintById]);

  const currentCompensation = useMemo(() => {
    if (!complaint) return undefined;
    return compensations.find(c => c.complaintId === complaint.id);
  }, [complaint, compensations]);

  const [appealContent, setAppealContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Evidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!complaint) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/merchant/complaints')} className="btn btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </button>
        <div className="card p-16 text-center text-neutral-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">投诉不存在或已被删除</p>
        </div>
      </div>
    );
  }

  const isTimeout = complaint.merchantTimeout;
  const canSubmit = !complaint.merchantAppeal && !isTimeout;
  const deadlineInfo = complaint.merchantResponseDeadline
    ? getTimeRemaining(complaint.merchantResponseDeadline)
    : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: Evidence[] = Array.from(files).map((f, idx) => ({
      id: `new_${Date.now()}_${idx}`,
      type: f.type.startsWith('image/') ? 'image' : 'document',
      url: URL.createObjectURL(f),
      name: f.name,
      uploadTime: new Date().toISOString(),
      uploader: 'merchant',
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!appealContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    submitMerchantAppeal(complaint.id, {
      content: appealContent,
      evidence: uploadedFiles,
    });
    setIsSubmitting(false);
  };

  const handleDownloadVoucher = (id: string) => {
    alert(`模拟下载赔付凭证：${id}.pdf`);
  };

  const getStatusBadgeClass = () => {
    switch (complaint.status) {
      case 'pending':
      case 'arbitrating':
        return 'badge-warning';
      case 'mediating':
      case 'assigned':
        return 'badge-primary';
      case 'closed':
      case 'mediated':
        return 'badge-neutral';
      case 'awarded':
        return 'badge-success';
      default:
        return 'badge-danger';
    }
  };

  // 证据类型图标映射
  const getEvidenceIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
    }
  };

  // 证据网格渲染
  const renderEvidenceGrid = (evidenceList: Evidence[]) => {
    if (evidenceList.length === 0) {
      return <div className="py-5 text-center text-neutral-400 text-sm">暂无上传的证据材料</div>;
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {evidenceList.map((ev) => (
          <div key={ev.id} className="group relative rounded-lg border border-neutral-200 overflow-hidden hover:border-primary-400 hover:shadow-sm transition-all">
            <div className="aspect-video bg-neutral-100 flex items-center justify-center">
              {ev.type === 'image' || ev.type === 'chat' ? (
                <img src={ev.url} alt={ev.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-400">
                  {ev.type === 'video' ? <Video className="w-10 h-10" /> : <File className="w-10 h-10" />}
                  <span className="text-xs">{ev.type.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="p-2 bg-white">
              <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                {getEvidenceIcon(ev.type)}
                <span className="truncate">{ev.name}</span>
              </div>
              {ev.uploaderName && <p className="text-[11px] text-neutral-400 truncate">{ev.uploaderName}</p>}
              <p className="text-[10px] text-neutral-300 mt-1">{formatDate(ev.uploadTime, 'full')}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/merchant/complaints')} className="btn btn-ghost !p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {fromMessages && (
              <button
                onClick={() => navigate('/messages')}
                className="btn btn-secondary btn-sm gap-1.5"
              >
                <ArrowLeft size={14} />
                返回消息
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-800">投诉详情</h1>
              <span className="font-mono text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                {complaint.id}
              </span>
              <span className={`badge ${getStatusBadgeClass()}`}>
                {COMPLAINT_STATUS_LABELS[complaint.status]}
              </span>
            </div>
            <p className="text-neutral-500 mt-1">
              {complaint.orderInfo.merchantName} · 提交于 {formatDate(complaint.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {isTimeout && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-danger-800">已自动默认支持消费者</h3>
            <p className="text-danger-700 text-sm mt-1">
              由于您未能在规定时间内作出回应，系统已自动默认支持消费者诉求。如对此结果有异议，可在仲裁阶段提交相关证据进行申诉。
            </p>
          </div>
        </div>
      )}

      {deadlineInfo && !deadlineInfo.isExpired && !complaint.merchantAppeal && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${
          deadlineInfo.days * 24 + deadlineInfo.hours < 6
            ? 'bg-warning-50 border-warning-200'
            : 'bg-info-50 border-info-200'
        }`}>
          <Clock className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
            deadlineInfo.days * 24 + deadlineInfo.hours < 6
              ? 'text-warning-500'
              : 'text-info-500'
          }`} />
          <div>
            <h3 className={`font-semibold ${
              deadlineInfo.days * 24 + deadlineInfo.hours < 6
                ? 'text-warning-800'
                : 'text-info-800'
            }`}>
              响应截止时间倒计时
            </h3>
            <p className={`text-sm mt-1 ${
              deadlineInfo.days * 24 + deadlineInfo.hours < 6
                ? 'text-warning-700'
                : 'text-info-700'
            }`}>
              请在 {deadlineInfo.days > 0 && `${deadlineInfo.days}天`}
              {deadlineInfo.hours}时{deadlineInfo.minutes}分 内提交申诉，超时将自动默认支持消费者。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3">
          <div className="card overflow-hidden p-5 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  complaint.status === 'mediating' || complaint.status === 'assigned' ? 'bg-primary-100' :
                  complaint.status === 'arbitrating' ? 'bg-warning-100' :
                  complaint.status === 'awarded' ? 'bg-success-100' :
                  'bg-neutral-100'
                )}>
                  {complaint.status === 'mediating' || complaint.status === 'assigned' ? (
                    <MessageSquare size={28} className="text-primary-600" />
                  ) : complaint.status === 'arbitrating' ? (
                    <Scale size={28} className="text-warning-600" />
                  ) : complaint.status === 'awarded' ? (
                    <CheckCircle2 size={28} className="text-success-600" />
                  ) : (
                    <FileText size={28} className="text-neutral-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-neutral-500">当前案件阶段</p>
                  <h3 className="text-xl font-bold text-neutral-800 mt-0.5">
                    {complaint.status === 'pending' && '待分派'}
                    {complaint.status === 'assigned' && '客服调解中'}
                    {complaint.status === 'mediating' && '客服调解中'}
                    {complaint.status === 'arbitrating' && '待仲裁裁决'}
                    {complaint.status === 'awarded' && '已裁决'}
                    {complaint.status === 'mediated' && '调解完成'}
                    {complaint.status === 'closed' && '已结案'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {complaint.status === 'mediating' && complaint.serviceName
                      ? `由 ${complaint.serviceName} 处理中`
                      : complaint.status === 'arbitrating' && complaint.arbitratorName
                      ? `仲裁员 ${complaint.arbitratorName} 审理中`
                      : complaint.status === 'awarded' && complaint.award
                      ? `裁决赔付 ${formatCurrency(complaint.award.compensationAmount)}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[
                  { key: 'pending', label: '提交' },
                  { key: 'assigned', label: '调解' },
                  { key: 'arbitrating', label: '仲裁' },
                  { key: 'awarded', label: '裁决' },
                  { key: 'closed', label: '赔付' },
                ].map((stage, idx, arr) => {
                  const stageOrder = ['pending', 'assigned', 'mediating', 'arbitrating', 'awarded', 'mediated', 'closed'];
                  const currentIdx = stageOrder.indexOf(complaint.status);
                  const thisIdx = stageOrder.indexOf(stage.key);
                  let isDone = thisIdx <= currentIdx;
                  let isCurrent = complaint.status === stage.key ||
                    (stage.key === 'assigned' && (complaint.status === 'assigned' || complaint.status === 'mediating')) ||
                    (stage.key === 'awarded' && complaint.status === 'awarded');
                  let stageLabel = stage.label;
                  let dotClass = '';
                  let labelClass = '';
                  let showCheck = isDone && !isCurrent;

                  if (stage.key === 'closed') {
                    if (complaint.status === 'awarded' || complaint.status === 'closed') {
                      if (currentCompensation) {
                        if (currentCompensation.status === 'paid') {
                          isDone = true;
                          isCurrent = false;
                          stageLabel = '已赔付';
                          dotClass = 'bg-success-500 text-white';
                          labelClass = 'text-success-600';
                          showCheck = true;
                        } else if (currentCompensation.status === 'failed') {
                          isDone = false;
                          isCurrent = true;
                          stageLabel = '打款失败';
                          dotClass = 'bg-danger-500 text-white ring-4 ring-danger-100 scale-110';
                          labelClass = 'text-danger-700 font-bold';
                        } else {
                          isDone = false;
                          isCurrent = true;
                          stageLabel = '赔付中';
                          dotClass = 'bg-warning-500 text-white ring-4 ring-warning-100 scale-110';
                          labelClass = 'text-warning-700 font-bold';
                        }
                      } else {
                        isDone = false;
                        isCurrent = true;
                        stageLabel = '待赔付';
                        dotClass = 'bg-warning-500 text-white ring-4 ring-warning-100 scale-110';
                        labelClass = 'text-warning-700 font-bold';
                      }
                    } else {
                      isDone = false;
                      isCurrent = false;
                      stageLabel = '待赔付';
                    }
                  }

                  if (stage.key !== 'closed') {
                    dotClass = isCurrent
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100 scale-110'
                      : isDone
                      ? 'bg-success-500 text-white'
                      : 'bg-neutral-200 text-neutral-500';
                    labelClass = isCurrent ? 'text-primary-700 font-bold' : isDone ? 'text-success-600' : 'text-neutral-400';
                  }

                  const lineIsDone = stage.key === 'closed'
                    ? currentCompensation?.status === 'paid'
                    : isDone;

                  return (
                    <div key={stage.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                          dotClass || (isCurrent
                            ? 'bg-primary-500 text-white ring-4 ring-primary-100 scale-110'
                            : isDone
                            ? 'bg-success-500 text-white'
                            : 'bg-neutral-200 text-neutral-500')
                        )}>
                          {showCheck ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <span className={cn(
                          'text-[11px] mt-1.5 font-medium whitespace-nowrap',
                          labelClass
                        )}>
                          {stageLabel}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={cn(
                          'w-10 h-0.5 -mt-4 mx-0.5',
                          lineIsDone ? 'bg-success-400' : 'bg-neutral-200'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {complaint.award && (
                <div className="bg-white rounded-lg border border-neutral-200 p-4 min-w-[240px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-500">赔付单</span>
                    {currentCompensation ? (
                      <span className={`badge ${
                        currentCompensation.status === 'paid' ? 'badge-success' :
                        currentCompensation.status === 'failed' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {currentCompensation.status === 'paid' ? '已赔付' :
                         currentCompensation.status === 'failed' ? '打款失败' : '待打款'}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">待生成</span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-neutral-800">
                    {formatCurrency(complaint.award.compensationAmount)}
                  </p>
                  {currentCompensation && (
                    <>
                      <p className="text-xs text-neutral-400 mt-1 font-mono">{currentCompensation.id}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => navigate(`/merchant/compensations?complaintId=${complaint.id}`)}
                          className="text-xs text-primary-600 hover:underline font-medium"
                        >
                          查看详情 →
                        </button>
                        {(currentCompensation.voucherUrl || currentCompensation.status === 'paid') && (
                          <button
                            onClick={() => handleDownloadVoucher(currentCompensation.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-700 font-medium inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            下载凭证
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                订单信息
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4">
                <img
                  src={complaint.orderInfo.productImage}
                  alt={complaint.orderInfo.productName}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-neutral-800">{complaint.orderInfo.productName}</h4>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-neutral-500">订单号：</span>
                      <span className="font-mono text-neutral-700">{complaint.orderId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">下单时间：</span>
                      <span className="text-neutral-700">
                        {formatDate(complaint.orderInfo.orderTime, 'date')}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">订单金额：</span>
                      <span className="font-semibold text-neutral-800">
                        {formatCurrency(complaint.orderInfo.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">索赔金额：</span>
                      <span className="font-semibold text-danger-600">
                        {formatCurrency(complaint.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                投诉详情
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    complaint.priority === 'high'
                      ? 'badge-danger'
                      : complaint.priority === 'medium'
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }`}
                >
                  {PRIORITY_LABELS[complaint.priority]}
                </span>
                <span className="badge badge-info">{COMPLAINT_TYPE_LABELS[complaint.type]}</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-800">{complaint.consumerName}</span>
                    <span className="text-xs text-neutral-400">消费者</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {formatRelativeTime(complaint.createdAt)} · 发起投诉
                  </p>
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 ml-13">
                <h4 className="font-medium text-neutral-800 mb-2">{complaint.title}</h4>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>
            </div>
          </div>

          {complaint.mediationRecord && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  调解记录
                  <span className="text-sm font-normal text-neutral-500 ml-2">
                    {complaint.serviceName} 处理
                  </span>
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-700">调解方案</span>
                    <span className="text-xs text-primary-500">
                      建议赔付 {formatCurrency(complaint.mediationRecord.proposedAmount)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700">{complaint.mediationRecord.solution}</p>
                </div>
                <p className="text-sm text-neutral-600">
                  <span className="text-neutral-500">调解员说明：</span>
                  {complaint.mediationRecord.content}
                </p>
                {complaint.mediationRecord.communicationRecords.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-neutral-100">
                    <p className="text-sm font-medium text-neutral-700">沟通记录</p>
                    {complaint.mediationRecord.communicationRecords.map((record) => (
                      <div
                        key={record.id}
                        className={`flex gap-3 ${
                          record.sender === 'merchant' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            record.sender === 'consumer'
                              ? 'bg-info-100'
                              : record.sender === 'merchant'
                              ? 'bg-success-100'
                              : 'bg-primary-100'
                          }`}
                        >
                          <User
                            className={`w-4 h-4 ${
                              record.sender === 'consumer'
                                ? 'text-info-600'
                                : record.sender === 'merchant'
                                ? 'text-success-600'
                                : 'text-primary-600'
                            }`}
                          />
                        </div>
                        <div
                          className={`max-w-md ${
                            record.sender === 'merchant' ? 'text-right' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-neutral-600">
                              {record.senderName}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {formatDate(record.createdAt, 'time')}
                            </span>
                          </div>
                          <div
                            className={`inline-block px-3 py-2 rounded-lg text-sm ${
                              record.sender === 'merchant'
                                ? 'bg-success-50 text-success-800'
                                : record.sender === 'service'
                                ? 'bg-primary-50 text-primary-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {record.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 证据材料分区展示 - 独立卡片 */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary-500" />
                证据材料分区展示
              </h3>
            </div>
            <div className="p-5 space-y-5">
              {/* 消费者证据 - 蓝色主题 */}
              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-700">消费者提交的证据</p>
                    <p className="text-xs text-neutral-500">
                      {complaint.consumerName} · 共 {complaint.evidence.length} 份
                    </p>
                  </div>
                </div>
                {renderEvidenceGrid(complaint.evidence)}
              </div>

              {/* 商家申诉证据 - 黄色主题 */}
              <div className="rounded-lg border-l-4 border-warning-500 bg-warning-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
                    <Store className="w-4 h-4 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warning-700">我提交的申诉证据</p>
                    <p className="text-xs text-neutral-500">
                      {complaint.orderInfo.merchantName}
                      {complaint.merchantAppeal
                        ? ` · 共 ${complaint.merchantAppeal.evidence.length} 份 · ${formatDate(complaint.merchantAppeal.submittedAt, 'date')}`
                        : ' · 尚未提交申诉'}
                    </p>
                  </div>
                </div>
                {renderEvidenceGrid(complaint.merchantAppeal?.evidence || [])}
              </div>

              {/* 客服补充证据 - 紫色主题 */}
              {complaint.serviceEvidence && complaint.serviceEvidence.length > 0 && (
                <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Headphones className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-700">客服补充调查证据</p>
                      <p className="text-xs text-neutral-500">
                        平台客服独立调查材料 · 共 {complaint.serviceEvidence.length} 份
                      </p>
                    </div>
                  </div>
                  {renderEvidenceGrid(complaint.serviceEvidence)}
                </div>
              )}
            </div>
          </div>

          {complaint.merchantAppeal && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-success-50/50">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Check className="w-5 h-5 text-success-500" />
                  已提交的申诉
                  <span className="text-xs text-neutral-500 font-normal ml-2">
                    {formatDate(complaint.merchantAppeal.submittedAt)}
                  </span>
                </h3>
              </div>
              <div className="p-5">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {complaint.merchantAppeal.content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {canSubmit && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary-500" />
                  在线申诉
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    申诉内容 <span className="text-danger-500">*</span>
                  </label>
                  <textarea
                    value={appealContent}
                    onChange={(e) => setAppealContent(e.target.value)}
                    placeholder="请详细说明您的申诉理由，包括事实情况、相关依据等..."
                    rows={6}
                    className="input-textarea"
                  />
                  <p className="text-xs text-neutral-400 mt-2">
                    已输入 {appealContent.length} 字（建议不少于50字）
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    证据上传
                  </label>
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                    <input
                      id="evidence-upload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="evidence-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <Upload className="w-10 h-10 text-neutral-400 mb-2" />
                      <span className="text-sm font-medium text-neutral-700">
                        点击或拖拽文件到此处上传
                      </span>
                      <span className="text-xs text-neutral-400 mt-1">
                        支持 JPG、PNG、PDF、DOC 等格式，单个文件不超过 10MB
                      </span>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Paperclip className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            <span className="text-sm text-neutral-700 truncate">{file.name}</span>
                          </div>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setAppealContent('');
                      setUploadedFiles([]);
                    }}
                    className="btn btn-secondary"
                  >
                    重置
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!appealContent.trim() || isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        提交申诉
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {complaint && <CaseTimeline complaint={complaint} compensation={currentCompensation} />}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-neutral-800">处理人员</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">{complaint.consumerName}</p>
                  <p className="text-xs text-neutral-500">投诉方（消费者）</p>
                </div>
              </div>
              {complaint.serviceName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{complaint.serviceName}</p>
                    <p className="text-xs text-neutral-500">客服调解员</p>
                  </div>
                </div>
              )}
              {complaint.arbitratorName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {complaint.arbitratorName}
                    </p>
                    <p className="text-xs text-neutral-500">仲裁员</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
