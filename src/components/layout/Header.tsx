import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Mail,
  MessageCircle,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { ROLE_LABELS } from '@/types';
import { formatRelativeTime } from '@/utils/format';

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, logout, switchRole } = useAuthStore();
  const { messages, getUnreadCount, markMessageRead, markAllMessagesRead } =
    useComplaintStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleSwitchRef = useRef<HTMLDivElement>(null);

  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;
  const userMessages = currentUser
    ? messages
        .filter((m) => m.recipientId === currentUser.id)
        .slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        roleSwitchRef.current &&
        !roleSwitchRef.current.contains(e.target as Node)
      ) {
        setShowRoleSwitch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const handleSwitchRole = (role: 'consumer' | 'merchant' | 'service' | 'arbitrator' | 'operator') => {
    switchRole(role);
    setShowRoleSwitch(false);
  };

  const handleMarkAllRead = () => {
    if (currentUser) {
      markAllMessagesRead(currentUser.id);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'complaint_assigned':
      case 'mediation_needed':
      case 'arbitration_needed':
        return MessageCircle;
      case 'award_published':
      case 'compensation_done':
        return CreditCard;
      case 'credit_changed':
        return User;
      case 'timeout_warning':
        return Bell;
      default:
        return Mail;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-6 gap-6 flex-shrink-0 sticky top-0 z-40">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索投诉编号、订单号、案件..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent focus:bg-white transition-all placeholder:text-neutral-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 rounded">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-2">
        <div ref={roleSwitchRef} className="relative">
          <button
            onClick={() => {
              setShowRoleSwitch(!showRoleSwitch);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <span>切换角色</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showRoleSwitch ? 'rotate-180' : ''}`}
            />
          </button>

          {showRoleSwitch && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-elevation-2 overflow-hidden animate-fade-in z-50">
              <div className="py-1">
                {(['consumer', 'merchant', 'service', 'arbitrator', 'operator'] as const).map(
                  (role) => (
                    <button
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        currentUser?.role === role
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                      {currentUser?.role === role && (
                        <span className="ml-2 text-xs text-primary-500">当前</span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={notificationRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              setShowRoleSwitch(false);
            }}
            className="relative p-2 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-danger-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-neutral-200 rounded-xl shadow-elevation-3 overflow-hidden animate-fade-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-display font-semibold text-neutral-800 text-sm">
                  消息通知
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    全部已读
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {userMessages.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm text-neutral-500">暂无消息</p>
                  </div>
                ) : (
                  <ul>
                    {userMessages.map((msg) => {
                      const Icon = getMessageIcon(msg.type);
                      return (
                        <li
                          key={msg.id}
                          onClick={() => {
                            if (!msg.isRead) markMessageRead(msg.id);
                            setShowNotifications(false);
                          }}
                          className={`px-4 py-3 border-b border-neutral-50 cursor-pointer transition-colors last:border-0 ${
                            msg.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-primary-50/30 hover:bg-primary-50/50'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                msg.isRead
                                  ? 'bg-neutral-100 text-neutral-500'
                                  : 'bg-primary-100 text-primary-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`text-sm truncate ${
                                    msg.isRead ? 'text-neutral-700' : 'font-medium text-neutral-900'
                                  }`}
                                >
                                  {msg.title}
                                </p>
                                {!msg.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                                {msg.content}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {formatRelativeTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  onClick={() => {
                    navigate('/messages');
                    setShowNotifications(false);
                  }}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  查看全部消息
                </button>
              </div>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative ml-2">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowRoleSwitch(false);
            }}
            className="flex items-center gap-2.5 p-1 pr-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <img
              src={currentUser?.avatar}
              alt={currentUser?.realName}
              className="w-8 h-8 rounded-full object-cover border-2 border-neutral-200"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-neutral-800 leading-tight">
                {currentUser?.realName}
              </p>
              <p className="text-xs text-neutral-500 leading-tight">
                {ROLE_LABELS[currentUser?.role ?? 'consumer']}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-neutral-500 transition-transform hidden sm:block ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-elevation-3 overflow-hidden animate-fade-in z-50">
              <div className="px-4 py-4 border-b border-neutral-100 bg-gradient-to-br from-primary-50 to-white">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.realName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-800 truncate">
                      {currentUser?.realName}
                    </p>
                    <p className="text-sm text-neutral-500 truncate">
                      {currentUser?.email}
                    </p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {ROLE_LABELS[currentUser?.role ?? 'consumer']}
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <User className="w-4 h-4 text-neutral-500" />
                  <span>个人中心</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  <span>账户设置</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/help');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-neutral-500" />
                  <span>帮助中心</span>
                </button>
              </div>

              <div className="border-t border-neutral-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
