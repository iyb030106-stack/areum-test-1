
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AcademyInfo {
    name: string;
    motto: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface AcademyContextValue {
    academyId: string;
    academyName: string;
    academyMotto: string;
    academyInfo: AcademyInfo;
}

const DEFAULT: AcademyInfo = {
    name: 'HAEMA',
    motto: '학원 운영의 흐름을 바꾼다',
};

const AcademyContext = createContext<AcademyContextValue>({
    academyId: '',
    academyName: DEFAULT.name,
    academyMotto: DEFAULT.motto,
    academyInfo: DEFAULT,
});

export const AcademyProvider: React.FC<{ children: React.ReactNode, academyId?: string }> = ({ children, academyId }) => {
    const [info, setInfo] = useState<AcademyInfo>(DEFAULT);

    useEffect(() => {
        if (!academyId) {
            setInfo(DEFAULT);
            return;
        }

        const unsub = onSnapshot(doc(db, 'academies', academyId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setInfo(prev => ({ ...DEFAULT, ...prev, ...(data.info || {}) }));
            }
        });
        return unsub;
    }, [academyId]);

    return (
        <AcademyContext.Provider value={{ academyId: academyId || '', academyName: info.name || DEFAULT.name, academyMotto: info.motto || DEFAULT.motto, academyInfo: info }}>
            {children}
        </AcademyContext.Provider>
    );
};

export const useAcademy = () => useContext(AcademyContext);
