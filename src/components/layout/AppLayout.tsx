import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const roleHomeRoutes: Record<string, string> = {
  consumer: '/consumer',
  merchant: '/merchant',
  service: '/service',
  arbitrator: '/arbitrator',
  operator: '/operator',
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const role = currentUser?.role;
    if (role && location.pathname === '/') {
      navigate(roleHomeRoutes[role]);
    }
  }, [isAuthenticated, currentUser, location, navigate]);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const getPageTitle = (): string => {
    const path = location.pathname;
    const role = currentUser.role;
    
    const roleTitle = ROLE_LABELS[role] + '工作台';
    
    if (path.match(/\/consumer\/?$/)) return `${roleTitle} · 首页概览`;
    if (path.match(/\/consumer\/complaints\/?$/)) return `${roleTitle} · 我的投诉`;
    if (path.match(/\/consumer\/complaints\/new$/)) return `${roleTitle} · 提交投诉`;
    if (path.match(/\/consumer\/complaints\/[^/]+$/)) return `${roleTitle} · 投诉详情`;
    if (path.match(/\/consumer\/awards\/?$/)) return `${roleTitle} · 裁决书管理`;
    
    if (path.match(/\/merchant\/?$/)) return `${roleTitle} · 首页概览`;
    if (path.match(/\/merchant\/complaints\/?$/)) return `${roleTitle} · 投诉处理`;
    if (path.match(/\/merchant\/complaints\/[^/]+$/)) return `${roleTitle} · 投诉详情与申诉`;
    if (path.match(/\/merchant\/credit\/?$/)) return `${roleTitle} · 信用中心`;
    if (path.match(/\/merchant\/compensations\/?$/)) return `${roleTitle} · 赔付记录`;
    
    if (path.match(/\/service\/?$/)) return `${roleTitle} · 首页概览`;
    if (path.match(/\/service\/pool\/?$/)) return `${roleTitle} · 待分派池`;
    if (path.match(/\/service\/complaints\/?$/)) return `${roleTitle} · 我的投诉`;
    if (path.match(/\/service\/complaints\/[^/]+$/)) return `${roleTitle} · 调解处理`;
    if (path.match(/\/service\/performance\/?$/)) return `${roleTitle} · 绩效统计`;
    
    if (path.match(/\/arbitrator\/?$/)) return `${roleTitle} · 首页概览`;
    if (path.match(/\/arbitrator\/cases\/?$/)) return `${roleTitle} · 仲裁案件池`;
    if (path.match(/\/arbitrator\/cases\/[^/]+$/)) return `${roleTitle} · 裁决工作台`;
    if (path.match(/\/arbitrator\/review\/?$/)) return `${roleTitle} · 再次仲裁复核`;
    
    if (path.match(/\/operator\/?$/)) return `${roleTitle} · 运营概览`;
    if (path.match(/\/operator\/rules\/?$/)) return `${roleTitle} · 规则配置中心`;
    if (path.match(/\/operator\/reports\/?$/)) return `${roleTitle} · 数据报表`;
    
    if (path.match(/\/messages\/?$/)) return '消息通知中心';
    
    return roleTitle;
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const role = currentUser.role;
    const homePath = roleHomeRoutes[role] || '/';
    const crumbs: Array<{ label: string; path?: string }> = [
      { label: ROLE_LABELS[role] + '中心', path: homePath },
    ];

    if (path.includes('/complaints')) {
      if (path.endsWith('/new')) {
        crumbs.push({ label: '我的投诉', path: `${homePath}/complaints` });
        crumbs.push({ label: '提交投诉' });
      } else if (path.match(/\/complaints\/[^/]+$/)) {
        crumbs.push({ label: '我的投诉', path: `${homePath}/complaints` });
        crumbs.push({ label: '投诉详情' });
      } else {
        crumbs.push({ label: '我的投诉' });
      }
    }
    if (path.includes('/awards')) crumbs.push({ label: '裁决书管理' });
    if (path.includes('/credit')) crumbs.push({ label: '信用中心' });
    if (path.includes('/compensations')) crumbs.push({ label: '赔付记录' });
    if (path.includes('/pool')) crumbs.push({ label: '待分派池' });
    if (path.includes('/performance')) crumbs.push({ label: '绩效统计' });
    if (path.includes('/cases')) {
      if (path.match(/\/cases\/[^/]+$/)) {
        crumbs.push({ label: '仲裁案件池', path: `${homePath}/cases` });
        crumbs.push({ label: '裁决详情' });
      } else {
        crumbs.push({ label: '仲裁案件池' });
      }
    }
    if (path.includes('/review')) crumbs.push({ label: '再次仲裁复核' });
    if (path.includes('/rules')) crumbs.push({ label: '规则配置中心' });
    if (path.includes('/reports')) crumbs.push({ label: '数据报表' });
    if (path.includes('/messages')) crumbs.push({ label: '消息通知中心' });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="px-6 py-4 bg-white border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-neutral-300">/</span>}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className={cn(
                      'hover:text-primary-600 transition-colors',
                      index === breadcrumbs.length - 1 && 'text-primary-600 font-medium'
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-primary-600 font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
          <h1 className="font-display text-xl font-bold text-neutral-800">{pageTitle}</h1>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
