import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Eye, Clock, AlertCircle, Inbox, ChevronDown,
  Package, User, DollarSign, Flag, Calendar
} from 'lucide-react';
import { useComplaintStore } from '@/store/complaintStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatCurrency, formatDate, formatRelativeTime,
  getStatusBadgeClass, getTimeRemaining, truncateText
} from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  COMPLAINT_STATUS_LABELS, COMPLAINT_TYPE_LABELS, PRIORITY_LABELS
} from '@/types';
import type { Complaint, ComplaintStatus } from '@/types';

// 状态筛选选项
const statusOptions: { value: ComplaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'assigned', label: '待处理' },
  { value: 'mediating', label: '调解中' },
  { value: 'mediated', label: '已调解' },
  { value: 'arbitrating', label: '已升级仲裁' },
  { value: 'closed', label: '已结案' },
];

const ComplaintList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getServiceComplaints } = useComplaintStore();

  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [, setTick] = useState(0);

  // 倒计时定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  // 获取投诉列表
  const complaints = useMemo(() => {
    if (!currentUser) return [];
    return getServiceComplaints(currentUser.id);
  }, [currentUser, getServiceComplaints]);

  // 筛选和搜索
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      // 状态筛选
      if (statusFilter !== 'all' && complaint.status !== statusFilter) {
        return false;
      }
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          complaint.id.toLowerCase().includes(query) ||
          complaint.orderId.toLowerCase().includes(query) ||
          complaint.orderInfo.productName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  // 计算剩余处理时间显示
  const renderTimeRemaining = (complaint: Complaint) => {
    if (!complaint.assignedAt) return null;

    // 假设处理时限为48小时
    const deadline = new Date(new Date(complaint.assignedAt).getTime() + 48 * 60 * 60 * 1000).toISOString();
    const remaining = getTimeRemaining(deadline);

    if (remaining.isExpired) {
      return (
        <span className="flex items-center gap-1 text-danger-600 font-medium">
          <AlertCircle className="w-3 h-3" />
          已超时 {remaining.days}天{remaining.hours}小时
        </span>
      );
    }

    return (
      <span className={cn(
        "flex items-center gap-1",
        remaining.days === 0 && remaining.hours < 6 ? "text-warning-600" : "text-neutral-600"
      )}>
        <Clock className="w-3 h-3" />
        {remaining.days > 0 ? `${remaining.days}天` : ''}
        {remaining.hours}小时{remaining.minutes}分
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">我的投诉列表</h1>
        <p className="text-neutral-500">管理您负责的投诉案件，及时处理消费者诉求</p>
      </div>

      {/* 筛选区域 */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* 状态筛选 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:border-primary-400 transition-colors min-w-[140px]"
              >
                <Filter className="w-4 h-4 text-primary-500" />
                <span className="font-medium">
                  {statusOptions.find(o => o.value === statusFilter)?.label}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-neutral-400 transition-transform ml-auto",
                  showStatusDropdown && "rotate-180"
                )} />
              </button>
              {showStatusDropdown && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-elevation-2 z-50 overflow-hidden">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm hover:bg-primary-50 transition-colors flex items-center justify-between",
                        statusFilter === option.value ? "bg-primary-50 text-primary-600 font-medium" : "text-neutral-700"
                      )}
                    >
                      {option.label}
                      <span className="text-xs text-neutral-400">
                        {option.value === 'all'
                          ? complaints.length
                          : complaints.filter(c => c.status === option.value).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 快速筛选标签 */}
            <div className="hidden md:flex items-center gap-2">
              {['assigned', 'mediating', 'arbitrating'].map(status => {
                const count = complaints.filter(c => c.status === status).length;
                if (count === 0) return null;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as ComplaintStatus)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                      statusFilter === status
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {COMPLAINT_STATUS_LABELS[status as ComplaintStatus]} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索投诉号、订单号、商品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{complaints.length}</p>
              <p className="text-xs text-neutral-500">总投诉数</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {complaints.filter(c => c.status === 'assigned' || c.status === 'mediating').length}
              </p>
              <p className="text-xs text-neutral-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-danger-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600">
                {complaints.filter(c => c.priority === 'high').length}
              </p>
              <p className="text-xs text-neutral-500">高优先级</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {formatCurrency(complaints.reduce((sum, c) => sum + c.amount, 0))}
              </p>
              <p className="text-xs text-neutral-500">涉及金额</p>
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      {filteredComplaints.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">投诉编号</th>
                  <th className="table-header">商品信息</th>
                  <th className="table-header">投诉类型</th>
                  <th className="table-header">投诉人</th>
                  <th className="table-header">金额</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">优先级</th>
                  <th className="table-header">分派时间</th>
                  <th className="table-header">剩余处理时间</th>
                  <th className="table-header">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint, index) => (
                  <tr
                    key={complaint.id}
                    className={cn(
                      "hover:bg-neutral-50 transition-colors cursor-pointer",
                      index % 2 === 0 && "bg-neutral-50/50",
                      complaint.priority === 'high' && "bg-danger-50/30"
                    )}
                    onClick={() => navigate(`/service/complaints/${complaint.id}`)}
                  >
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium text-primary-600">
                        {complaint.id}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img
                          src={complaint.orderInfo.productImage}
                          alt={complaint.orderInfo.productName}
                          className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 truncate max-w-[200px]">
                            {truncateText(complaint.orderInfo.productName, 20)}
                          </p>
                          <p className="text-xs text-neutral-500">{complaint.orderId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">
                        {COMPLAINT_TYPE_LABELS[complaint.type]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>{complaint.consumerName}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-danger-600">
                        {formatCurrency(complaint.amount)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn("badge", getStatusBadgeClass(complaint.status))}>
                        {COMPLAINT_STATUS_LABELS[complaint.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        "badge",
                        complaint.priority === 'high' ? "badge-danger" :
                        complaint.priority === 'medium' ? "badge-warning" : "badge-neutral"
                      )}>
                        {PRIORITY_LABELS[complaint.priority]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm">
                          {complaint.assignedAt ? formatRelativeTime(complaint.assignedAt) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {renderTimeRemaining(complaint)}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/complaints/${complaint.id}`);
                        }}
                        className="btn btn-ghost gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 空状态 */
        <div className="card p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
            <Inbox className="w-12 h-12 text-neutral-300" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">暂无投诉数据</h3>
          <p className="text-neutral-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? '没有找到符合筛选条件的投诉记录'
              : '您目前还没有负责的投诉案件'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="btn btn-primary"
            >
              重置筛选条件
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
