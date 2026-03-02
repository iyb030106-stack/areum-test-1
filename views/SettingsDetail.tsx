
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToAllUsers, FirestoreUser, generateUniqueInviteCode } from '../services/authService';
import { db, auth } from '../services/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAcademy } from '../contexts/AcademyContext';

// ─── 공통 컴포넌트 ──────────────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${value ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
    </div>
);

const SaveBtn: React.FC<{ onClick: () => void; loading?: boolean }> = ({ onClick, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
    >
        {loading ? '저장 중...' : '저장하기'}
    </button>
);

const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex-1 pr-4">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
            {desc && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>}
        </div>
        {children}
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm px-5 overflow-hidden ${className}`}>
        {children}
    </div>
);

// 읽기 전용 정보 행
const InfoRow: React.FC<{ icon: string; label: string; value?: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-slate-400">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate">{value || <span className="text-slate-300 text-[12px]">미등록</span>}</p>
        </div>
    </div>
);

// ─── 각 패널 컴포넌트 ────────────────────────────────────────────────────────

// 1. 학원명 및 로고 변경
const AcademyInfoPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [motto, setMotto] = useState('');
    const [saving, setSaving] = useState(false);
    const { academyId } = useAcademy();
    useEffect(() => {
        if (!academyId) return;
        getDoc(doc(db, 'academies', academyId)).then(snap => {
            if (snap.exists()) {
                const info = snap.data().info || {};
                setName(info.name || '');
                setMotto(info.motto || '');
            }
        });
    }, [academyId]);
    const handleSave = async () => {
        if (!academyId) return;
        setSaving(true);
        await updateDoc(doc(db, 'academies', academyId), {
            'info.name': name,
            'info.motto': motto
        });
        setSaving(false);
        navigate('/settings');
    };
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">학원의 기본 정보를 수정합니다.</p>
            <div className="space-y-3">
                <Field label="학원명" value={name} onChange={setName} placeholder="예: HAEMA 어학원" />
                <Field label="학원 슬로건" value={motto} onChange={setMotto} placeholder="예: 학원 운영의 흐름을 바꾼다" />
            </div>
            <SaveBtn onClick={handleSave} loading={saving} />
        </div>
    );
};

// 2. 운영 시간 설정
const OperatingHoursPage = () => {
    const navigate = useNavigate();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const [hours, setHours] = useState<Record<string, { open: boolean; start: string; end: string }>>(
        Object.fromEntries(days.map(d => [d, { open: d !== '일', start: '09:00', end: '22:00' }]))
    );
    const [saving, setSaving] = useState(false);
    const { academyId } = useAcademy();
    useEffect(() => {
        if (!academyId) return;
        getDoc(doc(db, 'academies', academyId)).then(snap => {
            if (snap.exists() && snap.data().hours) setHours(snap.data().hours);
        });
    }, [academyId]);
    const handleSave = async () => {
        if (!academyId) return;
        setSaving(true);
        await updateDoc(doc(db, 'academies', academyId), { hours });
        setSaving(false);
        navigate('/settings');
    };
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">요일별 운영 시간을 설정합니다.</p>
            <Card>
                {days.map(day => (
                    <div key={day} className="flex items-center gap-3 py-3.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <Toggle value={hours[day]?.open ?? false} onChange={v => setHours(h => ({ ...h, [day]: { ...h[day], open: v } }))} />
                        <span className={`text-sm font-black w-5 ${hours[day]?.open ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>{day}</span>
                        {hours[day]?.open ? (
                            <div className="flex items-center gap-2 ml-auto">
                                <input type="time" value={hours[day]?.start} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], start: e.target.value } }))}
                                    className="text-[12px] font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                                <span className="text-slate-300 text-xs">~</span>
                                <input type="time" value={hours[day]?.end} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], end: e.target.value } }))}
                                    className="text-[12px] font-bold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                            </div>
                        ) : (
                            <span className="ml-auto text-[11px] text-slate-300 font-bold">휴무</span>
                        )}
                    </div>
                ))}
            </Card>
            <SaveBtn onClick={handleSave} loading={saving} />
        </div>
    );
};

// 3. 연락처 및 위치 정보
const ContactPage = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const { academyId } = useAcademy();
    useEffect(() => {
        if (!academyId) return;
        getDoc(doc(db, 'academies', academyId)).then(snap => {
            if (snap.exists()) {
                const contact = snap.data().contact || {};
                setPhone(contact.phone || '');
                setAddress(contact.address || '');
                setEmail(contact.email || '');
            }
        });
    }, [academyId]);
    const handleSave = async () => {
        if (!academyId) return;
        setSaving(true);
        await updateDoc(doc(db, 'academies', academyId), {
            'contact.phone': phone,
            'contact.address': address,
            'contact.email': email
        });
        setSaving(false);
        navigate('/settings');
    };
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">학원 연락망을 등록합니다.</p>
            <div className="space-y-3">
                <Field label="전화번호" value={phone} onChange={setPhone} placeholder="010-0000-0000" type="tel" />
                <Field label="이메일" value={email} onChange={setEmail} placeholder="academy@example.com" type="email" />
                <Field label="주소" value={address} onChange={setAddress} placeholder="서울특별시 강남구 ..." />
            </div>
            <SaveBtn onClick={handleSave} loading={saving} />
        </div>
    );
};

// 4. 관리자 계정 관리
const AdminAccountPage = () => {
    const { academyId } = useAcademy();
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    useEffect(() => { const unsub = subscribeToAllUsers(academyId, u => setUsers(u.filter(x => x.role === 'admin'))); return unsub; }, [academyId]);

    const handleDelete = async (uid: string) => {
        if (!window.confirm('이 관리자 계정을 시스템에서 완전히 삭제하시겠습니까?')) return;
        await deleteDoc(doc(db, 'users', uid));
        alert('삭제되었습니다.');
    };

    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">현재 관리자 계정 목록입니다.</p>
            <Card>
                {users.length === 0 && <p className="text-center text-[12px] text-slate-400 py-8">등록된 관리자가 없습니다.</p>}
                {users.map(u => (
                    <div key={u.uid} className="flex items-center gap-3.5 py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className={`size-11 rounded-[0.9rem] ${u.avatarColor || 'bg-slate-200'} flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}>
                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className={`text-base font-black ${u.avatarTextColor}`}>{u.initial}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.position || '관리자'} · {u.email}</p>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-primary/10 text-primary rounded-xl shrink-0">관리자</span>

                        {u.uid !== auth.currentUser?.uid ? (
                            <button onClick={() => handleDelete(u.uid)} className="size-8 ml-2 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-90" title="계정 삭제">
                                <span className="material-symbols-outlined text-[16px]">person_remove</span>
                            </button>
                        ) : (
                            <div className="size-8 ml-2 flex items-center justify-center">
                                <span className="text-[10px] text-slate-300 font-bold">나</span>
                            </div>
                        )}
                    </div>
                ))}
            </Card>
        </div>
    );
};

// 5. 직원 직책/권한 설정
const StaffRolesPage = () => {
    const { academyId } = useAcademy();
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPos, setEditPos] = useState('');
    const [editRole, setEditRole] = useState<'admin' | 'staff'>('staff');

    useEffect(() => { const unsub = subscribeToAllUsers(academyId, u => setUsers(u.filter(x => x.role === 'staff'))); return unsub; }, [academyId]);

    const handleSave = async (uid: string) => {
        await updateDoc(doc(db, 'users', uid), { position: editPos, role: editRole });
        setEditingId(null);
    };

    const handleDelete = async (uid: string) => {
        if (!window.confirm('이 직원 계정을 시스템에서 완전히 삭제하시겠습니까?')) return;
        await deleteDoc(doc(db, 'users', uid));
        alert('삭제되었습니다.');
    };

    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">직원의 직책과 권한을 관리합니다. 연필 버튼을 눌러 수정하세요.</p>
            <div className="space-y-2">
                {users.length === 0 && <p className="text-center text-[12px] text-slate-400 py-8">등록된 직원이 없습니다.</p>}
                {users.map(u => (
                    <div key={u.uid} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-4 py-3.5 space-y-2.5">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-[0.8rem] ${u.avatarColor || 'bg-slate-200'} flex items-center justify-center shrink-0 overflow-hidden`}>
                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <span className={`text-sm font-black ${u.avatarTextColor}`}>{u.initial}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-400">{u.position || '직책 없음'}</p>
                            </div>
                            <button onClick={() => { setEditingId(u.uid); setEditPos(u.position || ''); setEditRole('staff'); }}
                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => handleDelete(u.uid)} className="size-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-90 ml-1">
                                <span className="material-symbols-outlined text-[16px]">person_remove</span>
                            </button>
                        </div>
                        {editingId === u.uid && (
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <input value={editPos} onChange={e => setEditPos(e.target.value)} placeholder="직책 입력"
                                    className="flex-[2] min-w-[120px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'staff')} className="flex-1 min-w-[100px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                                    <option value="staff">직원</option>
                                    <option value="admin">관리자로 승급</option>
                                </select>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => handleSave(u.uid)} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-[12px] font-black active:scale-95">저장</button>
                                    <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-[12px] font-black text-slate-500 active:scale-95">취소</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 6. 학원 고유번호 관리
const InviteCodePage = () => {
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);
    const { academyId } = useAcademy();
    useEffect(() => {
        if (!academyId) return;
        getDoc(doc(db, 'academies', academyId)).then(snap => {
            if (snap.exists()) setCode(snap.data().inviteCode || '');
        });
    }, [academyId]);

    const generate = async () => {
        if (!academyId) return;
        const newCode = await generateUniqueInviteCode();
        setCode(newCode);
        setCopied(false);
        await updateDoc(doc(db, 'academies', academyId), { inviteCode: newCode });
    };
    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">직원 가입 및 소속 인증을 위한 학원 고유번호를 관리합니다.</p>
            <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm p-8 flex flex-col items-center gap-5">
                {code ? (
                    <>
                        <div className="text-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">학원 고유번호</p>
                            <p className="text-3xl font-black tracking-normal text-slate-900 dark:text-white mb-2">{code}</p>
                        </div>
                        <button onClick={copyCode}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm ${copied ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>
                            <span className="material-symbols-outlined text-[17px]">{copied ? 'check' : 'content_copy'}</span>
                            {copied ? '복사됨!' : '번호 복사'}
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">key</span>
                        <p className="text-slate-400 text-sm font-bold">아래 버튼을 눌러 고유번호를 생성하세요</p>
                    </div>
                )}
            </div>
            {
                !code ? (
                    <button onClick={generate} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">key</span>
                        번호 생성
                    </button>
                ) : code.length < 10 && (
                    <button onClick={() => {
                        if (window.confirm('현재 사용 중인 6자리 번호를 더 보안이 강화된 10자리 고유번호로 교체할까요?\n기존 가입된 직원들은 다시 소속 인증을 할 필요는 없지만, 신규 직원들은 새로운 번호를 입력해야 합니다.')) {
                            generate();
                        }
                    }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[12px] shadow-lg active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">security</span>
                        보안 강화된 고유번호로 교체하기
                    </button>
                )
            }
        </div >
    );
};

// 7. 푸시 알림 설정
const PushNotifPage = () => {
    const uid = auth.currentUser?.uid;
    const storageKey = `notif_settings_${uid}`;
    const load = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{ }'); } catch { return {}; } };
    const [notifs, setNotifs] = useState<Record<string, boolean>>({ announcement: true, manual: true, chat: true, task: false, ...load() });
    const toggle = (key: string) => {
        const next = { ...notifs, [key]: !notifs[key] };
        setNotifs(next);
        if (uid) localStorage.setItem(storageKey, JSON.stringify(next));
    };
    const items = [
        { key: 'announcement', label: '공지사항 알림', desc: '새 공지사항이 등록될 때 알림을 받습니다' },
        { key: 'manual', label: '매뉴얼 업데이트 알림', desc: '매뉴얼이 수정되거나 추가될 때 알림을 받습니다' },
        { key: 'chat', label: '채팅 메시지 알림', desc: '새 메시지가 도착할 때 알림을 받습니다' },
        { key: 'task', label: '업무 알림', desc: '새 업무가 배정될 때 알림을 받습니다' },
    ];
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">받을 알림 유형을 선택하세요.</p>
            <Card>
                {items.map(item => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle value={notifs[item.key] ?? false} onChange={() => toggle(item.key)} />
                    </Row>
                ))}
            </Card>
        </div>
    );
};

// 8. 자동 업무 할당 규칙
const AutoTaskPage = () => {
    const uid = auth.currentUser?.uid;
    const storageKey = `auto_task_${uid}`;
    const load = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{ }'); } catch { return {}; } };
    const [rules, setRules] = useState<Record<string, boolean>>({ roundRobin: true, bySubject: false, notifyOnAssign: true, ...load() });
    const toggle = (key: string) => {
        const next = { ...rules, [key]: !rules[key] };
        setRules(next);
        if (uid) localStorage.setItem(storageKey, JSON.stringify(next));
    };
    const items = [
        { key: 'roundRobin', label: '순환 배정', desc: '직원들에게 순서대로 업무를 배정합니다' },
        { key: 'bySubject', label: '과목별 전담 배정', desc: '담당 과목에 맞춰 업무를 자동으로 배정합니다' },
        { key: 'notifyOnAssign', label: '배정 시 알림 발송', desc: '업무 배정 즉시 담당자에게 알림을 보냅니다' },
    ];
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">업무 자동 배정 방식을 설정합니다.</p>
            <Card>
                {items.map(item => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle value={rules[item.key] ?? false} onChange={() => toggle(item.key)} />
                    </Row>
                ))}
            </Card>
        </div>
    );
};

// 9. 내 정보 공개 범위
const PrivacyPage = () => {
    const uid = auth.currentUser?.uid;
    const storageKey = `privacy_${uid}`;
    const load = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '{ }'); } catch { return {}; } };
    const [priv, setPriv] = useState<Record<string, boolean>>({ showEmail: false, showPosition: true, showActivity: true, ...load() });
    const toggle = (key: string) => {
        const next = { ...priv, [key]: !priv[key] };
        setPriv(next);
        if (uid) localStorage.setItem(storageKey, JSON.stringify(next));
    };
    const items = [
        { key: 'showEmail', label: '이메일 공개', desc: '다른 팀원에게 이메일 주소가 보입니다' },
        { key: 'showPosition', label: '직책 공개', desc: '멤버 목록에 직책을 표시합니다' },
        { key: 'showActivity', label: '활동 내역 공개', desc: '내가 작성한 매뉴얼·공지를 팀원에게 공개합니다' },
    ];
    return (
        <div className="space-y-4">
            <p className="text-[12px] text-slate-400 font-medium">다른 팀원에게 공개할 정보를 선택하세요.</p>
            <Card>
                {items.map(item => (
                    <Row key={item.key} label={item.label} desc={item.desc}>
                        <Toggle value={priv[item.key] ?? false} onChange={() => toggle(item.key)} />
                    </Row>
                ))}
            </Card>
        </div>
    );
};

// 10. 학원 정보 보기 (직원 전용 - 읽기 전용)
const AcademyInfoViewPage = () => {
    const [info, setInfo] = useState<{ name?: string; motto?: string }>({});
    const [contact, setContact] = useState<{ phone?: string; email?: string; address?: string }>({});
    const [hours, setHours] = useState<Record<string, { open: boolean; start: string; end: string }>>({});
    const days = ['월', '화', '수', '목', '금', '토', '일'];

    const { academyId } = useAcademy();
    useEffect(() => {
        if (!academyId) return;
        getDoc(doc(db, 'academies', academyId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setInfo(data.info || {});
                setContact(data.contact || {});
                setHours(data.hours || {});
            }
        });
    }, [academyId]);

    const openDays = days.filter(d => hours[d]?.open);

    return (
        <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">기본 정보</p>
                <Card>
                    <InfoRow icon="storefront" label="학원명" value={info.name} />
                    <InfoRow icon="format_quote" label="슬로건" value={info.motto} />
                </Card>
            </div>

            {/* 연락처 */}
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">연락처</p>
                <Card>
                    <InfoRow icon="call" label="전화번호" value={contact.phone} />
                    <InfoRow icon="mail" label="이메일" value={contact.email} />
                    <InfoRow icon="location_on" label="주소" value={contact.address} />
                </Card>
            </div>

            {/* 운영 시간 */}
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">운영 시간</p>
                <Card>
                    {days.map(day => (
                        <div key={day} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <span className={`text-sm font-black w-5 ${hours[day]?.open ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>{day}</span>
                            {hours[day]?.open ? (
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {hours[day].start} ~ {hours[day].end}
                                </span>
                            ) : (
                                <span className="text-[12px] font-bold text-slate-300">휴무</span>
                            )}
                        </div>
                    ))}
                    {Object.keys(hours).length === 0 && (
                        <p className="text-center text-[12px] text-slate-300 py-6">운영 시간이 등록되지 않았습니다.</p>
                    )}
                </Card>
            </div>

            {/* 운영 요약 */}
            {openDays.length > 0 && (
                <div className="bg-primary/5 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                    <div>
                        <p className="text-[11px] font-black text-primary/70 uppercase tracking-widest">운영 요일</p>
                        <p className="text-sm font-black text-primary">{openDays.join(' · ')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── 패널 메타 정보 ───────────────────────────────────────────────────────────
const PANEL_META: Record<string, { title: string; icon: string; component: React.FC }> = {
    'academy-info': { title: '학원명 및 로고 변경', icon: 'storefront', component: AcademyInfoPage },
    'hours': { title: '운영 시간 설정', icon: 'schedule', component: OperatingHoursPage },
    'contact': { title: '연락처 및 위치 정보', icon: 'location_on', component: ContactPage },
    'admin-accounts': { title: '관리자 계정 관리', icon: 'admin_panel_settings', component: AdminAccountPage },
    'staff-roles': { title: '직원 관리', icon: 'manage_accounts', component: StaffRolesPage },
    'invite-code': { title: '학원 고유번호 관리', icon: 'key', component: InviteCodePage },
    'push-notif': { title: '푸시 알림 설정', icon: 'notifications_active', component: PushNotifPage },
    'auto-task': { title: '자동 업무 할당 규칙', icon: 'auto_mode', component: AutoTaskPage },
    'privacy': { title: '내 정보 공개 범위', icon: 'visibility', component: PrivacyPage },
    'academy-info-view': { title: '학원 정보', icon: 'info', component: AcademyInfoViewPage },
};

// ─── 메인 SettingsDetail 컴포넌트 ─────────────────────────────────────────────
const SettingsDetail: React.FC = () => {
    const { panel } = useParams<{ panel: string }>();
    const navigate = useNavigate();
    const meta = panel ? PANEL_META[panel] : null;

    if (!meta) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                <p className="text-slate-400 font-bold">설정 항목을 찾을 수 없습니다.</p>
                <button onClick={() => navigate(-1)} className="text-primary font-bold text-sm">돌아가기</button>
            </div>
        );
    }

    const PanelComponent = meta.component;

    return (
        <div className="pb-32 min-h-screen relative z-10">
            <header className="sticky top-0 z-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/40 dark:border-slate-800 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="text-slate-400 p-2 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">{meta.icon}</span>
                </div>
                <h1 className="text-[16px] font-black tracking-tight text-slate-900 dark:text-white">{meta.title}</h1>
            </header>

            <main className="px-6 py-8">
                <PanelComponent />
            </main>
        </div>
    );
};

export default SettingsDetail;
