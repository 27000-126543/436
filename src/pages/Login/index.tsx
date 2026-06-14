import { useState, type ComponentType, type SVGProps } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Gavel,
  UserCog,
  Users,
  Building2,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS, type UserRole } from '@/types';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

const roleOptions: {
  value: UserRole;
  label: string;
  icon: IconComponent;
  description: string;
}[] = [
  {
    value: 'consumer',
    label: ROLE_LABELS.consumer,
    icon: ShieldCheck,
    description: '投诉维权、查询进度',
  },
  {
    value: 'merchant',
    label: ROLE_LABELS.merchant,
    icon: Building2,
    description: '处理投诉、店铺管理',
  },
  {
    value: 'service',
    label: ROLE_LABELS.service,
    icon: UserCog,
    description: '调解案件、客户服务',
  },
  {
    value: 'arbitrator',
    label: ROLE_LABELS.arbitrator,
    icon: Gavel,
    description: '案件审理、仲裁裁决',
  },
  {
    value: 'operator',
    label: ROLE_LABELS.operator,
    icon: Users,
    description: '平台运营、系统管理',
  },
];

const placeholderAccounts: Record<UserRole, string> = {
  consumer: 'consumer01',
  merchant: 'merchant01',
  service: 'service01',
  arbitrator: 'arbitrator01',
  operator: 'operator01',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, users } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('consumer');
  const [username, setUsername] = useState('consumer01');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: Location })?.from || { pathname: '/' };
    return <Navigate to={from.pathname} replace />;
  }

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setUsername(placeholderAccounts[role]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (!username.trim()) {
        setError('请输入账号');
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError('请输入密码');
        setLoading(false);
        return;
      }

      const success = login(username.trim(), selectedRole);

      if (success) {
        const from = (location.state as { from?: Location })?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        const matchedUser = users.find(
          (u) => u.username === username.trim() && u.role === selectedRole
        );
        if (!matchedUser) {
          setError(`当前角色下未找到该账号，请确认账号或选择正确的角色`);
        } else {
          setError('登录失败，请检查账号密码');
        }
      }
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(placeholderAccounts[role], role);
      if (success) {
        const from = (location.state as { from?: Location })?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('快速登录失败');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, #0a1524 0%, #152a47 25%, #1e3a5f 50%, #1a3354 75%, #0f1f36 100%)
          `,
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-300/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary-400/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary-400/5" />
      </div>

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/50">
          <div className="lg:col-span-2 hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary-800/60 via-primary-700/40 to-primary-900/60 backdrop-blur-sm border-r border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-white text-xl font-bold">消费者保障中心</h2>
                  <p className="text-primary-200/70 text-xs mt-0.5">Consumer Protection Platform</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-display text-white text-2xl font-bold leading-snug">
                  公正、透明、高效的
                  <br />
                  <span className="text-primary-300">争议仲裁体系</span>
                </h3>
                <p className="text-primary-100/70 text-sm leading-relaxed">
                  依托专业仲裁团队与智能调解算法，为消费者与商家提供公平、公正的权益保障服务。
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">智能案件分派</p>
                  <p className="text-primary-200/60 text-xs mt-0.5">基于优先级与负载均衡自动派单</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gavel className="w-4 h-4 text-primary-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">专业仲裁审理</p>
                  <p className="text-primary-200/60 text-xs mt-0.5">持证仲裁员独立公正裁决</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-primary-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">全程可追溯</p>
                  <p className="text-primary-200/60 text-xs mt-0.5">处理流程透明，证据留存完整</p>
                </div>
              </div>
            </div>

            <p className="text-primary-200/40 text-xs">
              © 2025 消费者保障中心 · 保留所有权利
            </p>
          </div>

          <div className="lg:col-span-3 bg-white p-8 sm:p-12">
            <div className="max-w-md mx-auto">
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-neutral-800 text-lg font-bold">消费者保障中心</h2>
                </div>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-800">
                  欢迎登录
                </h1>
                <p className="text-neutral-500 text-sm mt-2">
                  请选择您的身份，并输入账号密码以继续
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  选择登录身份
                </label>
                <div className="inline-flex p-1 bg-neutral-100 rounded-full flex-wrap gap-1">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    const isActive = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleChange(role.value)}
                        className={[
                          'inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'text-neutral-600 hover:text-neutral-800 hover:bg-white/70',
                        ].join(' ')}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{role.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg border border-primary-100">
                  <div className="w-6 h-6 rounded-md bg-primary-100 flex items-center justify-center">
                    {(() => {
                      const Icon = roleOptions.find((r) => r.value === selectedRole)?.icon;
                      return Icon ? <Icon className="w-3.5 h-3.5 text-primary-600" /> : null;
                    })()}
                  </div>
                  <p className="text-xs text-primary-700">
                    {roleOptions.find((r) => r.value === selectedRole)?.description}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                    账号
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    placeholder={`请输入${ROLE_LABELS[selectedRole]}账号`}
                    autoComplete="username"
                    className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent focus:bg-white transition-all placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent focus:bg-white transition-all placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-danger-50 border border-danger-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-danger-700">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
                    />
                    <span className="text-sm text-neutral-600">记住登录状态</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>登录中...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>登 录</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-neutral-400">快捷登录体验</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleQuickLogin(role.value)}
                        disabled={loading}
                        title={`快速登录${role.label}`}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                        </div>
                        <span className="text-[10px] text-neutral-500 group-hover:text-primary-700 font-medium transition-colors">
                          {role.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-neutral-400">
                登录即表示您同意
                <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">服务条款</a>
                和
                <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">隐私政策</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
