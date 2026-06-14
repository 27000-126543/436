import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Tag,
  FileText,
  Upload,
  X,
  Image,
  MessageCircle,
  Video,
  File,
  CheckCircle2,
  AlertCircle,
  Home,
  Truck,
  Info,
  DollarSign,
  Wrench,
  Plus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatCurrency, formatDate, generateId } from '@/utils/format';
import {
  COMPLAINT_TYPE_LABELS,
  type ComplaintType,
  type Evidence,
} from '@/types';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: '选择订单', description: '选择需要投诉的订单' },
  { id: 2, title: '选择类型', description: '选择投诉问题类型' },
  { id: 3, title: '填写详情', description: '描述问题并上传证据' },
  { id: 4, title: '确认提交', description: '核对信息并提交' },
];

interface MockOrder {
  id: string;
  productName: string;
  productImage: string;
  amount: number;
  orderTime: string;
  merchantId: string;
  merchantName: string;
  status: 'received' | 'shipping' | 'completed';
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ORD20250610001',
    productName: 'Sony WH-1000XM5 无线降噪头戴式耳机',
    productImage: 'https://picsum.photos/seed/headphone/200/200',
    amount: 2599,
    orderTime: '2025-06-08T10:30:00.000Z',
    merchantId: 'merchant_001',
    merchantName: '优品数码旗舰店',
    status: 'received',
  },
  {
    id: 'ORD20250609002',
    productName: '夏季女士雪纺连衣裙 法式复古显瘦长裙',
    productImage: 'https://picsum.photos/seed/dress/200/200',
    amount: 399,
    orderTime: '2025-06-07T14:20:00.000Z',
    merchantId: 'merchant_002',
    merchantName: '潮流服饰专营店',
    status: 'received',
  },
  {
    id: 'ORD20250608003',
    productName: '小米智能体脂秤 S400 家用精准电子秤',
    productImage: 'https://picsum.photos/seed/scale/200/200',
    amount: 199,
    orderTime: '2025-06-06T09:00:00.000Z',
    merchantId: 'merchant_001',
    merchantName: '优品数码旗舰店',
    status: 'shipping',
  },
  {
    id: 'ORD20250605004',
    productName: '北欧简约实木餐桌 家用小户型长方形饭桌',
    productImage: 'https://picsum.photos/seed/table/200/200',
    amount: 1899,
    orderTime: '2025-06-03T16:45:00.000Z',
    merchantId: 'merchant_002',
    merchantName: '潮流服饰专营店',
    status: 'completed',
  },
];

const COMPLAINT_TYPES: {
  value: ComplaintType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    value: 'quality',
    label: '商品质量',
    icon: Package,
    description: '商品存在瑕疵、损坏、功能异常等质量问题',
  },
  {
    value: 'logistics',
    label: '物流延误',
    icon: Truck,
    description: '物流长时间未更新、包裹丢失或配送延迟',
  },
  {
    value: 'misrepresentation',
    label: '虚假描述',
    icon: Info,
    description: '商品与描述不符、存在虚假宣传或误导',
  },
  {
    value: 'price',
    label: '价格问题',
    icon: DollarSign,
    description: '价格欺诈、标价错误、价保纠纷等',
  },
  {
    value: 'aftersale',
    label: '售后服务',
    icon: Wrench,
    description: '售后拒绝保修、退货退款困难、服务态度差',
  },
];

const EVIDENCE_TYPES: {
  value: Evidence['type'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accept: string;
  description: string;
}[] = [
  {
    value: 'image',
    label: '图片',
    icon: Image,
    accept: 'image/*',
    description: '商品问题照片、截图等',
  },
  {
    value: 'chat',
    label: '聊天记录',
    icon: MessageCircle,
    accept: 'image/*',
    description: '与商家的沟通记录截图',
  },
  {
    value: 'video',
    label: '视频',
    icon: Video,
    accept: 'video/*',
    description: '问题演示视频、开箱视频等',
  },
  {
    value: 'document',
    label: '文档',
    icon: File,
    accept: '.pdf,.doc,.docx,.txt',
    description: '发票、检测报告、合同等',
  },
];

export default function ComplaintForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { addComplaint, autoProcessAssignments } = useComplaintStore();

  const consumerId = currentUser?.id || 'consumer_001';
  const consumerName = currentUser?.realName || '张小明';

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedOrder !== null;
      case 2:
        return selectedType !== null;
      case 3:
        return title.trim().length >= 5 && description.trim().length >= 20;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedOrder, selectedType, title, description]);

  const handleNext = () => {
    if (currentStep < 4 && canProceed) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddEvidence = (type: Evidence['type']) => {
    const mockEvidence: Evidence = {
      id: generateId('evi'),
      type,
      url: `https://picsum.photos/seed/${type}${Date.now()}/400/300`,
      name: `${type === 'image' ? '证据图片' : type === 'chat' ? '聊天记录' : type === 'video' ? '问题视频' : '证明文档'}_${evidences.length + 1}.${type === 'image' || type === 'chat' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf'}`,
      uploadTime: new Date().toISOString(),
      uploader: 'consumer',
    };
    setEvidences([...evidences, mockEvidence]);
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidences(evidences.filter(e => e.id !== id));
  };

  const handleSubmit = () => {
    if (!selectedOrder || !selectedType) return;

    const complaint = addComplaint({
      orderId: selectedOrder.id,
      orderInfo: {
        productName: selectedOrder.productName,
        productImage: selectedOrder.productImage,
        amount: selectedOrder.amount,
        orderTime: selectedOrder.orderTime,
        merchantId: selectedOrder.merchantId,
        merchantName: selectedOrder.merchantName,
      },
      consumerId,
      consumerName,
      type: selectedType,
      title,
      description,
      evidence: evidences,
      amount: selectedOrder.amount,
    });

    autoProcessAssignments();
    setSubmittedId(complaint.id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 lg:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            投诉提交成功
          </h1>
          <p className="text-neutral-500 mb-6">
            我们已收到您的投诉，平台客服将在24小时内介入处理
          </p>
          <div className="bg-neutral-50 rounded-xl p-6 mb-8 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500 mb-1">投诉编号</p>
                <p className="font-medium text-neutral-800">{submittedId}</p>
              </div>
              <div>
                <p className="text-neutral-500 mb-1">提交时间</p>
                <p className="font-medium text-neutral-800">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 mb-1">投诉类型</p>
                <p className="font-medium text-neutral-800">
                  {COMPLAINT_TYPE_LABELS[selectedType!]}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 mb-1">涉诉金额</p>
                <p className="font-medium text-neutral-800">
                  {formatCurrency(selectedOrder!.amount)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/consumer/complaints/${submittedId}`)}
              className="btn btn-primary gap-2"
            >
              <FileText className="w-4 h-4" />
              查看投诉进度
            </button>
            <button
              onClick={() => navigate('/consumer')}
              className="btn btn-secondary gap-2"
            >
              <Home className="w-4 h-4" />
              返回工作台
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost !p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-800">提交新投诉</h1>
          <p className="text-sm text-neutral-500">
            请按步骤填写投诉信息，我们将尽快为您处理
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm transition-all',
                    currentStep > step.id
                      ? 'bg-success-500 text-white'
                      : currentStep === step.id
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-neutral-100 text-neutral-500'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id
                        ? 'text-neutral-800'
                        : 'text-neutral-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-neutral-400 hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 lg:mx-4 rounded-full',
                    currentStep > step.id
                      ? 'bg-success-500'
                      : 'bg-neutral-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 lg:p-8">
        {currentStep === 1 && (
          <Step1SelectOrder
            orders={MOCK_ORDERS}
            selectedOrder={selectedOrder}
            onSelect={setSelectedOrder}
          />
        )}
        {currentStep === 2 && (
          <Step2SelectType
            selectedType={selectedType}
            onSelect={setSelectedType}
          />
        )}
        {currentStep === 3 && (
          <Step3FillDetails
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            evidences={evidences}
            onAddEvidence={handleAddEvidence}
            onRemoveEvidence={handleRemoveEvidence}
          />
        )}
        {currentStep === 4 && (
          <Step4Confirm
            order={selectedOrder!}
            type={selectedType!}
            title={title}
            description={description}
            evidences={evidences}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="btn btn-secondary gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>
        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="btn btn-primary gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="btn btn-success gap-2"
          >
            <Sparkles className="w-4 h-4" />
            确认提交
          </button>
        )}
      </div>
    </div>
  );
}

function Step1SelectOrder({
  orders,
  selectedOrder,
  onSelect,
}: {
  orders: MockOrder[];
  selectedOrder: MockOrder | null;
  onSelect: (order: MockOrder) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-2">
        选择投诉订单
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        请选择您需要发起投诉的订单，仅显示近30天内的订单
      </p>
      <div className="space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => onSelect(order)}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              selectedOrder?.id === order.id
                ? 'border-primary-500 bg-primary-50/50 shadow-md'
                : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
            )}
          >
            <div className="flex items-start gap-4">
              <img
                src={order.productImage}
                alt={order.productName}
                className="w-20 h-20 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-neutral-800 line-clamp-1">
                    {order.productName}
                  </h3>
                  {selectedOrder?.id === order.id && (
                    <span className="badge badge-success flex-shrink-0 gap-1">
                      <Check className="w-3 h-3" />
                      已选择
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-neutral-500">
                  <span>订单号：{order.id}</span>
                  <span>商家：{order.merchantName}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary">
                      {order.status === 'received'
                        ? '已收货'
                        : order.status === 'shipping'
                        ? '配送中'
                        : '已完成'}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatDate(order.orderTime, 'date')}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(order.amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2SelectType({
  selectedType,
  onSelect,
}: {
  selectedType: ComplaintType | null;
  onSelect: (type: ComplaintType) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-2">
        选择投诉类型
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        请选择最符合您遇到问题的类型，有助于我们更快速地处理
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMPLAINT_TYPES.map(item => {
          const Icon = item.icon;
          const isSelected = selectedType === item.value;
          return (
            <div
              key={item.value}
              onClick={() => onSelect(item.value)}
              className={cn(
                'p-5 rounded-xl border-2 cursor-pointer transition-all group',
                isSelected
                  ? 'border-primary-500 bg-primary-50/50 shadow-md'
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-800">
                      {item.label}
                    </h3>
                    {isSelected && (
                      <Check className="w-4 h-4 text-success-600" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedType && (
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warning-700">
            <p className="font-medium mb-1">温馨提示</p>
            <p>
              根据您选择的投诉类型，建议准备相关证据材料，如商品照片、聊天记录等，这将有助于更快处理您的投诉。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3FillDetails({
  title,
  setTitle,
  description,
  setDescription,
  evidences,
  onAddEvidence,
  onRemoveEvidence,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  evidences: Evidence[];
  onAddEvidence: (type: Evidence['type']) => void;
  onRemoveEvidence: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">
          填写投诉详情
        </h2>
        <p className="text-sm text-neutral-500">
          请详细描述您遇到的问题，越详细越有助于问题的解决
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          投诉标题 <span className="text-danger-500">*</span>
          <span className="text-xs text-neutral-400 ml-2">
            ({title.length}/50字符)
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 50))}
          placeholder="请简要概括您遇到的问题，如：商品屏幕有亮点要求退货"
          className="input"
        />
        {title.length > 0 && title.length < 5 && (
          <p className="text-xs text-danger-500 mt-1">
            标题至少需要5个字符
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          详细描述 <span className="text-danger-500">*</span>
          <span className="text-xs text-neutral-400 ml-2">
            ({description.length}/500字符)
          </span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, 500))}
          rows={6}
          placeholder="请详细描述您遇到的问题，包括：
1. 问题发生的时间、地点
2. 问题的具体表现
3. 您与商家沟通的情况
4. 您的诉求（如退款、换货、赔偿等）"
          className="input-textarea"
        />
        {description.length > 0 && description.length < 20 && (
          <p className="text-xs text-danger-500 mt-1">
            描述至少需要20个字符
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          上传证据
          <span className="text-xs text-neutral-400 ml-2">
            (可选，最多10个文件)
          </span>
        </label>
        <p className="text-xs text-neutral-500 mb-4">
          支持图片、聊天记录截图、视频、文档等，单个文件不超过20MB
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {EVIDENCE_TYPES.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() =>
                  evidences.length < 10 && onAddEvidence(item.value)
                }
                disabled={evidences.length >= 10}
                className="p-4 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary-400 hover:bg-primary-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {item.label}
                </span>
                <span className="text-xs text-neutral-400 text-center leading-tight">
                  {item.description}
                </span>
                <Plus className="w-4 h-4 text-primary-500 mt-1" />
              </button>
            );
          })}
        </div>

        {evidences.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {evidences.map(evi => {
              const typeInfo = EVIDENCE_TYPES.find(t => t.value === evi.type);
              const Icon = typeInfo?.icon || File;
              return (
                <div
                  key={evi.id}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50"
                >
                  {(evi.type === 'image' || evi.type === 'chat') ? (
                    <img
                      src={evi.url}
                      alt={evi.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center bg-neutral-100">
                      <Icon className="w-10 h-10 text-neutral-400" />
                    </div>
                  )}
                  <button
                    onClick={() => onRemoveEvidence(evi.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-2">
                    <p className="text-xs text-neutral-700 truncate">
                      {evi.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Step4Confirm({
  order,
  type,
  title,
  description,
  evidences,
}: {
  order: MockOrder;
  type: ComplaintType;
  title: string;
  description: string;
  evidences: Evidence[];
}) {
  const typeInfo = COMPLAINT_TYPES.find(t => t.value === type);
  const TypeIcon = typeInfo?.icon || Tag;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-1">
          确认投诉信息
        </h2>
        <p className="text-sm text-neutral-500">
          请仔细核对以下信息，提交后将无法修改
        </p>
      </div>

      <div className="space-y-4">
        <Section title="订单信息" icon={Package}>
          <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl">
            <img
              src={order.productImage}
              alt={order.productName}
              className="w-20 h-20 rounded-lg object-cover bg-white flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-neutral-800 line-clamp-1">
                {order.productName}
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-neutral-500">订单号：</span>
                  <span className="text-neutral-700">{order.id}</span>
                </div>
                <div>
                  <span className="text-neutral-500">下单时间：</span>
                  <span className="text-neutral-700">
                    {formatDate(order.orderTime, 'date')}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">商家：</span>
                  <span className="text-neutral-700">{order.merchantName}</span>
                </div>
                <div>
                  <span className="text-neutral-500">订单金额：</span>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(order.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="投诉类型" icon={TypeIcon}>
          <div className="flex items-center gap-3 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
            <div className="w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center">
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-800">
                {COMPLAINT_TYPE_LABELS[type]}
              </p>
              <p className="text-sm text-neutral-500">{typeInfo?.description}</p>
            </div>
          </div>
        </Section>

        <Section title="投诉内容" icon={FileText}>
          <div className="p-4 bg-neutral-50 rounded-xl space-y-3">
            <div>
              <p className="text-xs text-neutral-500 mb-1">投诉标题</p>
              <p className="font-medium text-neutral-800">{title}</p>
            </div>
            <div className="pt-3 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 mb-1">详细描述</p>
              <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="证据材料"
          icon={Upload}
          count={evidences.length}
        >
          {evidences.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-xl">
              {evidences.map(evi => {
                const typeInfo = EVIDENCE_TYPES.find(t => t.value === evi.type);
                const Icon = typeInfo?.icon || File;
                return (
                  <div
                    key={evi.id}
                    className="rounded-lg overflow-hidden border border-neutral-200 bg-white"
                  >
                    {(evi.type === 'image' || evi.type === 'chat') ? (
                      <img
                        src={evi.url}
                        alt={evi.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-neutral-100">
                        <Icon className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-neutral-700 truncate">
                        {evi.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-neutral-50 rounded-xl text-center">
              <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">未上传证据材料</p>
            </div>
          )}
        </Section>
      </div>

      <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-warning-700">
          <p className="font-medium mb-1">提交前请确认</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>所填写信息真实有效，证据材料清晰完整</li>
            <li>提交后平台将在24小时内介入处理</li>
            <li>如需补充材料，可在投诉详情页继续上传</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="badge badge-primary">{count} 个</span>
        )}
      </div>
      {children}
    </div>
  );
}
