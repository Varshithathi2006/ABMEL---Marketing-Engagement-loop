import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Book, MessageCircle, ChevronRight, PlayCircle } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

export const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('faq');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto w-full max-w-2xl h-[600px] bg-navy-950 border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Help Center</h2>
                                    <p className="text-xs text-slate-400">Documentation & Support</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar */}
                            <div className="w-48 border-r border-white/5 bg-black/20 p-4 space-y-2">
                                <TabButton label="FAQ" icon={<MessageCircle size={16} />} active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} />
                                <TabButton label="Guide" icon={<Book size={16} />} active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} />
                                <TabButton label="Tutorials" icon={<PlayCircle size={16} />} active={activeTab === 'tutorials'} onClick={() => setActiveTab('tutorials')} />
                            </div>

                            {/* Main Area */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                {activeTab === 'faq' && (
                                    <div className="space-y-6">
                                        <FAQItem
                                            question="How do I change the currency?"
                                            answer="Currency is automatically localized based on your region settings. Currently, it defaults to INR (₹)."
                                        />
                                        <FAQItem
                                            question="Where is my data stored?"
                                            answer="All campaign data, drafts, and brand assets are securely stored in our cloud database (Supabase) with enterprise-grade encryption."
                                        />
                                        <FAQItem
                                            question="What is the 'Decision' node?"
                                            answer="The Decision Node is the final step where the AI evaluates all generated creatives and selects the highest-performing variant based on your goals."
                                        />
                                    </div>
                                )}
                                {activeTab === 'guide' && (
                                    <div className="prose prose-invert prose-sm">
                                        <h3>Getting Started</h3>
                                        <p>1. <strong>Initialize Campaign:</strong> Click the button in the chat interface.</p>
                                        <p>2. <strong>Upload Context:</strong> Drag & drop your PDF brand guidelines.</p>
                                        <p>3. <strong>Configure Product:</strong> Fill in the product details matrix.</p>
                                        <p>4. <strong>Execution:</strong> Watch the agent graph optimize your campaign in real-time.</p>
                                    </div>
                                )}
                                {activeTab === 'tutorials' && (
                                    <div className="text-center text-slate-500 mt-20">
                                        <PlayCircle size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Video tutorials coming soon.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const TabButton = ({ label, icon, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
            active ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
    >
        {icon}
        {label}
    </button>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="border border-white/5 rounded-xl p-4 bg-white/5 hover:bg-white/10 transition-colors">
        <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
            <ChevronRight size={14} className="text-blue-500" />
            {question}
        </h4>
        <p className="text-sm text-slate-400 pl-6 leading-relaxed">{answer}</p>
    </div>
);
