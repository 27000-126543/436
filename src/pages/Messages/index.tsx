import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  Scale,
  TrendingUp,
  CreditCard,
  Settings,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import {
  formatDate,
  formatRelativeTime,
  truncateText,
} from '@/utils/format';
import {
  type Message,
  type MessageType,
} from '@/types';
import { cn } from '@/lib/utils';

// 消息分类配置
interface CategoryConfig {
  value: MessageType | 'all';
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  types?: MessageType[];
}

// 消息分类列表
const MESSAGE_CATEGORIES: CategoryConfig[] = [
  {
    value: 'all',
    label: '全部消息',
    icon: <Inbox className="w-5 h-5" />,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    value: 'complaint_assigned',
    label: '投诉分派',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    types: ['complaint_assigned'],
  },
  {
    value: 'arbitration_needed',
    label: '仲裁通知',
    icon: <Scale className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    types: ['arbitration_needed', 'award_published', 'mediation_needed'],
  },
  {
    value: 'credit_changed',
    label: '信用变动',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    types: ['credit_changed'],
  },
  {
    value: 'compensation_done',
    label: '赔付完成',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    types: ['compensation_done'],
  },
  {
    value: 'system',
    label: '系统通知',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
    types: ['system', 'timeout_warning'],
  },
];

// 消息类型标签配置
const MESSAGE_TYPE_LABELS: Record<MessageType, { label: string; color: string }> = {
  complaint_assigned: { label: '投诉分派', color: 'badge-info' },
  mediation_needed: { label: '调解通知', color: 'badge-primary' },
  arbitration_needed: { label: '仲裁通知', color: 'badge-warning' },
  award_published: { label: '裁决发布', color: 'badge-success' },
  credit_changed: { label: '信用变动', color: 'badge-warning' },
  compensation_done: { label: '赔付完成', color: 'badge-success' },
  system: { label: '系统通知', color: 'badge-neutral' },
  timeout_warning: { label: '超时警告', color: 'badge-danger' },
};

// 读取状态筛选
type ReadFilter = 'all' | 'unread' | 'read';

const READ_FILTERS: { value: ReadFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
];

// 每页显示数量
const PAGE_SIZE = 8;

export default function MessagesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { messages, markMessageRead, markAllMessagesRead } = useComplaintStore();

  // 当前用户ID，默认为测试用户
  const recipientId = currentUser?.id || 'consumer_001';

  // 状态管理
  const [activeCategory, setActiveCategory] = useState<MessageType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // 获取当前用户的所有消息
  const userMessages = useMemo(() => {
    return messages
      .filter(m => m.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, recipientId]);

  // 根据分类筛选消息
  const categoryFilteredMessages = useMemo(() => {
    if (activeCategory === 'all') {
      return userMessages;
    }
    const categoryConfig = MESSAGE_CATEGORIES.find(c => c.value === activeCategory);
    if (categoryConfig?.types) {
      return userMessages.filter(m => categoryConfig.types!.includes(m.type));
    }
    return userMessages.filter(m => m.type === activeCategory);
  }, [userMessages, activeCategory]);

  // 根据已读/未读筛选
  const filteredMessages = useMemo(() => {
    if (readFilter === 'all') {
      return categoryFilteredMessages;
    }
    return categoryFilteredMessages.filter(m =>
      readFilter === 'unread' ? !m.isRead : m.isRead
    );
  }, [categoryFilteredMessages, readFilter]);

  // 分页数据
  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE);
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMessages.slice(start, start + PAGE_SIZE);
  }, [filteredMessages, currentPage]);

  // 各分类的未读数量统计
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    MESSAGE_CATEGORIES.forEach(category => {
      if (category.value === 'all') {
        counts[category.value] = userMessages.filter(m => !m.isRead).length;
      } else if (category.types) {
        counts[category.value] = userMessages.filter(
          m => !m.isRead && category.types!.includes(m.type)
        ).length;
      } else {
        counts[category.value] = userMessages.filter(
          m => !m.isRead && m.type === category.value
        ).length;
      }
    });
    return counts;
  }, [userMessages]);

  // 当前分类的未读数量
  const currentUnreadCount = unreadCounts[activeCategory] || 0;

  // 显示提示消息
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // 标记单条消息为已读/未读
  const handleToggleRead = (message: Message) => {
    if (!message.isRead) {
      markMessageRead(message.id);
      showToast('已标记为已读');
    }
  };

  // 一键标记所有为已读
  const handleMarkAllRead = () => {
    markAllMessagesRead(recipientId);
    showToast('所有消息已标记为已读');
  };

  // 点击消息处理
  const handleMessageClick = (message: Message) => {
    // 标记为已读
    if (!message.isRead) {
      markMessageRead(message.id);
    }
    // 切换展开状态
    setExpandedMessage(expandedMessage === message.id ? null : message.id);
  };

  // 跳转到相关页面
  const handleNavigateToRelated = (message: Message) => {
    if (!message.isRead) {
      markMessageRead(message.id);
    }

    let path = '';
    const fromParam = 'from=messages';

    switch (message.type) {
      case 'complaint_assigned':
        if (message.recipientRole === 'service') {
          path = `/service/complaints/${message.relatedId}?${fromParam}`;
        } else if (message.recipientRole === 'merchant') {
          path = `/merchant/complaints/${message.relatedId}?${fromParam}`;
        } else {
          path = `/consumer/complaints/${message.relatedId}?${fromParam}`;
        }
        break;
      case 'mediation_needed':
        path = `/service/complaints/${message.relatedId}?${fromParam}`;
        break;
      case 'arbitration_needed':
        path = `/arbitrator/cases/${message.relatedId}?${fromParam}`;
        break;
      case 'award_published':
        if (message.recipientRole === 'merchant') {
          path = `/merchant/complaints/${message.relatedId}?${fromParam}`;
        } else {
          path = `/consumer/complaints/${message.relatedId}?${fromParam}`;
        }
        break;
      case 'credit_changed':
        path = `/merchant/credit?${fromParam}`;
        break;
      case 'compensation_done':
        path = `/merchant/compensations?complaintId=${message.relatedId}&${fromParam}`;
        break;
      case 'timeout_warning':
        if (message.recipientRole === 'service') {
          path = `/service/complaints?${fromParam}`;
        } else if (message.recipientRole === 'merchant') {
          path = `/merchant/complaints?${fromParam}`;
        } else {
          path = `/arbitrator/cases?${fromParam}`;
        }
        break;
      case 'system':
      default:
        return;
    }

    navigate(path);
  };

  // 获取消息图标
  const getMessageIcon = (type: MessageType) => {
    const category = MESSAGE_CATEGORIES.find(c =>
      c.types ? c.types.includes(type) : c.value === type
    );
    return category?.icon || <Bell className="w-5 h-5" />;
  };

  // 获取消息颜色配置
  const getMessageColor = (type: MessageType) => {
    const category = MESSAGE_CATEGORIES.find(c =>
      c.types ? c.types.includes(type) : c.value === type
    );
    return {
      color: category?.color || 'text-neutral-600',
      bgColor: category?.bgColor || 'bg-neutral-50',
    };
  };

  // 切换分类时重置页码
  const handleCategoryChange = (category: MessageType | 'all') => {
    setActiveCategory(category);
    setCurrentPage(1);
    setExpandedMessage(null);
  };

  // 切换已读筛选时重置页码
  const handleReadFilterChange = (filter: ReadFilter) => {
    setReadFilter(filter);
    setCurrentPage(1);
    setExpandedMessage(null);
  };

  const currentCategoryConfig = MESSAGE_CATEGORIES.find(c => c.value === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
      {/* 左侧边栏 - 消息分类 */}
      <div className="w-full lg:w-60 flex-shrink-0">
        <div className="card p-2 h-full overflow-y-auto">
          {/* 头部 */}
          <div className="px-3 py-2 mb-2">
            <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              消息中心
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {unreadCounts.all > 0 ? (
                <span className="text-danger-600 font-medium">
                  {unreadCounts.all} 条未读消息
                </span>
              ) : (
                '暂无未读消息'
              )}
            </p>
          </div>

          {/* 分类列表 */}
          <div className="space-y-1">
            {MESSAGE_CATEGORIES.map(category => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group',
                  activeCategory === category.value
                    ? 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 shadow-sm'
                    : 'hover:bg-neutral-50 text-neutral-700 hover:translate-x-1'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    activeCategory === category.value
                      ? category.bgColor
                      : 'bg-neutral-100 group-hover:bg-neutral-200'
                  )}
                >
                  <div
                    className={cn(
                      activeCategory === category.value
                        ? category.color
                        : 'text-neutral-500 group-hover:text-neutral-700'
                    )}
                  >
                    {category.icon}
                  </div>
                </div>
                <span className="flex-1 text-sm font-medium">{category.label}</span>
                {unreadCounts[category.value] > 0 && (
                  <span
                    className={cn(
                      'min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full flex items-center justify-center',
                      activeCategory === category.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-danger-500 text-white'
                    )}
                  >
                    {unreadCounts[category.value] > 99
                      ? '99+'
                      : unreadCounts[category.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="card flex flex-col h-full overflow-hidden">
          {/* 顶部操作栏 */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg',
                      currentCategoryConfig?.bgColor || 'bg-primary-50'
                    )}
                  >
                    <div
                      className={cn(
                        currentCategoryConfig?.color || 'text-primary-600'
                      )}
                    >
                      {currentCategoryConfig?.icon || <Bell className="w-5 h-5" />}
                    </div>
                  </div>
                  {currentCategoryConfig?.label || '全部消息'}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                  共 {filteredMessages.length} 条消息
                  {currentUnreadCount > 0 && (
                    <span className="ml-2 text-danger-600">
                      （{currentUnreadCount} 条未读）
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* 已读筛选 */}
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  {READ_FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => handleReadFilterChange(filter.value)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                        readFilter === filter.value
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-800'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* 一键已读 */}
                {currentUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="btn btn-secondary !py-1.5 !px-3 text-xs gap-1.5 hover:bg-primary-50 hover:text-primary-600 transition-all"
                  >
                    <CheckCheck className="w-4 h-4" />
                    全部已读
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto">
            {paginatedMessages.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {paginatedMessages.map(message => {
                  const isExpanded = expandedMessage === message.id;
                  const isUnread = !message.isRead;
                  const typeConfig = MESSAGE_TYPE_LABELS[message.type];
                  const colorConfig = getMessageColor(message.type);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'relative transition-all duration-200 cursor-pointer',
                        isUnread
                          ? 'bg-primary-50/50 hover:bg-primary-50'
                          : 'hover:bg-neutral-50'
                      )}
                      onClick={() => handleMessageClick(message)}
                    >
                      {/* 未读消息左侧蓝色竖条 */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-blue-500 rounded-r" />
                      )}

                      <div className={cn('px-6 py-4', isUnread ? 'pl-7' : '')}>
                        <div className="flex items-start gap-4">
                          {/* 消息图标 */}
                          <div
                            className={cn(
                              'p-2.5 rounded-xl flex-shrink-0 transition-all duration-200',
                              colorConfig.bgColor,
                              isExpanded && 'scale-110 shadow-md'
                            )}
                          >
                            <div className={colorConfig.color}>
                              {getMessageIcon(message.type)}
                            </div>
                          </div>

                          {/* 消息内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {/* 类型标签 */}
                                  <span className={cn('badge', typeConfig.color)}>
                                    {typeConfig.label}
                                  </span>
                                  {/* 未读标记 */}
                                  {isUnread && (
                                    <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                                      <Circle className="w-2 h-2 fill-primary-600" />
                                      新消息
                                    </span>
                                  )}
                                </div>
                                <h3
                                  className={cn(
                                    'text-sm line-clamp-1',
                                    isUnread
                                      ? 'font-semibold text-neutral-800'
                                      : 'font-medium text-neutral-700'
                                  )}
                                >
                                  {message.title}
                                </h3>
                                <p
                                  className={cn(
                                    'text-sm text-neutral-500 mt-1.5 transition-all duration-300',
                                    isExpanded ? 'line-clamp-none' : 'line-clamp-2'
                                  )}
                                >
                                  {message.content}
                                </p>
                              </div>

                              {/* 右侧操作 */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {/* 时间 */}
                                <div className="flex items-center gap-1 text-xs text-neutral-400">
                                  <Clock className="w-3 h-3" />
                                  <span title={formatDate(message.createdAt, 'full')}>
                                    {formatRelativeTime(message.createdAt)}
                                  </span>
                                </div>

                                {/* 操作按钮 */}
                                <div
                                  className="flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleToggleRead(message)}
                                    className={cn(
                                      'p-1.5 rounded-lg transition-all',
                                      isUnread
                                        ? 'hover:bg-primary-100 text-primary-500'
                                        : 'hover:bg-neutral-200 text-neutral-400'
                                    )}
                                    title={isUnread ? '标记为已读' : '标记为未读'}
                                  >
                                    {isUnread ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>
                                  {message.type !== 'system' && (
                                    <button
                                      onClick={() => handleNavigateToRelated(message)}
                                      className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-500 transition-all"
                                      title="查看详情"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 展开的详情 */}
                            {isExpanded && (
                              <div className="mt-4 p-4 bg-white rounded-xl border border-neutral-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs text-neutral-500 mb-1">
                                      消息标题
                                    </p>
                                    <p className="text-sm font-medium text-neutral-800">
                                      {message.title}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-neutral-500 mb-1">
                                      详细内容
                                    </p>
                                    <p className="text-sm text-neutral-700 leading-relaxed">
                                      {message.content}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                                    <div>
                                      <p className="text-xs text-neutral-500 mb-1">
                                        消息类型
                                      </p>
                                      <span className={cn('badge', typeConfig.color)}>
                                        {typeConfig.label}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-xs text-neutral-500 mb-1">
                                        接收时间
                                      </p>
                                      <p className="text-sm text-neutral-700">
                                        {formatDate(message.createdAt, 'full')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setExpandedMessage(null);
                                      }}
                                      className="btn btn-secondary !py-1.5 !px-3 text-xs"
                                    >
                                      收起
                                    </button>
                                    {message.type !== 'system' && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleNavigateToRelated(message);
                                        }}
                                        className="btn btn-primary !py-1.5 !px-3 text-xs gap-1"
                                      >
                                        前往查看
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 空状态 */
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  {readFilter === 'unread' ? (
                    <CheckCircle className="w-12 h-12 text-success-400" />
                  ) : (
                    <Inbox className="w-12 h-12 text-neutral-300" />
                  )}
                </div>
                {readFilter === 'unread' ? (
                  <>
                    <p className="text-neutral-600 mb-1 font-medium">
                      没有未读消息
                    </p>
                    <p className="text-sm text-neutral-500">
                      您已阅读所有{currentCategoryConfig?.label || '消息'}
                    </p>
                  </>
                ) : activeCategory !== 'all' ? (
                  <>
                    <p className="text-neutral-600 mb-1 font-medium">
                      暂无{currentCategoryConfig?.label}
                    </p>
                    <p className="text-sm text-neutral-500">
                      相关消息将在此处展示
                    </p>
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="mt-4 btn btn-secondary gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      查看全部消息
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-neutral-600 mb-1 font-medium">
                      暂无消息
                    </p>
                    <p className="text-sm text-neutral-500">
                      您还没有收到任何消息通知
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-neutral-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-neutral-500">
                  第 {currentPage} / {totalPages} 页，共 {filteredMessages.length} 条消息
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
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="flex items-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-xl shadow-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
