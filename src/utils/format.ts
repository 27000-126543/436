export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string, format: 'full' | 'date' | 'time' | 'short' = 'full'): string => {
  const date = new Date(dateString);
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    case 'time':
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    case 'short':
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    case 'full':
    default:
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
  }
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  const diff = now - date;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < week) return `${Math.floor(diff / day)} 天前`;
  if (diff < month) return `${Math.floor(diff / week)} 周前`;
  
  return formatDate(dateString, 'date');
};

export const getTimeRemaining = (deadline: string): { days: number; hours: number; minutes: number; isExpired: boolean } => {
  const now = Date.now();
  const deadlineTime = new Date(deadline).getTime();
  let diff = deadlineTime - now;
  
  const isExpired = diff <= 0;
  diff = Math.abs(diff);
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  return { days, hours, minutes, isExpired };
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})\*{4}(\d{4})/, '$1****$2');
};

export const getStatusBadgeClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'badge-warning',
    assigned: 'badge-info',
    mediating: 'badge-primary',
    mediated: 'badge-neutral',
    arbitrating: 'badge-warning',
    awarded: 'badge-success',
    closed: 'badge-neutral',
    reject: 'badge-danger',
    paid: 'badge-success',
    failed: 'badge-danger',
  };
  return statusMap[status] || 'badge-neutral';
};

export const getPriorityBadgeClass = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    high: 'badge-danger',
    medium: 'badge-warning',
    low: 'badge-neutral',
  };
  return priorityMap[priority] || 'badge-neutral';
};

export const generateId = (prefix = ''): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const calculateCreditLevel = (score: number): 'A' | 'B' | 'C' | 'D' => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

export const getCreditLevelColor = (level: 'A' | 'B' | 'C' | 'D'): string => {
  const colorMap = {
    A: 'text-success-600 bg-success-100',
    B: 'text-info-600 bg-info-100',
    C: 'text-warning-600 bg-warning-100',
    D: 'text-danger-600 bg-danger-100',
  };
  return colorMap[level];
};
