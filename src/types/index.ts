export type UserRole = 'consumer' | 'merchant' | 'service' | 'arbitrator' | 'operator';

export type ComplaintType = 'quality' | 'logistics' | 'misrepresentation' | 'price' | 'aftersale';
export type ComplaintStatus = 'pending' | 'assigned' | 'mediating' | 'mediated' | 'arbitrating' | 'awarded' | 'closed' | 'reject';
export type Priority = 'high' | 'medium' | 'low';
export type MessageType = 'complaint_assigned' | 'mediation_needed' | 'arbitration_needed' | 'award_published' | 'credit_changed' | 'compensation_done' | 'system' | 'timeout_warning';
export type RelatedType = 'complaint' | 'award' | 'compensation' | 'credit';

export interface User {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  avatar: string;
  phone: string;
  email: string;
  merchantName?: string;
  creditScore?: number;
  creditLevel?: 'A' | 'B' | 'C' | 'D';
  isFrozen?: boolean;
  isSenior?: boolean;
  caseCount?: number;
  successRate?: number;
}

export interface Evidence {
  id: string;
  type: 'image' | 'chat' | 'video' | 'document';
  url: string;
  name: string;
  uploadTime: string;
  uploader: 'consumer' | 'merchant';
}

export interface CommunicationRecord {
  id: string;
  sender: 'consumer' | 'merchant' | 'service';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface MediationRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  content: string;
  solution: string;
  proposedAmount: number;
  createdAt: string;
  communicationRecords: CommunicationRecord[];
}

export interface MerchantAppeal {
  id: string;
  content: string;
  evidence: Evidence[];
  submittedAt: string;
}

export interface Award {
  id: string;
  arbitratorId: string;
  arbitratorName: string;
  content: string;
  liability: 'consumer' | 'merchant' | 'both';
  merchantLiabilityPercent: number;
  compensationAmount: number;
  documentUrl: string;
  createdAt: string;
  isFinal: boolean;
}

export interface Compensation {
  id: string;
  complaintId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  voucherUrl?: string;
  createdAt: string;
}

export interface CreditRecord {
  id: string;
  merchantId: string;
  type: 'deduct' | 'add';
  amount: number;
  reason: string;
  complaintId?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  orderId: string;
  orderInfo: {
    productName: string;
    productImage: string;
    amount: number;
    orderTime: string;
    merchantId: string;
    merchantName: string;
  };
  consumerId: string;
  consumerName: string;
  type: ComplaintType;
  title: string;
  description: string;
  evidence: Evidence[];
  amount: number;
  priority: Priority;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  serviceId?: string;
  serviceName?: string;
  assignedAt?: string;
  mediationRecord?: MediationRecord;
  consumerSatisfied?: boolean;
  arbitratorId?: string;
  arbitratorName?: string;
  arbitrationAssignedAt?: string;
  award?: Award;
  isReArbitration?: boolean;
  parentComplaintId?: string;
  finalAward?: boolean;
  merchantAppeal?: MerchantAppeal;
  merchantResponseDeadline?: string;
  merchantTimeout?: boolean;
}

export interface Message {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  type: MessageType;
  title: string;
  content: string;
  relatedId: string;
  relatedType: RelatedType;
  isRead: boolean;
  createdAt: string;
}

export interface RuleConfig {
  id: string;
  category: 'compensation' | 'timeline' | 'credit';
  subCategory: string;
  key: string;
  value: string | number | boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ReportData {
  period: string;
  category: string;
  complaintCount: number;
  complaintRate: number;
  totalCompensation: number;
  avgArbitrationTime: number;
  mediationSuccessRate: number;
}

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'active' | 'pending';
  handler?: string;
}

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  quality: '商品质量',
  logistics: '物流延误',
  misrepresentation: '虚假描述',
  price: '价格问题',
  aftersale: '售后服务',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: '待分派',
  assigned: '已分派',
  mediating: '调解中',
  mediated: '调解完成',
  arbitrating: '仲裁中',
  awarded: '已裁决',
  closed: '已结案',
  reject: '已驳回',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  consumer: '消费者',
  merchant: '商家',
  service: '客服专员',
  arbitrator: '仲裁员',
  operator: '平台运营',
};
