import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
} from 'firebase/firestore';

/**
 * Hook for real-time Firestore sync of dashboard data.
 * Falls back to localStorage when Firebase is not configured.
 */
export const useFirestore = (userId) => {
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

    // Check if Firebase is properly configured
    const isConfigured = userId && !db._settings?.host?.includes('YOUR_PROJECT');

    useEffect(() => {
        if (!isConfigured) {
            // Fall back to localStorage
            const savedData = localStorage.getItem('taskDashboardData');
            const savedCats = localStorage.getItem('taskDashboardCategories');
            const savedActivity = localStorage.getItem('taskDashboardActivity');

            if (savedData) setData(JSON.parse(savedData));
            if (savedCats) setCategories(JSON.parse(savedCats));
            if (savedActivity) setActivity(JSON.parse(savedActivity));

            setLoading(false);
            return;
        }

        // Subscribe to dashboard data
        const dashRef = doc(db, 'dashboards', userId);
        const unsubDash = onSnapshot(dashRef, (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setData(d.boardData || null);
                setCategories(d.categories || null);
            }
            setIsFirebaseConnected(true);
            setLoading(false);
        }, (error) => {
            console.error('Firestore dashboard error:', error);
            // Fall back to localStorage
            const savedData = localStorage.getItem('taskDashboardData');
            if (savedData) setData(JSON.parse(savedData));
            setLoading(false);
        });

        // Subscribe to activity log
        const actRef = collection(db, 'dashboards', userId, 'activity');
        const actQuery = query(actRef, orderBy('timestamp', 'desc'), limit(100));
        const unsubAct = onSnapshot(actQuery, (snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivity(items);
        });

        return () => {
            unsubDash();
            unsubAct();
        };
    }, [userId, isConfigured]);

    // Save dashboard data
    const saveData = useCallback(async (newData) => {
        setData(newData);
        localStorage.setItem('taskDashboardData', JSON.stringify(newData));

        if (isConfigured && userId) {
            try {
                const dashRef = doc(db, 'dashboards', userId);
                await setDoc(dashRef, { boardData: newData }, { merge: true });
            } catch (err) {
                console.error('Firestore save error:', err);
            }
        }
    }, [userId, isConfigured]);

    // Save categories
    const saveCategories = useCallback(async (newCats) => {
        setCategories(newCats);
        localStorage.setItem('taskDashboardCategories', JSON.stringify(newCats));

        if (isConfigured && userId) {
            try {
                const dashRef = doc(db, 'dashboards', userId);
                await setDoc(dashRef, { categories: newCats }, { merge: true });
            } catch (err) {
                console.error('Firestore categories save error:', err);
            }
        }
    }, [userId, isConfigured]);

    // Add activity entry
    const addActivityEntry = useCallback(async (type, message) => {
        const entry = {
            type,
            message,
            timestamp: new Date().toISOString(),
        };

        // Always update local
        setActivity(prev => [entry, ...prev].slice(0, 100));
        const stored = JSON.parse(localStorage.getItem('taskDashboardActivity') || '[]');
        localStorage.setItem('taskDashboardActivity', JSON.stringify([entry, ...stored].slice(0, 100)));

        if (isConfigured && userId) {
            try {
                const actRef = collection(db, 'dashboards', userId, 'activity');
                await addDoc(actRef, { ...entry, timestamp: serverTimestamp() });
            } catch (err) {
                console.error('Firestore activity save error:', err);
            }
        }
    }, [userId, isConfigured]);

    return {
        data,
        categories,
        activity,
        loading,
        isFirebaseConnected,
        saveData,
        saveCategories,
        addActivityEntry,
    };
};
