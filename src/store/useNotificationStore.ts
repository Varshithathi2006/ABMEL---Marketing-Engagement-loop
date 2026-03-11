import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: number;
    read: boolean;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (noti: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            unreadCount: 0,

            addNotification: (noti) => set((state) => {
                const newNoti: Notification = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: Date.now(),
                    read: false,
                    ...noti
                };
                return {
                    notifications: [newNoti, ...state.notifications],
                    unreadCount: state.unreadCount + 1
                };
            }),

            markAsRead: (id) => set((state) => {
                const newNotis = state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                );
                return {
                    notifications: newNotis,
                    unreadCount: newNotis.filter(n => !n.read).length
                };
            }),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            })),

            clearAll: () => set({ notifications: [], unreadCount: 0 })
        }),
        {
            name: 'abmel-notifications'
        }
    )
);
