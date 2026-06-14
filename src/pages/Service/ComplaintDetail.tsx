import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, CheckCircle, Circle, User, MessageSquare,
  FileText, Upload, Image, Video, File, Send, AlertTriangle,
  Gavel, Package, Building, Calendar, DollarSign, Store,
  ShieldCheck, Copy, Eye, Paperclip, AlertCircle, X,
  ThumbsUp, ThumbsDown, Headphones
} from 'lucide-react';
import { useComplaintStore } from '@/store/complaintStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatCurrency, formatDate, formatRelativeTime,
  getStatusBadgeClass, getTimeRemaining, generateId
} from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  COMPLAINT_STATUS_LABELS, COMPLAINT_TYPE_LABELS, PRIORITY_LABELS,
  type Complaint, type TimelineStep, type Evidence,
  type CommunicationRecord, type MediationRecord
} from '@/types';

const ServiceComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getComplaintById, submitMediation, setConsumerSatisfaction, addServiceEvidence, addCommunicationRecord } = useComplaintStore();
  const { currentUser } = useAuthStore();

  const [mediationContent, setMediationContent] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [communicationRecords, setCommunicationRecords] = useState<CommunicationRecord[]>([]);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evidenceType, setEvidenceType] = useState<Evidence['type']>('image');
  const [evidenceName, setEvidenceName] = useState('');
  const [, setTick] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 每分钟更新倒计时
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // 获取投诉详情
  const complaint = useMemo(() => {
    return id ? getComplaintById(id) : undefined;
  }, [id, getComplaintById]);

  // 初始化沟通记录
  useEffect(() => {
    if (complaint?.mediationRecord?.communicationRecords) {
      setCommunicationRecords(complaint.mediationRecord.communicationRecords);
    }
  }, [complaint]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communicationRecords]);

  // 处理进度时间线
  const timeline = useMemo<TimelineStep[]>(() => {
    if (!complaint) return [];
    const steps: TimelineStep[] = [];

    steps.push({
      id: '1',
      title: '投诉已提交',
      description: '消费者已提交投诉申请',
      time: complaint.createdAt,
      status: 'completed',
      handler: complaint.consumerName,
    });

    if (complaint.assignedAt) {
      steps.push({
        id: '2',
        title: '已分派给您',
        description: '您已接手处理此投诉案件',
        time: complaint.assignedAt,
        status: 'completed',
        handler: complaint.serviceName,
      });
    }

    if (complaint.merchantAppeal) {
      steps.push({
        id: '3',
        title: '商家已申诉',
        description: '商家已提交申诉材料',
        time: complaint.merchantAppeal.submittedAt,
        status: 'completed',
        handler: complaint.orderInfo.merchantName,
      });
    }

    if (complaint.mediationRecord) {
      steps.push({
        id: '4',
        title: '调解方案已提交',
        description: '您已提交调解方案，等待消费者确认',
        time: complaint.mediationRecord.createdAt,
        status: complaint.consumerSatisfied !== undefined ? 'completed' : 'active',
        handler: complaint.serviceName,
      });
    } else if (['assigned', 'mediating'].includes(complaint.status)) {
      steps.push({
        id: '4',
        title: '调解进行中',
        description: '正在与双方沟通，准备调解方案',
        time: complaint.assignedAt || complaint.createdAt,
        status: 'active',
        handler: complaint.serviceName,
      });
    }

    if (complaint.arbitrationAssignedAt) {
      steps.push({
        id: '5',
        title: '已升级仲裁',
        description: '案件已转入仲裁流程',
        time: complaint.arbitrationAssignedAt,
        status: complaint.award ? 'completed' : 'active',
        handler: complaint.arbitratorName,
      });
    }

    if (complaint.consumerSatisfied === true) {
      steps.push({
        id: '6',
        title: '案件已结案',
        description: '消费者确认满意，调解成功',
        time: complaint.updatedAt,
        status: 'completed',
        handler: '系统',
      });
    }

    return steps;
  }, [complaint]);

  // 发送新消息
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const newRecord: CommunicationRecord = {
      id: generateId('msg'),
      sender: 'service',
      senderName: currentUser.realName,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setCommunicationRecords(prev => [...prev, newRecord]);
    addCommunicationRecord(complaint.id, newRecord);
    setNewMessage('');
  };

  // 提交调解方案
  const handleSubmitMediation = () => {
    if (!complaint || !currentUser || !mediationContent.trim()) return;

    const mediation: Omit<MediationRecord, 'id' | 'createdAt'> = {
      serviceId: currentUser.id,
      serviceName: currentUser.realName,
      content: mediationContent.trim(),
      solution: mediationContent.trim(),
      proposedAmount: parseFloat(proposedAmount) || 0,
      communicationRecords,
    };

    submitMediation(complaint.id, mediation);
    alert('调解方案已提交！');
  };

  // 升级仲裁
  const handleUpgradeArbitration = () => {
    if (!complaint) return;
    if (confirm('确认将此案件升级为仲裁吗？升级后将由仲裁员进行审理。')) {
      setConsumerSatisfaction(complaint.id, false);
    }
  };

  // 客服补充调查证据
  const handleAddEvidence = () => {
    if (!complaint || !evidenceName.trim() || !currentUser) return;

    const newEvidence: Evidence[] = [{
      id: generateId('evi'),
      type: evidenceType,
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      name: evidenceName.trim(),
      uploadTime: new Date().toISOString(),
      uploader: 'service',
      uploaderName: currentUser.realName,
    }];

    addServiceEvidence(complaint.id, newEvidence);

    setShowAddEvidence(false);
    setEvidenceName('');
    setEvidenceType('document');
    alert('客服补充证据已添加！将在"客服补充"分区独立展示。');
  };

  // 渲染满意度状态
  const renderSatisfactionStatus = () => {
    if (!complaint) return null;

    // 已确认满意
    if (complaint.consumerSatisfied === true) {
      return (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <p className="font-medium text-success-700">消费者已确认满意</p>
              <p className="text-sm text-success-600">案件已结案</p>
            </div>
          </div>
        </div>
      );
    }

    // 已升级仲裁（不满意）
    if (complaint.consumerSatisfied === false || complaint.status === 'arbitrating') {
      return (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="font-medium text-warning-700">消费者不满意</p>
              <p className="text-sm text-warning-600">已转入仲裁流程</p>
            </div>
          </div>
        </div>
      );
    }

    // 等待确认
    if (complaint.mediationRecord && complaint.consumerSatisfied === undefined) {
      const deadline = new Date(new Date(complaint.mediationRecord.createdAt).getTime() + 72 * 60 * 60 * 1000).toISOString();
      const remaining = getTimeRemaining(deadline);

      return (
        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-info-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-info-500" />
            </div>
            <div>
              <p className="font-medium text-info-700">等待消费者确认</p>
              <p className="text-sm text-info-600">请耐心等待消费者反馈</p>
            </div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-neutral-500 mb-1">剩余确认时间</p>
            <p className={cn(
              "font-mono font-bold",
              remaining.isExpired || remaining.days === 0 && remaining.hours < 12 ? "text-danger-600" : "text-info-600"
            )}>
              {remaining.isExpired ? '已超时' : `${remaining.days}天 ${remaining.hours}小时 ${remaining.minutes}分`}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const getEvidenceIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
    }
  };

  const renderEvidenceGrid = (evidenceList: Evidence[]) => {
    if (evidenceList.length === 0) {
      return (
        <div className="py-6 text-center text-neutral-400 text-sm">
          暂无上传的证据材料
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {evidenceList.map((ev) => (
          <div
            key={ev.id}
            className="group relative rounded-lg border border-neutral-200 overflow-hidden hover:border-primary-400 hover:shadow-md transition-all"
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

  // 渲染消息气泡
  const renderMessageBubble = (record: CommunicationRecord) => {
    const isService = record.sender === 'service';
    const isConsumer = record.sender === 'consumer';

    const bubbleClass = cn(
      "max-w-[75%] px-4 py-2 rounded-2xl",
      isService && "bg-primary-500 text-white rounded-br-md ml-auto",
      isConsumer && "bg-neutral-100 text-neutral-800 rounded-bl-md",
      record.sender === 'merchant' && "bg-warning-50 text-neutral-800 border border-warning-200 rounded-bl-md"
    );

    const senderLabel = isService ? '客服' : isConsumer ? '消费者' : '商家';
    const senderColor = isService ? 'text-primary-600' : isConsumer ? 'text-neutral-600' : 'text-warning-600';

    return (
      <div key={record.id} className={cn("mb-4", isService && "text-right")}>
        <div className={cn("text-xs mb-1", senderColor)}>
          {record.senderName} ({senderLabel})
        </div>
        <div className={bubbleClass}>
          <p className="text-sm">{record.content}</p>
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {formatRelativeTime(record.createdAt)}
        </div>
      </div>
    );
  };

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">投诉不存在或已被删除</p>
          <button onClick={() => navigate('/service')} className="btn btn-primary mt-4">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/service')}
              className="btn btn-ghost gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-neutral-800">
                  投诉详情 <span className="font-mono text-primary-500 font-normal">{complaint.id}</span>
                </h1>
                <span className={cn("badge", getStatusBadgeClass(complaint.status))}>
                  {COMPLAINT_STATUS_LABELS[complaint.status]}
                </span>
                <span className={cn(
                  "badge",
                  complaint.priority === 'high' ? "badge-danger" :
                  complaint.priority === 'medium' ? "badge-warning" : "badge-neutral"
                )}>
                  {PRIORITY_LABELS[complaint.priority]}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {complaint.consumerSatisfied === false && !complaint.arbitratorId && (
              <button
                onClick={handleUpgradeArbitration}
                className="btn btn-warning gap-2"
              >
                <Gavel className="w-4 h-4" />
                升级仲裁
              </button>
            )}
            <button
              onClick={() => setShowAddEvidence(true)}
              className="btn btn-secondary gap-2"
            >
              <Upload className="w-4 h-4" />
              补充证据
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex">
        {/* 左侧主内容区 - 70% */}
        <div className="w-[70%] p-6 space-y-6">
          {/* 订单信息卡片 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-500" />
              订单信息
            </h3>
            <div className="flex items-start gap-6">
              <img
                src={complaint.orderInfo.productImage}
                alt={complaint.orderInfo.productName}
                className="w-24 h-24 rounded-xl object-cover border border-neutral-200"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-800 mb-2">
                  {complaint.orderInfo.productName}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-500">订单金额：</span>
                    <span className="font-medium text-danger-600">{formatCurrency(complaint.orderInfo.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-500">下单时间：</span>
                    <span>{formatDate(complaint.orderInfo.orderTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-500">商家：</span>
                    <span>{complaint.orderInfo.merchantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-500">订单号：</span>
                    <span className="font-mono">{complaint.orderId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 投诉详情 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning-500" />
              投诉详情
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="badge badge-info">{COMPLAINT_TYPE_LABELS[complaint.type]}</span>
                <span className="font-medium text-neutral-800">{complaint.title}</span>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-neutral-700 leading-relaxed">{complaint.description}</p>
              </div>
            </div>
          </div>

          {/* 商家申诉 */}
          {complaint.merchantAppeal && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-info-500" />
                商家申诉
              </h3>
              <div className="bg-info-50 rounded-lg p-4 mb-4">
                <p className="text-neutral-700 leading-relaxed">{complaint.merchantAppeal.content}</p>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                提交时间：{formatDate(complaint.merchantAppeal.submittedAt)}
              </p>
            </div>
          )}

          {/* 证据材料分区展示 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-neutral-800">证据材料分区展示</h3>
              </div>
              <button
                onClick={() => setShowAddEvidence(true)}
                className="btn btn-primary btn-sm gap-1"
              >
                <Upload className="w-4 h-4" />
                补充调查证据
              </button>
            </div>

            <div className="space-y-5">
              {/* 消费者证据 - 蓝色主题 */}
              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-700">消费者提交的证据</p>
                    <p className="text-xs text-neutral-500">{complaint.consumerName} · 共 {complaint.evidence.length} 份</p>
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
                    <p className="text-sm font-semibold text-warning-700">商家申诉证据</p>
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
              <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-700">客服补充调查证据</p>
                    <p className="text-xs text-neutral-500">
                      平台客服独立调查材料
                      {complaint.serviceEvidence ? ` · 共 ${complaint.serviceEvidence.length} 份` : ''}
                    </p>
                  </div>
                </div>
                {renderEvidenceGrid(complaint.serviceEvidence || [])}
              </div>
            </div>
          </div>

          {/* 沟通记录 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              沟通记录
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 mb-4 max-h-80 overflow-y-auto">
              {communicationRecords.length > 0 ? (
                <>
                  {communicationRecords.map(renderMessageBubble)}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center py-8 text-neutral-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无沟通记录</p>
                </div>
              )}
            </div>
            {/* 发送消息 */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="输入消息内容..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="input flex-1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="btn btn-primary gap-2"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
          </div>

          {/* 调解方案表单 */}
          {!complaint.mediationRecord && !complaint.arbitrationAssignedAt && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-success-500" />
                提交调解方案
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    调解说明
                  </label>
                  <textarea
                    value={mediationContent}
                    onChange={(e) => setMediationContent(e.target.value)}
                    placeholder="请详细描述调解方案内容，包括问题分析、处理建议等..."
                    rows={4}
                    className="input-textarea w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    建议赔付金额（元）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">¥</span>
                    <input
                      type="number"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value)}
                      placeholder="请输入建议赔付金额"
                      className="input pl-8 w-full"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    订单金额：{formatCurrency(complaint.amount)}
                  </p>
                </div>
                <button
                  onClick={handleSubmitMediation}
                  disabled={!mediationContent.trim()}
                  className="btn btn-success w-full gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  提交调解方案
                </button>
              </div>
            </div>
          )}

          {/* 已提交的调解方案 */}
          {complaint.mediationRecord && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-success-500" />
                调解方案
              </h3>
              <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-500">
                    由 {complaint.mediationRecord.serviceName} 提交于 {formatDate(complaint.mediationRecord.createdAt)}
                  </span>
                </div>
                <p className="text-neutral-700 leading-relaxed mb-4">{complaint.mediationRecord.content}</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success-500" />
                  <span className="text-sm text-neutral-600">建议赔付金额：</span>
                  <span className="font-bold text-success-600">{formatCurrency(complaint.mediationRecord.proposedAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧边栏 - 30% */}
        <div className="w-[30%] p-6 pl-0 space-y-6">
          {/* 处理进度时间线 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              处理进度
            </h3>
            <div className="relative">
              {timeline.map((step, index) => (
                <div key={step.id} className="relative pl-8 pb-6 last:pb-0">
                  {/* 连接线 */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-neutral-200" />
                  )}
                  {/* 时间点 */}
                  <div className={cn(
                    "absolute left-1.5 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                    step.status === 'completed' ? "bg-success-500" :
                    step.status === 'active' ? "bg-primary-500" : "bg-neutral-300"
                  )}>
                    {step.status === 'completed' && (
                      <CheckCircle className="w-3 h-3 text-white -mt-0.5 -ml-0.5" />
                    )}
                    {step.status === 'active' && (
                      <div className="w-2 h-2 bg-white rounded-full mt-0.5 ml-0.5 animate-pulse" />
                    )}
                  </div>
                  {/* 内容 */}
                  <div>
                    <p className={cn(
                      "font-medium",
                      step.status === 'completed' ? "text-success-700" :
                      step.status === 'active' ? "text-primary-700" : "text-neutral-400"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">{step.description}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatRelativeTime(step.time)}
                      {step.handler && ` · ${step.handler}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 消费者满意度确认 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-primary-500" />
              消费者满意度
            </h3>
            {renderSatisfactionStatus()}
          </div>

          {/* 案件信息 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              案件信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">投诉人</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {complaint.consumerName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">涉事商家</span>
                <span className="font-medium flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {complaint.orderInfo.merchantName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">投诉金额</span>
                <span className="font-medium text-danger-600">{formatCurrency(complaint.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">提交时间</span>
                <span>{formatDate(complaint.createdAt, 'short')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">分派时间</span>
                <span>{complaint.assignedAt ? formatDate(complaint.assignedAt, 'short') : '-'}</span>
              </div>
              {complaint.serviceName && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">负责客服</span>
                  <span>{complaint.serviceName}</span>
                </div>
              )}
              {complaint.arbitratorName && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">负责仲裁员</span>
                  <span>{complaint.arbitratorName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 补充证据弹窗 */}
      {showAddEvidence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-elevation-3 max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-800">客服补充调查证据</h3>
              <button
                onClick={() => setShowAddEvidence(false)}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                <p className="text-xs text-purple-700">
                  💡 补充的证据将独立展示，不会与消费者/商家证据混淆
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  证据类型
                </label>
                <div className="flex gap-2">
                  {(['image', 'video', 'document'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setEvidenceType(type)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                        evidenceType === type
                          ? "border-primary-500 bg-primary-50 text-primary-600"
                          : "border-neutral-200 hover:border-neutral-300"
                      )}
                    >
                      {type === 'image' && <Image className="w-4 h-4" />}
                      {type === 'video' && <Video className="w-4 h-4" />}
                      {type === 'document' && <File className="w-4 h-4" />}
                      <span className="text-sm">
                        {type === 'image' ? '图片' : type === 'video' ? '视频' : '文档'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  证据名称
                </label>
                <input
                  type="text"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="请输入证据名称"
                  className="input w-full"
                />
              </div>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-neutral-400 mt-1">支持 JPG、PNG、MP4、PDF 格式</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <button
                onClick={() => setShowAddEvidence(false)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAddEvidence}
                disabled={!evidenceName.trim()}
                className="btn btn-primary flex-1"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceComplaintDetail;
