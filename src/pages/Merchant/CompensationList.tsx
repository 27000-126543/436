import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Wallet,
  Download,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { formatCurrency, formatDate } from '@/utils/format';

export default function MerchantCompensationList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getMerchantComplaints, compensations } = useComplaintStore();

  const merchantId = currentUser?.id ?? 'merchant_001';
  const merchantName = currentUser?.merchantName ?? '优品数码旗舰店';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const merchantComplaints = useMemo(
    () => getMerchantComplaints(merchantId),
    [getMerchantComplaints, merchantId]
  );

  const merchantCompensations = useMemo(() => {
    return compensations
      .filter((c) => merchantComplaints.find((mc) => mc.id === c.complaintId))
      .map((c) => {
        const complaint = merchantComplaints.find((mc) => mc.id === c.complaintId);
        return {
          ...c,
          complaint,
          productName: complaint?.orderInfo.productName ?? '',
          productImage: complaint?.orderInfo.productImage ?? '',
          consumerName: complaint?.consumerName ?? '',
        };
      });
  }, [compensations, merchantComplaints]);

  const filteredCompensations = useMemo(() => {
    return merchantCompensations.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !c.id.toLowerCase().includes(term) &&
          !c.complaintId.toLowerCase().includes(term) &&
          !c.productName.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [merchantCompensations, statusFilter, searchTerm]);

  const totalPending = merchantCompensations
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = merchantCompensations
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalFailed = merchantCompensations
    .filter((c) => c.status === 'failed')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalAmount = merchantCompensations.reduce((sum, c) => sum + c.amount, 0);

  const getStatusBadge = (status: 'pending' | 'paid' | 'failed') => {
    const map = {
      pending: { class: 'badge-warning', label: '待打款', icon: Clock },
      paid: { class: 'badge-success', label: '已完成', icon: CheckCircle2 },
      failed: { class: 'badge-danger', label: '打款失败', icon: XCircle },
    };
    const info = map[status];
    const Icon = info.icon;
    return (
      <span className={`badge ${info.class} inline-flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {info.label}
      </span>
    );
  };

  const handleDownload = (id: string) => {
    alert(`模拟下载赔付凭证：${id}.pdf`);
  };

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待打款' },
    { value: 'paid', label: '已完成' },
    { value: 'failed', label: '打款失败' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">赔付记录</h1>
          <p className="text-neutral-500 mt-1">{merchantName} · 共 {filteredCompensations.length} 条赔付记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-500" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-4">累计赔付总额</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-neutral-400 mt-2">共 {merchantCompensations.length} 笔</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-lg bg-warning-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-500" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-4">待打款金额</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-neutral-400 mt-2">
            {merchantCompensations.filter((c) => c.status === 'pending').length} 笔待处理
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-lg bg-success-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-success-500" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-4">已完成赔付</p>
          <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-neutral-400 mt-2">
            {merchantCompensations.filter((c) => c.status === 'paid').length} 笔已完成
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-lg bg-danger-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger-500" />
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-4">打款失败</p>
          <p className="text-2xl font-bold text-danger-600 mt-1">{formatCurrency(totalFailed)}</p>
          <p className="text-xs text-neutral-400 mt-2">
            {merchantCompensations.filter((c) => c.status === 'failed').length} 笔需处理
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索赔付单号、关联投诉、商品名称..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pr-10 appearance-none min-w-36"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="btn btn-ghost inline-flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-44">赔付单号</th>
                <th className="table-header min-w-56">关联订单/商品</th>
                <th className="table-header w-28">关联投诉</th>
                <th className="table-header w-28">消费者</th>
                <th className="table-header w-32 text-right">赔付金额</th>
                <th className="table-header w-28">状态</th>
                <th className="table-header w-36">创建时间</th>
                <th className="table-header w-36">打款时间</th>
                <th className="table-header w-28 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompensations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-neutral-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>暂无符合条件的赔付记录</p>
                  </td>
                </tr>
              ) : (
                filteredCompensations.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium text-primary-600">
                        {c.id}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.productImage}
                          alt={c.productName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate max-w-48">
                            {c.productName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => navigate(`/merchant/complaints/${c.complaintId}`)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-mono"
                      >
                        {c.complaintId.slice(0, 8)}...
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-neutral-700">{c.consumerName}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="text-lg font-bold text-danger-600">
                        {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="table-cell">{getStatusBadge(c.status)}</td>
                    <td className="table-cell">
                      <div>
                        <p className="text-sm text-neutral-700">{formatDate(c.createdAt, 'date')}</p>
                        <p className="text-xs text-neutral-400">{formatDate(c.createdAt, 'time')}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      {c.paidAt ? (
                        <div>
                          <p className="text-sm text-neutral-700">{formatDate(c.paidAt, 'date')}</p>
                          <p className="text-xs text-neutral-400">{formatDate(c.paidAt, 'time')}</p>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/merchant/complaints/${c.complaintId}`)}
                          className="btn btn-ghost btn-xs gap-1 text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink size={12} />
                          查看投诉
                        </button>
                        {c.voucherUrl || c.status === 'paid' ? (
                          <button
                            onClick={() => handleDownload(c.id)}
                            className="btn btn-ghost !px-2 !py-1 inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                            title="下载赔付凭证"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : c.status === 'failed' ? (
                          <button
                            className="btn btn-primary !px-3 !py-1 text-xs"
                            title="联系客服重新打款"
                          >
                            重新打款
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-xs">处理中</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
