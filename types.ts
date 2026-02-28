
export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'manager' | 'handover' | 'personal';
  meta?: string;
}

export interface ManualCategory {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  type?: 'admin' | 'subject';
  order?: number;
}

export interface ManualItem {
  id: string;
  categoryId: string;
  subCategory: string;
  title: string;
  description: string;
  icon: string;
  timeEstimate: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  steps?: string[];
  hasRecentUpdate?: boolean;
  lastUpdateText?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface StoreUpdate {
  id: string;
  author: string;
  authorInitial: string;
  timeAgo: string;
  title: string;
  description: string;
  category: '필독' | '일반' | '매뉴얼' | '일정';
  isImportant?: boolean;
  relatedManualId?: string;
}
