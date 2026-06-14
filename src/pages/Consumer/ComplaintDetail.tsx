import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Circle,
  User,
  MessageSquare,
  FileText,
  Upload,
  Image,
  Video,
  File,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  AlertCircle,
  Gavel,
  Package,
  Building,
  Calendar,
  DollarSign,
  Store,
  ShieldCheck,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Headphones,
  Wallet,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { useComplaintStore } from '@/store/complaintStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getStatusBadgeClass,
  generateId,
} from '@/utils/format';
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
  PRIORITY_LABELS,
  type Complaint,
  type TimelineStep,
  type Evidence,
} from '@/types';
import { cn } from '@/lib/utils';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromMessages = searchParams.get('from') === 'messages';
  const { getComplaintById, compensations, setConsumerSatisfaction, addEvidence } =
    useComplaintStore();
  const { currentUser } = useAuthStore();

  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showCommunication, setShowCommunication] = useState(true);
  const [newEvidenceType, setNewEvidenceType] =
    useState<Evidence['type']>('image');

  const complaint = useMemo(
    () => (id ? getComplaintById(id) : undefined),
    [id, getComplaintById]
  );

  const currentCompensation = useMemo(() => {
    if (!complaint) return undefined;
    return compensations.find(c => c.complaintId === complaint.id);
  }, [compensations, complaint]);

  const originalCase = useMemo(() => {
    if (!complaint?.parentComplaintId) return undefined;
    return getComplaintById(complaint.parentComplaintId);
  }, [complaint?.parentComplaintId, getComplaintById]);

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
      return (
        <div className="py-5 text-center text-neutral-400 text-sm">
          暂无上传的证据材料
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {evidenceList.map((ev) => (
          <div
            key={ev.id}
            className="group relative rounded-lg border border-neutral-200 overflow-hidden hover:border-primary-400 hover:shadow-sm transition-all"
          >
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
              {ev.uploaderName && (
                <p className="text-[11px] text-neutral-400 truncate">{ev.uploaderName}</p>
              )}
              <p className="text-[10px] text-neutral-300 mt-1">{formatDate(ev.uploadTime, 'full')}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const timeline = useMemo<TimelineStep[]>(() => {
    if (!complaint) return [];
    const steps: TimelineStep[] = [];

    steps.push({
      id: '1',
      title: '投诉已提交',
      description: '您的投诉已成功提交至平台',
      time: complaint.createdAt,
      status: 'completed',
      handler: complaint.consumerName,
    });

    if (complaint.assignedAt) {
      steps.push({
        id: '2',
        title: '客服已分派',
        description: `${complaint.serviceName || '客服专员'}已接手处理您的投诉`,
        time: complaint.assignedAt,
        status: 'completed',
        handler: complaint.serviceName,
      });
    } else if (['pending'].includes(complaint.status)) {
      steps.push({
        id: '2',
        title: '等待分派客服',
        description: '正在为您匹配合适的客服专员',
        time: complaint.createdAt,
        status: 'active',
      });
    }

    if (complaint.mediationRecord) {
      steps.push({
        id: '3',
        title: '调解进行中',
        description: '客服正在与双方沟通调解',
        time: complaint.mediationRecord.createdAt,
        status: 'completed',
        handler: complaint.serviceName,
      });
      steps.push({
        id: '4',
        title: '调解方案已出具',
        description: complaint.mediationRecord.solution,
        time: complaint.mediationRecord.createdAt,
        status: complaint.consumerSatisfied !== undefined ? 'completed' : 'active',
        handler: complaint.serviceName,
      });
    } else if (['assigned', 'mediating'].includes(complaint.status)) {
      steps.push({
        id: '3',
        title: '调解进行中',
        description: '客服正在与双方沟通调解，请耐心等待',
        time: complaint.assignedAt || complaint.createdAt,
        status: 'active',
        handler: complaint.serviceName,
      });
    }

    if (complaint.arbitrationAssignedAt) {
      steps.push({
        id: '5',
        title: '进入仲裁程序',
        description: `${complaint.arbitratorName || '仲裁员'}已接手仲裁审理`,
        time: complaint.arbitrationAssignedAt,
        status: complaint.award ? 'completed' : 'active',
        handler: complaint.arbitratorName,
      });
    }

    if (complaint.award) {
      steps.push({
        id: '6',
        title: '仲裁裁决已作出',
        description: '仲裁结果已发布，请查看裁决书详情',
        time: complaint.award.createdAt,
        status: 'completed',
        handler: complaint.arbitratorName,
      });
    }

    if (complaint.status === 'closed' && complaint.consumerSatisfied) {
      steps.push({
        id: 'end',
        title: '投诉已结案',
        description: '您对调解结果满意，投诉已顺利结案',
        time: complaint.updatedAt,
        status: 'completed',
      });
    }

    return steps;
  }, [complaint]);

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-800 mb-2">
            投诉不存在
          </h2>
          <p className="text-neutral-500 mb-6">
            您访问的投诉记录不存在或已被删除
          </p>
          <button
            onClick={() => navigate('/consumer/complaints')}
            className="btn btn-primary gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回投诉列表
          </button>
        </div>
      </div>
    );
  }

  const handleAddEvidence = () => {
    const mockEvidence: Evidence = {
      id: generateId('evi'),
      type: newEvidenceType,
      url: `https://picsum.photos/seed/newevi${Date.now()}/400/300`,
      name: `补充证据_${complaint.evidence.length + 1}.${newEvidenceType === 'image' || newEvidenceType === 'chat' ? 'jpg' : newEvidenceType === 'video' ? 'mp4' : 'pdf'}`,
      uploadTime: new Date().toISOString(),
      uploader: 'consumer',
    };
    addEvidence(complaint.id, mockEvidence);
    setShowAddEvidence(false);
  };

  const canShowMediationActions =
    complaint.status === 'mediated' &&
    complaint.mediationRecord &&
    complaint.consumerSatisfied === undefined;

  const canAddEvidence = ['pending', 'assigned', 'mediating', 'mediated', 'arbitrating'].includes(
    complaint.status
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/consumer/complaints')}
            className="btn btn-ghost !p-2"
          >
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-800 truncate">
              {complaint.title}
            </h1>
            <span
              className={cn(
                'badge',
                getStatusBadgeClass(complaint.status)
              )}
            >
              {COMPLAINT_STATUS_LABELS[complaint.status]}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              {complaint.id}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(complaint.createdAt)}
            </span>
            <span className="badge badge-primary">
              {COMPLAINT_TYPE_LABELS[complaint.type]}
            </span>
            <span
              className={cn(
                'badge',
                complaint.priority === 'high'
                  ? 'badge-danger'
                  : complaint.priority === 'medium'
                  ? 'badge-warning'
                  : 'badge-neutral'
              )}
            >
              {PRIORITY_LABELS[complaint.priority]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              订单信息
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={complaint.orderInfo.productImage}
                alt={complaint.orderInfo.productName}
                className="w-full sm:w-32 h-32 rounded-xl object-cover bg-neutral-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-3">
                <h3 className="font-semibold text-neutral-800 text-lg">
                  {complaint.orderInfo.productName}
                </h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <FileText className="w-4 h-4" />
                    订单号：
                  </div>
                  <div className="text-neutral-700 font-medium">
                    {complaint.orderId}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Store className="w-4 h-4" />
                    商家：
                  </div>
                  <div className="text-neutral-700 font-medium">
                    {complaint.orderInfo.merchantName}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Calendar className="w-4 h-4" />
                    下单时间：
                  </div>
                  <div className="text-neutral-700">
                    {formatDate(complaint.orderInfo.orderTime, 'date')}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <DollarSign className="w-4 h-4" />
                    订单金额：
                  </div>
                  <div className="text-lg font-bold text-primary-600">
                    {formatCurrency(complaint.orderInfo.amount)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              处理进度
            </h2>
            <div className="relative pl-8">
              {timeline.map((step, index) => (
                <TimelineItem
                  key={step.id}
                  step={step}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              投诉内容
            </h2>
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-sm text-neutral-500 mb-1">投诉标题</p>
              <p className="font-medium text-neutral-800 mb-4">
                {complaint.title}
              </p>
              <p className="text-sm text-neutral-500 mb-1">详细描述</p>
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {complaint.description}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-neutral-800">证据材料</h3>
              </div>
              {canAddEvidence && (
                <button
                  onClick={() => setShowAddEvidence(!showAddEvidence)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  补充证据
                </button>
              )}
            </div>

            {showAddEvidence && (
              <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-neutral-700">
                    选择证据类型：
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {
                        value: 'image' as const,
                        label: '图片',
                        icon: Image,
                      },
                      {
                        value: 'chat' as const,
                        label: '聊天记录',
                        icon: MessageCircle,
                      },
                      {
                        value: 'video' as const,
                        label: '视频',
                        icon: Video,
                      },
                      {
                        value: 'document' as const,
                        label: '文档',
                        icon: File,
                      },
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => setNewEvidenceType(t.value)}
                        className={cn(
                          'btn !py-1 !px-2 text-xs gap-1',
                          newEvidenceType === t.value
                            ? 'btn-primary'
                            : 'btn-secondary'
                        )}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEvidence}
                    className="btn btn-primary text-sm gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    模拟上传
                  </button>
                  <button
                    onClick={() => setShowAddEvidence(false)}
                    className="btn btn-secondary text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"><User className="w-4 h-4 text-primary-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-primary-700">我提交的证据</p>
                    <p className="text-xs text-neutral-500">共 {complaint.evidence.length} 份</p>
                  </div>
                </div>
                {renderEvidenceGrid(complaint.evidence)}
              </div>
              {complaint.merchantAppeal && (
                <div className="rounded-lg border-l-4 border-warning-500 bg-warning-50/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center"><Store className="w-4 h-4 text-warning-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-warning-700">商家申诉证据</p>
                      <p className="text-xs text-neutral-500">{complaint.orderInfo.merchantName} · 共 {complaint.merchantAppeal.evidence.length} 份</p>
                    </div>
                  </div>
                  {renderEvidenceGrid(complaint.merchantAppeal.evidence)}
                </div>
              )}
              {complaint.serviceEvidence && complaint.serviceEvidence.length > 0 && (
                <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><Headphones className="w-4 h-4 text-purple-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-purple-700">客服补充调查证据</p>
                      <p className="text-xs text-neutral-500">平台客服独立调查 · 共 {complaint.serviceEvidence.length} 份</p>
                    </div>
                  </div>
                  {renderEvidenceGrid(complaint.serviceEvidence)}
                </div>
              )}
            </div>
          </div>

          {complaint.mediationRecord && (
            <div className="card p-6">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => setShowCommunication(!showCommunication)}
              >
                <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  调解记录与沟通记录
                  <span className="badge badge-neutral">
                    {complaint.mediationRecord.communicationRecords.length} 条
                  </span>
                </h2>
                {showCommunication ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
              </div>

              {showCommunication && (
                <div className="space-y-4">
                  <div className="bg-info-50 rounded-xl p-4 border border-info-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-info-600" />
                      <span className="font-medium text-info-700">
                        调解方案
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">
                      {complaint.mediationRecord.content}
                    </p>
                    <div className="pt-2 border-t border-info-200/50">
                      <p className="text-xs text-neutral-500 mb-1">
                        建议解决方案：
                      </p>
                      <p className="text-sm font-medium text-neutral-800">
                        {complaint.mediationRecord.solution}
                      </p>
                      <p className="text-xs text-neutral-500 mt-2">
                        建议赔付金额：
                        <span className="text-lg font-bold text-primary-600 ml-1">
                          {formatCurrency(
                            complaint.mediationRecord.proposedAmount
                          )}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">
                      调解人：{complaint.mediationRecord.serviceName} ·{' '}
                      {formatDate(
                        complaint.mediationRecord.createdAt,
                        'short'
                      )}
                    </p>
                  </div>

                  {complaint.mediationRecord.communicationRecords.length >
                    0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-neutral-600">
                        沟通记录
                      </p>
                      <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                        {complaint.mediationRecord.communicationRecords.map(
                          record => (
                            <CommunicationBubble
                              key={record.id}
                              record={record}
                              consumerName={complaint.consumerName}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {complaint.merchantAppeal && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-warning-600" />
                商家申诉内容
              </h2>
              <div className="bg-warning-50/50 rounded-xl p-4 border border-warning-100">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-4 h-4 text-warning-600" />
                  <span className="font-medium text-neutral-800">
                    {complaint.orderInfo.merchantName}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(complaint.merchantAppeal.submittedAt)}
                  </span>
                </div>
                <p className="text-neutral-700 leading-relaxed">
                  {complaint.merchantAppeal.content}
                </p>
              </div>
            </div>
          )}

          {complaint.award && (
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-white border-primary-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center">
                  <Gavel className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800">
                    仲裁裁决书
                  </h2>
                  <p className="text-sm text-neutral-500">
                    仲裁员：{complaint.award.arbitratorName}
                  </p>
                </div>
                {complaint.award.isFinal && (
                  <span className="badge badge-success ml-auto">
                    终局裁决
                  </span>
                )}
              </div>
              <div className="bg-white/80 rounded-xl p-4 mb-4">
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {complaint.award.content}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">责任判定</p>
                  <p className="font-semibold text-neutral-800">
                    {complaint.award.liability === 'merchant'
                      ? '商家全责'
                      : complaint.award.liability === 'consumer'
                      ? '消费者责任'
                      : '双方责任'}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">赔付金额</p>
                  <p className="font-bold text-primary-600 text-lg">
                    {formatCurrency(complaint.award.compensationAmount)}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">裁决时间</p>
                  <p className="font-semibold text-neutral-800 text-sm">
                    {formatDate(complaint.award.createdAt, 'date')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {complaint.isReArbitration && originalCase?.award && complaint.award && (
            <div className="card overflow-hidden border-purple-200">
              <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  复核裁决对比
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    终裁结果
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  原案件 {complaint.parentComplaintId} 的裁决已由另一位仲裁员复核
                </p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-neutral-600" />
                      </div>
                      <span className="text-sm font-semibold text-neutral-600">原裁决</span>
                      <span className="text-[10px] text-neutral-400">{formatDate(originalCase.award.createdAt, 'short')}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">责任判定</span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          originalCase.award.liability === 'merchant' ? 'bg-danger-100 text-danger-700' :
                          originalCase.award.liability === 'both' ? 'bg-warning-100 text-warning-700' :
                          'bg-success-100 text-success-700'
                        )}>
                          {originalCase.award.liability === 'merchant' ? '商家全责' :
                           originalCase.award.liability === 'both' ? '双方责任' : '消费者责任'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">赔付金额</span>
                        <span className="text-sm font-bold text-neutral-700">{formatCurrency(originalCase.award.compensationAmount)}</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200">
                        <p className="text-xs text-neutral-400 mb-1">裁决摘要</p>
                        <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">{originalCase.award.content}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-purple-300 p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-purple-700" />
                      </div>
                      <span className="text-sm font-semibold text-purple-700">终裁裁决</span>
                      <span className="text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">终裁</span>
                      <span className="text-[10px] text-purple-400">{formatDate(complaint.award.createdAt, 'short')}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-500">责任判定</span>
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded font-medium',
                            complaint.award.liability === 'merchant' ? 'bg-danger-100 text-danger-700' :
                            complaint.award.liability === 'both' ? 'bg-warning-100 text-warning-700' :
                            'bg-success-100 text-success-700'
                          )}>
                            {complaint.award.liability === 'merchant' ? '商家全责' :
                             complaint.award.liability === 'both' ? '双方责任' : '消费者责任'}
                          </span>
                          {complaint.award.liability !== originalCase.award.liability && (
                            <span className="text-[10px] text-danger-600 font-bold">变更</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-500">赔付金额</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-purple-800">{formatCurrency(complaint.award.compensationAmount)}</span>
                          {complaint.award.compensationAmount !== originalCase.award.compensationAmount && (
                            <span className={cn(
                              'text-[10px] font-bold',
                              complaint.award.compensationAmount > originalCase.award.compensationAmount
                                ? 'text-danger-600' : 'text-success-600'
                            )}>
                              {complaint.award.compensationAmount > originalCase.award.compensationAmount ? '↑' : '↓'}
                              {formatCurrency(Math.abs(complaint.award.compensationAmount - originalCase.award.compensationAmount))}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-purple-200">
                        <p className="text-xs text-purple-400 mb-1">终裁摘要</p>
                        <p className="text-xs text-purple-700 leading-relaxed line-clamp-2">{complaint.award.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-purple-500 mt-3 text-center">
                  ✅ 终裁为最终裁决结果
                </p>
              </div>
            </div>
          )}

          {complaint.award && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-success-50 to-emerald-50">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-success-600" />
                  赔付进度
                </h3>
              </div>
              <div className="p-5">
                {currentCompensation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-500">赔付金额</p>
                        <p className="text-2xl font-bold text-neutral-800">{formatCurrency(currentCompensation.amount)}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full',
                          currentCompensation.status === 'paid'
                            ? 'bg-success-100 text-success-700'
                            : currentCompensation.status === 'failed'
                            ? 'bg-danger-100 text-danger-700'
                            : 'bg-warning-100 text-warning-700'
                        )}>
                          {currentCompensation.status === 'paid' && <CheckCircle2 size={16} />}
                          {currentCompensation.status === 'failed' && <AlertCircle size={16} />}
                          {currentCompensation.status === 'pending' && <Clock size={16} />}
                          {currentCompensation.status === 'paid' ? '已到账' :
                           currentCompensation.status === 'failed' ? '打款失败' : '待打款'}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            currentCompensation.status === 'paid'
                              ? 'bg-success-500 w-full'
                              : currentCompensation.status === 'failed'
                              ? 'bg-danger-500 w-1/2'
                              : 'bg-warning-500 w-1/3 animate-pulse'
                          )}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-neutral-400">裁决作出</span>
                        <span className="text-[10px] text-neutral-400">财务打款</span>
                        <span className={cn(
                          'text-[10px]',
                          currentCompensation.status === 'paid' ? 'text-success-600 font-medium' : 'text-neutral-400'
                        )}>
                          到账确认
                        </span>
                      </div>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-neutral-500">赔付单号</span>
                        <span className="text-xs font-mono text-neutral-700">{currentCompensation.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-neutral-500">生成时间</span>
                        <span className="text-xs text-neutral-700">{formatDate(currentCompensation.createdAt, 'full')}</span>
                      </div>
                      {currentCompensation.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">到账时间</span>
                          <span className="text-xs text-success-700 font-medium">{formatDate(currentCompensation.paidAt, 'full')}</span>
                        </div>
                      )}
                      {currentCompensation.voucherUrl && (
                        <button
                          onClick={() => window.open(currentCompensation.voucherUrl, '_blank')}
                          className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-1 mt-1"
                        >
                          <Download size={12} />
                          下载打款凭证
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock size={32} className="mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm text-neutral-500">赔付单待生成</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      裁决赔付金额 {formatCurrency(complaint.award.compensationAmount)}，财务正在处理中
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary-600" />
              操作
            </h2>

            {canShowMediationActions && (
              <div className="space-y-3 mb-4">
                <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning-700">
                        请确认调解结果
                      </p>
                      <p className="text-xs text-warning-600 mt-1">
                        客服已出具调解方案，请选择是否接受
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setConsumerSatisfaction(complaint.id, true)}
                  className="w-full btn btn-success gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  接受调解方案
                </button>
                <button
                  onClick={() =>
                    setConsumerSatisfaction(complaint.id, false)
                  }
                  className="w-full btn btn-danger gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  不接受，申请仲裁
                </button>
              </div>
            )}

            <div className="space-y-2">
              {complaint.award && (
                <button className="w-full btn btn-primary gap-2">
                  <Eye className="w-4 h-4" />
                  查看裁决书
                </button>
              )}
              {complaint.serviceName && (
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">处理专员</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {complaint.serviceName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {complaint.assignedAt
                          ? formatRelativeTime(complaint.assignedAt) + ' 接手'
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {complaint.arbitratorName && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <p className="text-xs text-primary-600 mb-1">仲裁员</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      <Gavel className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {complaint.arbitratorName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {complaint.arbitrationAssignedAt
                          ? formatRelativeTime(
                              complaint.arbitrationAssignedAt
                            ) + ' 接手'
                          : ''}
                      </p>
                    </div>
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

function TimelineItem({
  step,
  isLast,
}: {
  step: TimelineStep;
  isLast: boolean;
}) {
  return (
    <div className={cn('relative pb-6', isLast && 'pb-0')}>
      {!isLast && (
        <div
          className={cn(
            'timeline-line',
            step.status === 'completed' && 'bg-success-300'
          )}
        />
      )}
      <div
        className={cn(
          'timeline-dot',
          step.status === 'completed' && 'timeline-dot-completed',
          step.status === 'active' && 'timeline-dot-active',
          step.status === 'pending' && 'timeline-dot-pending'
        )}
      >
        {step.status === 'completed' && (
          <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
        )}
        {step.status === 'active' && (
          <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-0.5 left-0.5 animate-pulse" />
        )}
        {step.status === 'pending' && (
          <Circle className="w-2 h-2 text-neutral-400 absolute top-0 left-0" />
        )}
      </div>
      <div className="ml-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={cn(
              'font-medium',
              step.status === 'pending'
                ? 'text-neutral-400'
                : 'text-neutral-800'
            )}
          >
            {step.title}
          </h4>
          {step.handler && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              {step.handler}
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-sm mt-1',
            step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-600'
          )}
        >
          {step.description}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {formatDate(step.time, 'short')}
        </p>
      </div>
    </div>
  );
}

function EvidenceCard({
  evidence,
  small = false,
}: {
  evidence: Evidence;
  small?: boolean;
}) {
  const isConsumer = evidence.uploader === 'consumer';
  const typeIcons: Record<Evidence['type'], React.ComponentType<{ className?: string }>> = {
    image: Image,
    chat: MessageCircle,
    video: Video,
    document: File,
  };
  const Icon = typeIcons[evidence.type];

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden border transition-all hover:shadow-md group cursor-pointer',
        isConsumer ? 'border-primary-200' : 'border-warning-200'
      )}
    >
      {(evidence.type === 'image' || evidence.type === 'chat') ? (
        <img
          src={evidence.url}
          alt={evidence.name}
          className={cn(
            'w-full object-cover',
            small ? 'h-16' : 'h-28'
          )}
        />
      ) : (
        <div
          className={cn(
            'w-full flex items-center justify-center bg-neutral-100',
            small ? 'h-16' : 'h-28'
          )}
        >
          <Icon
            className={cn(
              small ? 'w-6 h-6' : 'w-10 h-10',
              'text-neutral-400'
            )}
          />
        </div>
      )}
      <div className="p-2 bg-white">
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              'text-neutral-700 truncate',
              small ? 'text-xs' : 'text-xs'
            )}
          >
            {evidence.name}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              isConsumer
                ? 'bg-primary-50 text-primary-600'
                : 'bg-warning-50 text-warning-600'
            )}
          >
            {isConsumer ? '消费者' : '商家'}
          </span>
          <span className="text-[10px] text-neutral-400">
            {formatDate(evidence.uploadTime, 'short')}
          </span>
        </div>
      </div>
    </div>
  );
}

function CommunicationBubble({
  record,
  consumerName,
}: {
  record: Complaint['mediationRecord'] extends infer R
    ? R extends { communicationRecords: (infer T)[] }
      ? T
      : never
    : never;
  consumerName: string;
}) {
  const isConsumer = record.sender === 'consumer';
  const isService = record.sender === 'service';

  return (
    <div
      className={cn(
        'flex gap-2',
        isConsumer ? 'justify-end' : 'justify-start'
      )}
    >
      {!isConsumer && (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isService ? 'bg-info-100 text-info-600' : 'bg-warning-100 text-warning-600'
          )}
        >
          {isService ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <Store className="w-4 h-4" />
          )}
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isConsumer
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : isService
            ? 'bg-info-50 text-neutral-800 border border-info-100 rounded-tl-sm'
            : 'bg-warning-50 text-neutral-800 border border-warning-100 rounded-tl-sm'
        )}
      >
        <p
          className={cn(
            'text-xs font-medium mb-1',
            isConsumer ? 'text-primary-100' : 'text-neutral-500'
          )}
        >
          {isConsumer ? consumerName : record.senderName}
        </p>
        <p className={cn('text-sm leading-relaxed')}>{record.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1.5 text-right',
            isConsumer ? 'text-primary-200' : 'text-neutral-400'
          )}
        >
          {formatDate(record.createdAt, 'short')}
        </p>
      </div>
      {isConsumer && (
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
