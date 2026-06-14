import { create } from 'zustand';
import type { Complaint, Evidence, MediationRecord, Award, MerchantAppeal, Compensation, CreditRecord, Message, ComplaintType, ComplaintStatus, CommunicationRecord } from '../types';
import { mockComplaints, mockCompensations, mockCreditRecords, mockMessages, mockUsers } from '../mock/data';
import { generateId } from '../utils/format';
import { calculateCompensation, calculateCreditChange, determinePriority, autoAssignService, autoAssignArbitrator } from '../utils/calculation';
import { useAuthStore } from './authStore';

interface ComplaintState {
  complaints: Complaint[];
  compensations: Compensation[];
  creditRecords: CreditRecord[];
  messages: Message[];
  addComplaint: (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority'> & { type: ComplaintType; amount: number }) => Complaint;
  getComplaintById: (id: string) => Complaint | undefined;
  getConsumerComplaints: (consumerId: string) => Complaint[];
  getMerchantComplaints: (merchantId: string) => Complaint[];
  getServiceComplaints: (serviceId: string) => Complaint[];
  getArbitratorComplaints: (arbitratorId: string) => Complaint[];
  getPendingAssignments: () => Complaint[];
  assignToService: (complaintId: string, serviceId: string, serviceName: string) => void;
  submitMediation: (complaintId: string, mediation: Omit<MediationRecord, 'id' | 'createdAt'>) => void;
  setConsumerSatisfaction: (complaintId: string, satisfied: boolean) => void;
  submitMerchantAppeal: (complaintId: string, appeal: Omit<MerchantAppeal, 'id' | 'submittedAt'>) => void;
  submitAward: (complaintId: string, award: Omit<Award, 'id' | 'createdAt' | 'isFinal'> & { isFinal?: boolean }) => void;
  requestReArbitration: (complaintId: string, consumerId: string, consumerName: string) => Complaint | null;
  addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => void;
  markMessageRead: (messageId: string) => void;
  markAllMessagesRead: (recipientId: string) => void;
  getUnreadCount: (recipientId: string) => number;
  addEvidence: (complaintId: string, evidence: Omit<Evidence, 'id' | 'uploadTime'>) => void;
  addServiceEvidence: (complaintId: string, evidenceList: Evidence[]) => void;
  addCommunicationRecord: (complaintId: string, record: CommunicationRecord) => void;
  autoProcessAssignments: () => void;
}

export const useComplaintStore = create<ComplaintState>((set, get) => ({
  complaints: mockComplaints,
  compensations: mockCompensations,
  creditRecords: mockCreditRecords,
  messages: mockMessages,

  addComplaint: (data) => {
    const priority = determinePriority(data.amount, data.type);
    const newComplaint: Complaint = {
      ...data,
      id: generateId('CP'),
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({ complaints: [newComplaint, ...state.complaints] }));
    return newComplaint;
  },

  getComplaintById: (id) => get().complaints.find(c => c.id === id),

  getConsumerComplaints: (consumerId) => get().complaints.filter(c => c.consumerId === consumerId),

  getMerchantComplaints: (merchantId) => get().complaints.filter(c => c.orderInfo.merchantId === merchantId),

  getServiceComplaints: (serviceId) => get().complaints.filter(c => c.serviceId === serviceId),

  getArbitratorComplaints: (arbitratorId) => get().complaints.filter(c => c.arbitratorId === arbitratorId),

  getPendingAssignments: () => get().complaints.filter(c => c.status === 'pending'),

  assignToService: (complaintId, serviceId, serviceName) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? { ...c, status: 'assigned' as ComplaintStatus, serviceId, serviceName, assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : c
      ),
    }));
    const complaint = get().complaints.find(c => c.id === complaintId);
    if (complaint) {
      get().addMessage({
        recipientId: serviceId,
        recipientRole: 'service',
        type: 'mediation_needed',
        title: '新的投诉已分派给您',
        content: `您收到1笔${complaint.priority === 'high' ? '高优先级' : ''}投诉（${complaint.title}），金额${complaint.amount}元，请优先处理。`,
        relatedId: complaintId,
        relatedType: 'complaint',
      });
      get().addMessage({
        recipientId: complaint.consumerId,
        recipientRole: 'consumer',
        type: 'complaint_assigned',
        title: '您的投诉已分派处理',
        content: `您提交的投诉（${complaint.orderInfo.productName.slice(0, 20)}...）已由${serviceName}接手处理，请保持电话畅通。`,
        relatedId: complaintId,
        relatedType: 'complaint',
      });
      get().addMessage({
        recipientId: complaint.orderInfo.merchantId,
        recipientRole: 'merchant',
        type: 'complaint_assigned',
        title: '您收到新的投诉',
        content: `您有一笔新的投诉需要处理（${complaint.orderInfo.productName.slice(0, 20)}...），请在48小时内作出回应，超时将默认支持消费者。`,
        relatedId: complaintId,
        relatedType: 'complaint',
      });
    }
  },

  submitMediation: (complaintId, mediation) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              status: 'mediated' as ComplaintStatus,
              mediationRecord: {
                ...mediation,
                id: generateId('med'),
                createdAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  setConsumerSatisfaction: (complaintId, satisfied) => {
    const state = get();
    const complaint = state.complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    if (satisfied) {
      set(state => ({
        complaints: state.complaints.map(c =>
          c.id === complaintId
            ? { ...c, status: 'closed' as ComplaintStatus, consumerSatisfied: true, updatedAt: new Date().toISOString() }
            : c
        ),
      }));
    } else {
      const arbitrators = mockUsers.filter(u => u.role === 'arbitrator').map(u => ({
        id: u.id,
        isSenior: u.isSenior,
        load: state.complaints.filter(c => c.arbitratorId === u.id && c.status === 'arbitrating').length,
        name: u.realName,
      }));
      const assignedArbitrator = autoAssignArbitrator(arbitrators);

      if (assignedArbitrator) {
        set(state => ({
          complaints: state.complaints.map(c =>
            c.id === complaintId
              ? {
                  ...c,
                  status: 'arbitrating' as ComplaintStatus,
                  consumerSatisfied: false,
                  arbitratorId: assignedArbitrator.id,
                  arbitratorName: assignedArbitrator.name,
                  arbitrationAssignedAt: new Date().toISOString(),
                  merchantResponseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
        state.addMessage({
          recipientId: assignedArbitrator.id,
          recipientRole: 'arbitrator',
          type: 'arbitration_needed',
          title: '新的仲裁案件已分配',
          content: `您收到1笔仲裁案件，涉及金额${complaint.amount}元，请在72小时内作出裁决。`,
          relatedId: complaintId,
          relatedType: 'complaint',
        });
        state.addMessage({
          recipientId: complaint.consumerId,
          recipientRole: 'consumer',
          type: 'arbitration_needed',
          title: '投诉已转入仲裁流程',
          content: `由于您对调解结果不满意，系统已自动转入仲裁流程，由${assignedArbitrator.name}负责审理。请及时查看并补充相关证据。`,
          relatedId: complaintId,
          relatedType: 'complaint',
        });
      }
    }
  },

  submitMerchantAppeal: (complaintId, appeal) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              merchantAppeal: {
                ...appeal,
                id: generateId('appeal'),
                submittedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  submitAward: (complaintId, awardData) => {
    const state = get();
    const complaint = state.complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const compensationAmount = awardData.compensationAmount;

    const award: Award = {
      ...awardData,
      id: generateId('award'),
      createdAt: new Date().toISOString(),
      isFinal: awardData.isFinal ?? true,
    };

    if (award.liability !== 'consumer' && compensationAmount > 0) {
      const compensation: Compensation = {
        id: generateId('COMP'),
        complaintId,
        amount: compensationAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      set(state => ({ compensations: [compensation, ...state.compensations] }));
    }

    if (award.liability !== 'consumer') {
      const merchant = mockUsers.find(u => u.id === complaint.orderInfo.merchantId);
      if (merchant && merchant.creditScore !== undefined) {
        const creditResult = calculateCreditChange(merchant.creditScore, complaint, award.liability);
        const creditRecord: CreditRecord = {
          id: generateId('CR'),
          merchantId: merchant.id,
          type: 'deduct',
          amount: creditResult.deductAmount,
          reason: `仲裁裁定${award.liability === 'merchant' ? '全责' : '部分责任'} - ${complaint.title}`,
          complaintId,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ creditRecords: [creditRecord, ...state.creditRecords] }));
        state.addMessage({
          recipientId: merchant.id,
          recipientRole: 'merchant',
          type: 'credit_changed',
          title: '信用分已扣减',
          content: `因仲裁裁定您承担${award.liability === 'merchant' ? '全部' : '部分'}责任，您的信用分已扣减${creditResult.deductAmount}分，当前信用分${creditResult.newScore}分${creditResult.isFrozen ? '，已冻结新商品上架权限' : ''}。`,
          relatedId: creditRecord.id,
          relatedType: 'credit',
        });
      }
    }

    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? { ...c, status: 'awarded' as ComplaintStatus, award, updatedAt: new Date().toISOString() }
          : c
      ),
    }));

    state.addMessage({
      recipientId: complaint.consumerId,
      recipientRole: 'consumer',
      type: 'award_published',
      title: '仲裁结果已发布',
      content: `您的投诉（${complaint.orderInfo.productName.slice(0, 20)}...）已作出仲裁裁决${compensationAmount > 0 ? `，赔付金额${compensationAmount}元` : ''}。请点击查看详情并下载裁决书。`,
      relatedId: complaintId,
      relatedType: 'award',
    });
  },

  requestReArbitration: (complaintId, consumerId, consumerName) => {
    const state = get();
    const original = state.complaints.find(c => c.id === complaintId);
    if (!original || original.finalAward) return null;

    const originalArbitratorId = original.arbitratorId;
    const arbitrators = mockUsers.filter(u => u.role === 'arbitrator').map(u => ({
      id: u.id,
      isSenior: u.isSenior,
      load: state.complaints.filter(c => c.arbitratorId === u.id && c.status === 'arbitrating').length,
      name: u.realName,
    }));
    const assignedArbitrator = autoAssignArbitrator(arbitrators, originalArbitratorId);

    if (!assignedArbitrator) return null;

    const reComplaint: Complaint = {
      ...original,
      id: generateId('CP'),
      status: 'arbitrating',
      isReArbitration: true,
      parentComplaintId: complaintId,
      finalAward: true,
      arbitratorId: assignedArbitrator.id,
      arbitratorName: assignedArbitrator.name,
      arbitrationAssignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consumerId,
      consumerName,
    };

    set(state => ({
      complaints: [reComplaint, ...state.complaints],
    }));

    state.addMessage({
      recipientId: assignedArbitrator.id,
      recipientRole: 'arbitrator',
      type: 'arbitration_needed',
      title: '新的再次仲裁复核案件',
      content: `您收到1笔再次仲裁复核案件（终裁），涉及金额${original.amount}元，请在72小时内作出终局裁决。`,
      relatedId: reComplaint.id,
      relatedType: 'complaint',
    });

    return reComplaint;
  },

  addMessage: (message) => {
    set(state => ({
      messages: [{ ...message, id: generateId('msg'), createdAt: new Date().toISOString(), isRead: false }, ...state.messages],
    }));
  },

  markMessageRead: (messageId) => {
    set(state => ({
      messages: state.messages.map(m => (m.id === messageId ? { ...m, isRead: true } : m)),
    }));
  },

  markAllMessagesRead: (recipientId) => {
    set(state => ({
      messages: state.messages.map(m => (m.recipientId === recipientId ? { ...m, isRead: true } : m)),
    }));
  },

  getUnreadCount: (recipientId) => get().messages.filter(m => m.recipientId === recipientId && !m.isRead).length,

  addEvidence: (complaintId, evidence) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              evidence: [...c.evidence, { ...evidence, id: generateId('evi'), uploadTime: new Date().toISOString() }],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  addCommunicationRecord: (complaintId, record) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              mediationRecord: c.mediationRecord
                ? {
                    ...c.mediationRecord,
                    communicationRecords: [...c.mediationRecord.communicationRecords, record],
                  }
                : c.mediationRecord,
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  addServiceEvidence: (complaintId, evidenceList) => {
    set(state => ({
      complaints: state.complaints.map(c =>
        c.id === complaintId
          ? {
              ...c,
              serviceEvidence: [
                ...(c.serviceEvidence || []),
                ...evidenceList.map(e => ({ ...e, uploadTime: new Date().toISOString() })),
              ],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));

    const complaint = useComplaintStore.getState().getComplaintById(complaintId);
    const currentUser = useAuthStore.getState().currentUser;
    if (complaint && currentUser) {
      useComplaintStore.getState().addCommunicationRecord(complaintId, {
        id: `comm-${Date.now()}`,
        sender: 'service',
        senderName: currentUser.realName,
        content: `补充了 ${evidenceList.length} 份调查证据材料`,
        createdAt: new Date().toISOString(),
      });
    }
  },

  autoProcessAssignments: () => {
    const state = get();
    const pending = state.getPendingAssignments();
    const services = mockUsers.filter(u => u.role === 'service').map(u => ({
      id: u.id,
      isSenior: u.isSenior,
      load: state.complaints.filter(c => c.serviceId === u.id && ['assigned', 'mediating'].includes(c.status)).length,
      name: u.realName,
    }));

    pending.forEach(complaint => {
      const assigned = autoAssignService(complaint.type, complaint.priority, services);
      if (assigned) {
        get().assignToService(complaint.id, assigned.id, assigned.name);
      }
    });
  },
}));
