
import { ManualCategory, ManualItem, StoreUpdate } from './types';

export const MANUAL_CATEGORIES: ManualCategory[] = [
  // Admin Protocols
  { id: 'test-mgmt', name: '단어/성적관리', icon: 'fact_check', colorClass: 'text-indigo-500/80', bgClass: 'bg-indigo-50/50', type: 'admin' },
  { id: 'print-binding', name: '인쇄/제본', icon: 'print', colorClass: 'text-blue-500/80', bgClass: 'bg-blue-50/50', type: 'admin' },
  { id: 'printer-fix', name: '프린터 관리', icon: 'settings_suggest', colorClass: 'text-slate-500/80', bgClass: 'bg-slate-50/50', type: 'admin' },
  { id: 'report-card', name: '성적표 관리', icon: 'analytics', colorClass: 'text-violet-500/80', bgClass: 'bg-violet-50/50', type: 'admin' },
  { id: 'student-care', name: '학생/상담 관리', icon: 'face', colorClass: 'text-rose-500/80', bgClass: 'bg-rose-50/50', type: 'admin' },
  
  // Subject Manuals
  { id: 'subj-vocab', name: 'Vocabulary', icon: 'Aa', colorClass: 'text-indigo-500/80', bgClass: 'bg-indigo-50/50', type: 'subject' },
  { id: 'subj-fiction', name: 'Fiction', icon: 'auto_stories', colorClass: 'text-emerald-500/80', bgClass: 'bg-emerald-50/50', type: 'subject' },
  { id: 'subj-nonfiction', name: 'Nonfiction', icon: 'menu_book', colorClass: 'text-blue-500/80', bgClass: 'bg-blue-50/50', type: 'subject' },
  { id: 'subj-writing', name: 'Writing', icon: 'edit_note', colorClass: 'text-amber-500/80', bgClass: 'bg-amber-50/50', type: 'subject' },
  { id: 'subj-grammar', name: 'Grammar', icon: 'spellcheck', colorClass: 'text-violet-500/80', bgClass: 'bg-violet-50/50', type: 'subject' },
];

export const MANUAL_ITEMS: ManualItem[] = [
  {
    id: 'vocab-test-check',
    categoryId: 'test-mgmt',
    subCategory: '일일 테스트',
    title: '단어 테스트 채점 및 입력',
    description: '일일 단어 테스트 채점 기준 및 성적 프로그램 입력 방법',
    icon: 'rule',
    timeEstimate: '10분',
    level: 'Beginner',
    steps: [
      "테스트지 수거 후 오답 개수를 확인합니다 (P/F 기준: 80점 이상 패스).",
      "재시험 대상자는 명단에 별도로 표시하고 '깜지' 과제를 부여합니다.",
      "학원 관리 시스템의 'Daily Test' 탭에 점수를 입력합니다."
    ]
  },
  {
    id: 'vocab-retest',
    categoryId: 'test-mgmt',
    subCategory: '재시험 관리',
    title: '재시험자 관리 프로세스',
    description: '불합격 학생 재시험 일정 예약 및 관리',
    icon: 'refresh',
    timeEstimate: '5분',
    level: 'Beginner',
    steps: ["미통과자 명단 확인", "재시험 시간 통보", "학부모 문자 발송"]
  },
  {
    id: 'report-upload-guide',
    categoryId: 'report-card',
    subCategory: '시스템 업로드',
    title: '성적표 업로드 가이드',
    description: '학부모 앱 연동을 위한 공식 성적표 업로드 절차',
    icon: 'upload_file',
    timeEstimate: '15분',
    level: 'Intermediate',
    steps: [
      "성적표 관리 페이지에서 해당 클래스를 선택합니다.",
      "피드백 표를 작성하고, 강사 코멘트(최소 3문장)를 입력합니다.",
      "PDF로 변환된 성적표 파일을 드래그하여 업로드합니다."
    ],
    hasRecentUpdate: true,
    lastUpdateText: '2/22 공지 반영됨'
  },
  {
    id: 'subj-v-elementary',
    categoryId: 'subj-vocab',
    subCategory: '초등부',
    title: '초등부 단어 교수법',
    description: '그림 카드를 활용한 영단어 암기 지도법',
    icon: 'child_care',
    timeEstimate: '20분',
    level: 'Beginner',
    steps: ["카드 매칭 게임 진행", "소리 내어 읽기 반복", "그림 보며 스펠링 적기"]
  }
];

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
