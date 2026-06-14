import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Eye,
  Download,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Scale,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  formatCurrency,
  formatDate,
  truncateText,
} from '@/utils/format';
import {
  COMPLAINT_TYPE_LABELS,
  type Complaint,
} from '@/types';
import { cn } from '@/lib/utils';

// 筛选类型
type FilterType = 'all' | 'canReArbitrate' | 'final';

// 筛选选项
const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'canReArbitrate', label: '可申请再次仲裁' },
  { value: 'final', label: '已终裁' },
];

// 每页显示数量
const PAGE_SIZE = 5;

export default function AwardList() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getConsumerComplaints, requestReArbitration } = useComplaintStore();

  // 当前消费者ID，默认为测试用户
  const consumerId = currentUser?.id || 'consumer_001';

  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedAward, setSelectedAward] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 获取消费者所有已裁决的投诉
  const awardedComplaints = useMemo(() => {
    const complaints = getConsumerComplaints(consumerId);
    return complaints.filter(c => c.status === 'awarded' && c.award);
  }, [consumerId, getConsumerComplaints]);

  // 筛选后的裁决列表
  const filteredAwards = useMemo(() => {
    let result = [...awardedComplaints];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(query) ||
          c.orderInfo.productName.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    // 类型过滤
    if (filterType === 'canReArbitrate') {
      result = result.filter(c => !c.finalAward && !c.award?.isFinal);
    } else if (filterType === 'final') {
      result = result.filter(c => c.finalAward || c.award?.isFinal);
    }

    // 按裁决时间倒序排列
    return result.sort((a, b) => {
      const dateA = a.award?.createdAt ? new Date(a.award.createdAt).getTime() : 0;
      const dateB = b.award?.createdAt ? new Date(b.award.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [awardedComplaints, searchQuery, filterType]);

  // 分页数据
  const totalPages = Math.ceil(filteredAwards.length / PAGE_SIZE);
  const paginatedAwards = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAwards.slice(start, start + PAGE_SIZE);
  }, [filteredAwards, currentPage]);

  // 各筛选分类的数量统计
  const filterCounts = useMemo(() => ({
    all: awardedComplaints.length,
    canReArbitrate: awardedComplaints.filter(c => !c.finalAward && !c.award?.isFinal).length,
    final: awardedComplaints.filter(c => c.finalAward || c.award?.isFinal).length,
  }), [awardedComplaints]);

  // 显示提示消息
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // 预览裁决书
  const handlePreview = (complaint: Complaint) => {
    setSelectedAward(complaint);
    setShowModal(true);
  };

  // 下载裁决书
  const handleDownload = (complaint: Complaint) => {
    showToast(`裁决书 ${complaint.id} 下载成功！`);
  };

  // 申请再次仲裁
  const handleReArbitration = (complaint: Complaint) => {
    const result = requestReArbitration(complaint.id, consumerId, currentUser?.realName || '消费者');
    if (result) {
      showToast('再次仲裁申请已提交，将由资深仲裁员进行终局裁决。');
      setCurrentPage(1);
    } else {
      showToast('申请失败，该裁决已为终裁。', 'error');
    }
  };

  // 清除筛选条件
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setCurrentPage(1);
  };

  // 是否有激活的筛选条件
  const hasActiveFilters = filterType !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">裁决书管理</h1>
          <p className="text-sm text-neutral-500 mt-1">
            共 {filteredAwards.length} 份裁决书记录
          </p>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索投诉标题、商品名称、投诉编号..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'btn gap-2',
              filterType !== 'all' ? 'btn-secondary' : 'btn-primary'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-white/20 text-white text-xs rounded-full flex items-center justify-center">
                {(filterType !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* 筛选选项 */}
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-2 block">
            裁决状态
          </label>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setFilterType(option.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  'btn !py-1.5 !px-3 text-xs transition-all duration-200',
                  filterType === option.value
                    ? 'btn-primary shadow-md'
                    : 'btn-secondary hover:bg-primary-50'
                )}
              >
                {option.label}
                <span
                  className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                    filterType === option.value
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {filterCounts[option.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2 border-t border-neutral-100">
            <button
              onClick={clearFilters}
              className="text-sm text-neutral-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选条件
            </button>
          </div>
        )}
      </div>

      {/* 裁决列表 */}
      <div className="card overflow-hidden">
        {paginatedAwards.length > 0 ? (
          <>
            {/* 桌面端表格视图 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-50 to-blue-50">
                    <th className="table-header text-left">投诉信息</th>
                    <th className="table-header text-left">商品名称</th>
                    <th className="table-header text-left">裁决时间</th>
                    <th className="table-header text-left">裁决结果</th>
                    <th className="table-header text-left">赔付金额</th>
                    <th className="table-header text-left">仲裁员</th>
                    <th className="table-header text-left">状态</th>
                    <th className="table-header text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAwards.map(complaint => (
                    <tr
                      key={complaint.id}
                      className="hover:bg-primary-50/50 transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
                    >
                      <td className="table-cell">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 text-sm line-clamp-1">
                            {truncateText(complaint.title, 18)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            <span className="badge badge-primary !text-xs !py-0 mr-2">
                              {COMPLAINT_TYPE_LABELS[complaint.type]}
                            </span>
                            {complaint.id}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <img
                            src={complaint.orderInfo.productImage}
                            alt={complaint.orderInfo.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                          />
                          <span className="text-sm text-neutral-700 line-clamp-1">
                            {truncateText(complaint.orderInfo.productName, 15)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Calendar className="w-4 h-4 text-primary-500" />
                          {formatDate(complaint.award?.createdAt || '', 'date')}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          {complaint.award?.liability === 'merchant' ? (
                            <CheckCircle className="w-4 h-4 text-success-500" />
                          ) : complaint.award?.liability === 'consumer' ? (
                            <AlertCircle className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <Scale className="w-4 h-4 text-warning-500" />
                          )}
                          <span className="text-sm text-neutral-700">
                            {complaint.award?.liability === 'merchant'
                              ? '商家全责'
                              : complaint.award?.liability === 'consumer'
                              ? '消费者责任'
                              : '双方责任'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-success-500" />
                          <span className="text-sm font-semibold text-success-600">
                            {formatCurrency(complaint.award?.compensationAmount || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <User className="w-4 h-4 text-primary-500" />
                          {complaint.award?.arbitratorName || '-'}
                        </div>
                      </td>
                      <td className="table-cell">
                        {complaint.finalAward || complaint.award?.isFinal ? (
                          <span className="badge badge-success">
                            已终裁
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            已裁决
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePreview(complaint)}
                            className="btn btn-ghost text-primary-600 hover:text-primary-700 hover:bg-primary-50 !p-2 transition-all"
                            title="预览裁决书"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(complaint)}
                            className="btn btn-ghost text-success-600 hover:text-success-700 hover:bg-success-50 !p-2 transition-all"
                            title="下载裁决书"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!complaint.finalAward && !complaint.award?.isFinal && (
                            <button
                              onClick={() => handleReArbitration(complaint)}
                              className="btn btn-ghost text-warning-600 hover:text-warning-700 hover:bg-warning-50 !p-2 transition-all"
                              title="申请再次仲裁"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片视图 */}
            <div className="md:hidden space-y-3 p-4">
              {paginatedAwards.map(complaint => (
                <div
                  key={complaint.id}
                  className="card card-hover p-4 transition-all duration-300"
                >
                  {/* 头部：标题和状态 */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-800 text-sm line-clamp-2">
                        {complaint.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        {complaint.id}
                      </p>
                    </div>
                    {complaint.finalAward || complaint.award?.isFinal ? (
                      <span className="badge badge-success flex-shrink-0">
                        已终裁
                      </span>
                    ) : (
                      <span className="badge badge-warning flex-shrink-0">
                        已裁决
                      </span>
                    )}
                  </div>

                  {/* 商品信息 */}
                  <div className="flex items-center gap-3 mb-3 p-3 bg-neutral-50 rounded-lg">
                    <img
                      src={complaint.orderInfo.productImage}
                      alt={complaint.orderInfo.productName}
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 line-clamp-1">
                        {complaint.orderInfo.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-primary !text-xs !py-0">
                          {COMPLAINT_TYPE_LABELS[complaint.type]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 裁决详情 */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="text-neutral-600">
                        {formatDate(complaint.award?.createdAt || '', 'date')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="text-neutral-600">
                        {complaint.award?.arbitratorName || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="text-neutral-600">
                        {complaint.award?.liability === 'merchant'
                          ? '商家全责'
                          : complaint.award?.liability === 'consumer'
                          ? '消费者责任'
                          : '双方责任'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-success-500 flex-shrink-0" />
                      <span className="font-semibold text-success-600">
                        {formatCurrency(complaint.award?.compensationAmount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => handlePreview(complaint)}
                      className="btn btn-secondary !py-1.5 !px-3 text-xs gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      预览
                    </button>
                    <button
                      onClick={() => handleDownload(complaint)}
                      className="btn btn-secondary !py-1.5 !px-3 text-xs gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    {!complaint.finalAward && !complaint.award?.isFinal && (
                      <button
                        onClick={() => handleReArbitration(complaint)}
                        className="btn btn-primary !py-1.5 !px-3 text-xs gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        再次仲裁
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* 空状态 */
          <div className="p-12 text-center">
            <FileText className="w-20 h-20 text-neutral-200 mx-auto mb-4" />
            {hasActiveFilters ? (
              <>
                <p className="text-neutral-600 mb-1 font-medium">没有找到匹配的裁决书</p>
                <p className="text-sm text-neutral-500 mb-4">
                  尝试调整筛选条件或清除筛选
                </p>
                <button onClick={clearFilters} className="btn btn-secondary gap-2">
                  <X className="w-4 h-4" />
                  清除筛选条件
                </button>
              </>
            ) : (
              <>
                <p className="text-neutral-600 mb-1 font-medium">暂无裁决书记录</p>
                <p className="text-sm text-neutral-500 mb-4">
                  您的投诉仲裁完成后，裁决书将在此处展示
                </p>
                <button
                  onClick={() => navigate('/consumer/complaints')}
                  className="btn btn-primary gap-2"
                >
                  <FileText className="w-4 h-4" />
                  查看我的投诉
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            第 {currentPage} / {totalPages} 页，共 {filteredAwards.length} 条记录
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'btn !w-9 !h-9 !p-0 text-sm transition-all duration-200',
                    currentPage === page
                      ? 'btn-primary shadow-md'
                      : 'btn-secondary hover:bg-primary-50 hover:text-primary-600'
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 裁决书预览 Modal */}
      {showModal && selectedAward?.award && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          />
          {/* Modal 内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Modal 头部 */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">仲裁裁决书</h3>
                  <p className="text-xs text-white/80">{selectedAward.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* 裁决书头部 */}
              <div className="text-center mb-6 pb-6 border-b border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-800 mb-2">电商平台争议仲裁裁决书</h2>
                <p className="text-sm text-neutral-500">
                  裁决编号：{selectedAward.award.id}
                </p>
              </div>

              {/* 当事方信息 */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <h4 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-500" />
                    申请人（消费者）
                  </h4>
                  <p className="text-sm text-neutral-600">
                    姓名：{selectedAward.consumerName}
                  </p>
                  <p className="text-sm text-neutral-600">
                    投诉编号：{selectedAward.id}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <h4 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-warning-500" />
                    被申请人（商家）
                  </h4>
                  <p className="text-sm text-neutral-600">
                    店铺名称：{selectedAward.orderInfo.merchantName}
                  </p>
                  <p className="text-sm text-neutral-600">
                    商家ID：{selectedAward.orderInfo.merchantId}
                  </p>
                </div>
              </div>

              {/* 案件信息 */}
              <div className="mb-6">
                <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  案件基本信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">投诉类型：</span>
                    <span className="text-neutral-800">
                      {COMPLAINT_TYPE_LABELS[selectedAward.type]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">涉及金额：</span>
                    <span className="text-neutral-800 font-medium">
                      {formatCurrency(selectedAward.amount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">商品名称：</span>
                    <span className="text-neutral-800 line-clamp-1">
                      {selectedAward.orderInfo.productName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">订单编号：</span>
                    <span className="text-neutral-800">{selectedAward.orderId}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">投诉时间：</span>
                    <span className="text-neutral-800">
                      {formatDate(selectedAward.createdAt, 'full')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-neutral-500 flex-shrink-0">裁决时间：</span>
                    <span className="text-neutral-800">
                      {formatDate(selectedAward.award.createdAt, 'full')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 仲裁请求 */}
              <div className="mb-6">
                <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning-500" />
                  仲裁请求
                </h4>
                <div className="p-4 bg-primary-50 rounded-xl text-sm text-neutral-700 leading-relaxed">
                  {selectedAward.description}
                </div>
              </div>

              {/* 裁决内容 */}
              <div className="mb-6">
                <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary-500" />
                  裁决内容
                </h4>
                <div className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl text-sm text-neutral-700 leading-relaxed border border-primary-100">
                  {selectedAward.award.content}
                </div>
              </div>

              {/* 裁决结果 */}
              <div className="mb-6">
                <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  裁决结果
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xs text-neutral-500 mb-1">责任认定</p>
                    <p className="text-base font-semibold text-neutral-800">
                      {selectedAward.award.liability === 'merchant'
                        ? '商家全责'
                        : selectedAward.award.liability === 'consumer'
                        ? '消费者责任'
                        : '双方责任'}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xs text-neutral-500 mb-1">商家责任比例</p>
                    <p className="text-base font-semibold text-neutral-800">
                      {selectedAward.award.merchantLiabilityPercent}%
                    </p>
                  </div>
                  <div className="p-4 bg-success-50 rounded-xl text-center">
                    <p className="text-xs text-neutral-500 mb-1">赔付金额</p>
                    <p className="text-base font-semibold text-success-600">
                      {formatCurrency(selectedAward.award.compensationAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 仲裁员信息 */}
              <div className="p-4 bg-neutral-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">
                      {selectedAward.award.arbitratorName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      仲裁员 · {selectedAward.award.arbitratorId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">裁决日期</p>
                  <p className="text-sm font-medium text-neutral-800">
                    {formatDate(selectedAward.award.createdAt, 'date')}
                  </p>
                </div>
              </div>

              {/* 终裁标记 */}
              {(selectedAward.finalAward || selectedAward.award.isFinal) && (
                <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-success-700">
                    本裁决为终局裁决，一经作出即发生法律效力
                  </p>
                </div>
              )}
            </div>

            {/* Modal 底部 */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                * 本裁决书具有法律效力，请妥善保管
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleDownload(selectedAward);
                    setShowModal(false);
                  }}
                  className="btn btn-secondary gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载裁决书
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-primary gap-2"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg',
              toast.type === 'success'
                ? 'bg-success-500 text-white'
                : 'bg-danger-500 text-white'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
