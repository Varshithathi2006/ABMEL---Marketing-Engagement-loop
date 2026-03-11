import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import clsx from 'clsx';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        // Simulate network delay for UX if super fast
        await new Promise(r => setTimeout(r, 600));

        const { error } = await signIn(email, password);
        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Authenticate to access the neural network"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="group">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1 transition-colors group-focus-within:text-cyan-400">Email Identity</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder:text-slate-600 transition-all shadow-inner group-hover:border-white/20"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <div className="flex justify-between items-center mb-1.5 ml-1">
                            <label className="block text-xs font-medium text-slate-400 transition-colors group-focus-within:text-cyan-400">Access Key</label>
                            <a href="#" className="text-xs text-cyan-500/80 hover:text-cyan-400 transition-colors">Forgot key?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder:text-slate-600 transition-all shadow-inner group-hover:border-white/20"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                            "w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group relative overflow-hidden",
                            isLoading && "opacity-80 cursor-wait"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Initialize Session
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}

                        {/* Button sheen effect */}
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[25deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </motion.button>
                </div>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
                New to the system?{' '}
                <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline decoration-cyan-400/30 underline-offset-4 transition-all">
                    Request Access
                </Link>
            </div>
        </AuthLayout>
    );
};
