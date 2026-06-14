import type { ComponentType, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Scale,
  Users,
  BarChart3,
  Settings,
  ShieldAlert,
  Gavel,
  MessageSquare,
  Award,
  CreditCard,
  FileBadge,
  ClipboardList,
  BellRing,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS, type UserRole } from '@/types';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

interface MenuItem {
  path: string;
  label: string;
  icon: IconComponent;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const roleMenus: Record<UserRole, MenuGroup[]> = {
  consumer: [
    {
      label: '主要功能',
      items: [
        { path: '/', label: '首页概览', icon: Home },
        { path: '/complaints', label: '我的投诉', icon: FileText },
        { path: '/complaints/new', label: '发起投诉', icon: ShieldAlert },
      ],
    },
    {
      label: '查询中心',
      items: [
        { path: '/arbitration', label: '仲裁查询', icon: Gavel },
        { path: '/compensation', label: '赔付记录', icon: CreditCard },
        { path: '/messages', label: '消息通知', icon: MessageSquare },
      ],
    },
    {
      label: '服务支持',
      items: [
        { path: '/rules', label: '平台规则', icon: FileBadge },
        { path: '/settings', label: '账户设置', icon: Settings },
      ],
    },
  ],
  merchant: [
    {
      label: '主要功能',
      items: [
        { path: '/', label: '首页概览', icon: Home },
        { path: '/complaints', label: '投诉处理', icon: ClipboardList },
        { path: '/arbitration', label: '仲裁案件', icon: Gavel },
      ],
    },
    {
      label: '店铺管理',
      items: [
        { path: '/credit', label: '信用评级', icon: Award },
        { path: '/compensation', label: '赔付记录', icon: CreditCard },
        { path: '/messages', label: '消息通知', icon: BellRing },
      ],
    },
    {
      label: '服务支持',
      items: [
        { path: '/rules', label: '平台规则', icon: FileBadge },
        { path: '/settings', label: '店铺设置', icon: Settings },
      ],
    },
  ],
  service: [
    {
      label: '工作台',
      items: [
        { path: '/', label: '首页概览', icon: Home },
        { path: '/assignments', label: '待分派', icon: Users },
        { path: '/complaints', label: '调解案件', icon: ClipboardList },
      ],
    },
    {
      label: '案件管理',
      items: [
        { path: '/mediation', label: '调解记录', icon: MessageSquare },
        { path: '/arbitration', label: '仲裁移交', icon: Gavel },
        { path: '/statistics', label: '业绩统计', icon: BarChart3 },
      ],
    },
    {
      label: '系统',
      items: [
        { path: '/messages', label: '系统消息', icon: BellRing },
        { path: '/settings', label: '个人设置', icon: Settings },
      ],
    },
  ],
  arbitrator: [
    {
      label: '工作台',
      items: [
        { path: '/', label: '首页概览', icon: Home },
        { path: '/arbitration', label: '待审案件', icon: Scale },
        { path: '/awards', label: '裁决记录', icon: FileText },
      ],
    },
    {
      label: '案件管理',
      items: [
        { path: '/evidence', label: '证据审阅', icon: FileBadge },
        { path: '/hearings', label: '听证安排', icon: Users },
        { path: '/statistics', label: '审理统计', icon: BarChart3 },
      ],
    },
    {
      label: '系统',
      items: [
        { path: '/messages', label: '系统消息', icon: BellRing },
        { path: '/settings', label: '个人设置', icon: Settings },
      ],
    },
  ],
  operator: [
    {
      label: '运营中心',
      items: [
        { path: '/', label: '运营概览', icon: Home },
        { path: '/complaints', label: '投诉总览', icon: ClipboardList },
        { path: '/arbitration', label: '仲裁管理', icon: Scale },
      ],
    },
    {
      label: '平台管理',
      items: [
        { path: '/users', label: '用户管理', icon: Users },
        { path: '/credit', label: '信用体系', icon: Award },
        { path: '/rules', label: '规则配置', icon: FileBadge },
        { path: '/reports', label: '数据报表', icon: BarChart3 },
      ],
    },
    {
      label: '系统',
      items: [
        { path: '/messages', label: '消息中心', icon: BellRing },
        { path: '/settings', label: '系统设置', icon: Settings },
      ],
    },
  ],
};

export default function Sidebar() {
  const { currentUser } = useAuthStore();
  const role = currentUser?.role ?? 'consumer';
  const menus = roleMenus[role];

  return (
    <aside className="w-64 h-screen bg-neutral-800 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-white text-base font-semibold leading-tight">
              消费者保障中心
            </h1>
            <p className="text-neutral-400 text-xs leading-tight mt-0.5">
              Consumer Protection
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-neutral-700">
        <div className="flex items-center gap-3 px-2">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.realName}
            className="w-10 h-10 rounded-full border-2 border-neutral-600 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">
              {currentUser?.realName}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-500/20 text-primary-300 mt-0.5">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menus.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white',
                        ].join(' ')
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-neutral-700">
        <div className="rounded-lg bg-neutral-700/50 p-3">
          <p className="text-neutral-400 text-xs mb-1">系统版本</p>
          <p className="text-white text-sm font-medium">v2.1.0</p>
        </div>
      </div>
    </aside>
  );
}
