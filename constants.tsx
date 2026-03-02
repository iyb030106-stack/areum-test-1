
import { ManualCategory, ManualItem, StoreUpdate } from './types';

export interface Member {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  position: string;        // 직책 (예: 원장, 강사, 행정)
  subject?: string;        // 담당 과목
  joinDate: string;        // 입사일
  avatarColor: string;     // 아바타 배경색 (tailwind class)
  avatarTextColor: string; // 아바타 텍스트색
  initial: string;         // 이름 첫 글자
}

export const MEMBERS: Member[] = [
  {
    id: 'member-1',
    name: '김지영',
    role: 'admin',
    position: '원장',
    joinDate: '2021-03-01',
    avatarColor: 'bg-indigo-100',
    avatarTextColor: 'text-indigo-600',
    initial: '김',
  },
  {
    id: 'member-2',
    name: '박서연',
    role: 'admin',
    position: '매니저',
    joinDate: '2022-07-15',
    avatarColor: 'bg-violet-100',
    avatarTextColor: 'text-violet-600',
    initial: '박',
  },
  {
    id: 'member-3',
    name: '이민준',
    role: 'staff',
    position: '강사',
    subject: 'Vocabulary / Fiction',
    joinDate: '2023-02-10',
    avatarColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    initial: '이',
  },
  {
    id: 'member-4',
    name: '최하은',
    role: 'staff',
    position: '강사',
    subject: 'Nonfiction / Writing',
    joinDate: '2023-08-01',
    avatarColor: 'bg-emerald-100',
    avatarTextColor: 'text-emerald-600',
    initial: '최',
  },
  {
    id: 'member-5',
    name: '정다은',
    role: 'staff',
    position: '강사',
    subject: 'Grammar',
    joinDate: '2024-01-20',
    avatarColor: 'bg-rose-100',
    avatarTextColor: 'text-rose-600',
    initial: '정',
  },
  {
    id: 'member-6',
    name: '한수빈',
    role: 'staff',
    position: '행정',
    joinDate: '2024-04-05',
    avatarColor: 'bg-amber-100',
    avatarTextColor: 'text-amber-600',
    initial: '한',
  },
];


export const MANUAL_CATEGORIES: ManualCategory[] = [
  {
    id: 'cat-1',
    name: '수업 운영',
    icon: 'school',
    colorClass: 'text-primary/80',
    bgClass: 'bg-primary/5',
    type: 'admin',
    order: 0
  },
  {
    id: 'cat-2',
    name: '평가 · 테스트',
    icon: 'fact_check',
    colorClass: 'text-primary/80',
    bgClass: 'bg-primary/5',
    type: 'admin',
    order: 1
  },
  {
    id: 'cat-3',
    name: '학생 관리',
    icon: 'groups',
    colorClass: 'text-primary/80',
    bgClass: 'bg-primary/5',
    type: 'admin',
    order: 2
  },
  {
    id: 'cat-4',
    name: '행정 · 운영',
    icon: 'analytics',
    colorClass: 'text-primary/80',
    bgClass: 'bg-primary/5',
    type: 'admin',
    order: 3
  },
  {
    id: 'cat-5',
    name: '시설 · 시스템',
    icon: 'construction',
    colorClass: 'text-primary/80',
    bgClass: 'bg-primary/5',
    type: 'admin',
    order: 4
  }
];

export const MANUAL_ITEMS: ManualItem[] = [];

export const STORE_UPDATES: StoreUpdate[] = [
  {
    id: 'notice-1',
    author: '원장',
    authorInitial: '원',
    timeAgo: '지금',
    title: '2026년 1분기 교재 리스트 업데이트',
    description: '각 반별 배정된 신규 교재 리스트를 확인하시고, 이번 주 금요일까지 수령 부탁드립니다.',
    category: '필독',
    isImportant: true
  },
  {
    id: 'notice-2',
    author: '매니저',
    authorInitial: '매',
    timeAgo: '2시간 전',
    title: '성적표 업로드 가이드 변경 안내',
    description: '중간고사 대비 성적표 업로드 방식이 변경되었습니다. 매뉴얼 탭을 확인해 주세요.',
    category: '매뉴얼',
    isImportant: true,
    relatedManualId: 'report-upload-guide'
  },
  {
    id: 'notice-3',
    author: '행정팀',
    authorInitial: '행',
    timeAgo: '1일 전',
    title: '강의실 정기 방역 작업 안내',
    description: '이번 주 일요일 오전 9시부터 전 강의실 방역이 실시됩니다.',
    category: '일정'
  },
];
