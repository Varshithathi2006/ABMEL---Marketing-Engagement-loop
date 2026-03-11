import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Added
import { MessageBubble } from './MessageBubble';
import { Send, Sparkles, Play, Paperclip, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useCampaignStore } from '../../store/useCampaignStore';

// Widgets
import { BrandGuidelinesWidget } from './widgets/BrandGuidelinesWidget';
import { ProductDetailsWidget } from './widgets/ProductDetailsWidget';

interface Message {
    id: string;
    type: 'system' | 'user';
    content?: string;
    component?: React.ReactNode;
    isTyping?: boolean;
}

export const PromptingInterface = () => {
    const navigate = useNavigate(); // Hook initialized
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isWidgetActive, setIsWidgetActive] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { setInput, planCampaign } = useCampaignStore();
    const hasInitialized = useRef(false);


    // Initial Greeting - always fresh cold start
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        setTimeout(() => {
            addSystemMessage("Welcome to the ABMEL Command Center. \n\nI am your autonomous agentic partner. To begin, please upload your brand guidelines or define your campaign context.", "welcome");

            setTimeout(() => {
                addComponentMessage(
                    <div className="flex justify-start">
                        <button
                            onClick={() => {
                                setIsWidgetActive(true);
                                addSystemMessage("Initializing Context Ingestion Protocol...", "init-brand");
                                setTimeout(() => {
                                    addComponentMessage(<BrandGuidelinesWidget onComplete={handleBrandComplete} />, "brand-widget");
                                }, 500);
                            }}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                        >
                            <Sparkles size={18} className="fill-current" />
                            Initialize Campaign
                        </button>
                    </div>,
                    "start-button"
                );
            }, 600);
        }, 800);
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addSystemMessage = (text: string, id: string) => {
        setMessages(prev => [...prev, { id, type: 'system', content: text }]);
    };

    const addComponentMessage = (component: React.ReactNode, id: string) => {
        setMessages(prev => [...prev, { id, type: 'system', component }]);
    };

    const handleUserResponse = (text: string) => {
        const id = Date.now().toString();
        setMessages(prev => [...prev, { id, type: 'user', content: text }]);
    };

    const handleBrandComplete = (data: any) => {
        if (!data.skipped) {
            setInput({ brandGuidelines: data.text }); // Real persistent store update
        }

        handleUserResponse(data.skipped ? "Skipped brand context upload." : `Uploaded guidelines: ${data.fileName}`);

        setTimeout(() => {
            // setIsWidgetActive(false); // Briefly show chat? No, keep focus.
            addSystemMessage("Neural context updated. \n\nNow, let's define the campaign constraints.", "product-intro");
            setTimeout(() => {
                addComponentMessage(<ProductDetailsWidget onComplete={handleProductComplete} />, "product-widget");
            }, 800);
        }, 1000);
    };

    const handleProductComplete = (data: any) => {
        setIsWidgetActive(false); // SHOW INPUT BACK
        setInput(data);
        handleUserResponse(`Configured campaign for ${data.product} targeting ${data.audience}.`);

        setTimeout(() => {
            addSystemMessage("Configuration Matrix Locked. \n\nI am now ready to generate the execution plan. Shall we proceed to the Planning Phase?", "ready-to-plan");

            // Add the "Proceed" Action Button
            setTimeout(() => {
                addComponentMessage(
                    <div className="flex gap-4">
                        <button
                            onClick={async (e) => {
                                console.log('[UI] "Initiate Planning Phase" clicked');
                                const btn = e.currentTarget;
                                btn.disabled = true;
                                btn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Connecting to Agent Hive...';

                                try {
                                    console.log('[UI] Calling planCampaign()...');
                                    await planCampaign();
                                    console.log('[UI] planCampaign returned successfully, navigating to dashboard...');
                                    navigate('/execution');
                                } catch (err) {
                                    console.error('[UI] Error calling planCampaign:', err);
                                    btn.innerHTML = 'Error - Try Again';
                                    btn.disabled = false;
                                }
                            }}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                        >
                            <Play size={20} className="fill-current" />
                            Initiate Planning Phase
                        </button>
                        <button
                            onClick={async () => {
                                const { resetCampaign } = useCampaignStore.getState();
                                await resetCampaign();
                                window.location.reload(); // Refresh to clear chat UI
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all transform hover:scale-105"
                        >
                            <RotateCcw size={20} />
                            Start New Campaign
                        </button>
                    </div>,
                    "action-proceed"
                );
            }, 600);
        }, 1000);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        handleUserResponse(inputValue);
        setInputValue('');

        setTimeout(() => {
            addSystemMessage("I've noted that additional context.", Date.now().toString());
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto relative perspective-1000">
            {/* Thread Area */}
            <div className="flex-1 overflow-y-auto pr-4 scroll-smooth pb-32 no-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} type={msg.type} content={msg.content} isTyping={msg.isTyping}>
                            {msg.component}
                        </MessageBubble>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Command Bar) - Hidden when Widget is Active */}
            <AnimatePresence>
                {!isWidgetActive && (
                    <div className="absolute bottom-8 left-0 w-full px-8 transform-style-3d perspective-1000 z-50">
                        <motion.form
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            onSubmit={handleSendMessage}
                            className="relative group max-w-4xl mx-auto"
                        >
                            {/* Floating Glow/Shadow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500 animate-pulse"></div>

                            <div className="bg-navy-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-colors group-focus-within:border-cyan-500/50">
                                {/* Upload Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-cyan-400 transition-colors"
                                    title="Upload Context"
                                >
                                    <Paperclip size={20} />
                                </motion.button>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse ml-1" />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a message to ABMEL..."
                                    className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 font-medium py-3"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05, x: 2 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!inputValue.trim()}
                                >
                                    <Send size={20} className={clsx(inputValue.trim() && "fill-current")} />
                                </motion.button>
                            </div>
                        </motion.form>
                        <div className="text-center mt-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold opacity-40 text-glow">
                                ABMEL Neural Interface v2.0 • Context Active
                            </p>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
