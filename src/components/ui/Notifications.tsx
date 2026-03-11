import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useNotificationStore, type Notification } from '../../store/useNotificationStore';
import clsx from 'clsx';

export const Notifications = () => {
    const { notifications, markAsRead } = useNotificationStore();
    // Show only unread or recent notifications as toasts
    // For this design, let's show the top 3 most recent unread ones as toasts
    const toasts = notifications.filter(n => !n.read).slice(0, 3);

    return (
        <div className="fixed top-24 right-8 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((note) => (
                    <Toast key={note.id} note={note} onClose={() => markAsRead(note.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const Toast = ({ note, onClose }: { note: Notification; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000); // Auto-dismiss
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-emerald-400" />,
        warning: <AlertTriangle size={20} className="text-amber-400" />,
        error: <AlertCircle size={20} className="text-rose-400" />,
        info: <Info size={20} className="text-blue-400" />
    };

    const colors = {
        success: "bg-emerald-500/10 border-emerald-500/20",
        warning: "bg-amber-500/10 border-amber-500/20",
        error: "bg-rose-500/10 border-rose-500/20",
        info: "bg-blue-500/10 border-blue-500/20"
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            layout
            className={clsx(
                "w-80 p-4 rounded-xl border backdrop-blur-xl shadow-lg flex items-start gap-4 pointer-events-auto",
                colors[note.type],
                "bg-navy-900/90" // Base background
            )}
        >
            <div className="mt-0.5">{icons[note.type]}</div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-200">{note.title}</h4>
                {note.message && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{note.message}</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-500 hover:text-white">
                <X size={16} />
            </button>
        </motion.div>
    );
};
