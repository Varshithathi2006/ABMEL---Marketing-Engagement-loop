import { motion } from 'framer-motion';
import { Box, User } from 'lucide-react';
import clsx from 'clsx';
import React from 'react';

type MessageType = 'system' | 'user';

interface MessageBubbleProps {
    type: MessageType;
    content?: string;
    children?: React.ReactNode;
    isTyping?: boolean;
}

export const MessageBubble = ({ type, content, children, isTyping }: MessageBubbleProps) => {
    const isSystem = type === 'system';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={clsx(
                'flex gap-3 max-w-3xl mb-6',
                isSystem ? 'mr-auto' : 'ml-auto flex-row-reverse'
            )}
        >
            {/* Avatar */}
            <div className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md',
                isSystem
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-indigo-500/20'
                    : 'bg-slate-700 border border-slate-600 text-slate-300'
            )}>
                {isSystem ? <Box className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={clsx(
                'px-5 py-4 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border',
                isSystem
                    ? 'bg-slate-800 border-slate-700 text-slate-100 rounded-tl-sm'
                    : 'bg-indigo-600 border-indigo-500/60 text-white rounded-tr-sm'
            )}>
                {isTyping ? (
                    <div className="flex gap-1.5 h-5 items-center">
                        {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-slate-400"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.55, repeat: Infinity, delay }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">
                        {content}
                        {children}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
