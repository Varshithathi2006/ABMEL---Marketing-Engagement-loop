import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import clsx from 'clsx';

export const SignupPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Access keys (passwords) do not match");
            return;
        }

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 600));

        const { error } = await signUp(email, password);
        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <AuthLayout
            title="Join Collective"
            subtitle="Register new agentic controller node"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
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
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1 transition-colors group-focus-within:text-cyan-400">Full Designation</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder:text-slate-600 transition-all shadow-inner group-hover:border-white/20"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1 transition-colors group-focus-within:text-cyan-400">Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        // Real-time validation
                                        if (e.target.value.length < 8) setError("Key must be at least 8 chars");
                                        else if (!/[A-Z]/.test(e.target.value)) setError("Must include uppercase");
                                        else if (!/[0-9]/.test(e.target.value)) setError("Must include number");
                                        else setError(null);
                                    }}
                                    className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder:text-slate-600 transition-all shadow-inner group-hover:border-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                            {/* Strength Indicator */}
                            {password && (
                                <div className="mt-2 flex gap-1 h-1">
                                    <div className={clsx("flex-1 rounded-full transition-colors", password.length >= 6 ? "bg-red-500" : "bg-slate-700")}></div>
                                    <div className={clsx("flex-1 rounded-full transition-colors", (password.length >= 8 && /[A-Z]/.test(password)) ? "bg-yellow-500" : "bg-slate-700")}></div>
                                    <div className={clsx("flex-1 rounded-full transition-colors", (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) ? "bg-green-500" : "bg-slate-700")}></div>
                                </div>
                            )}
                        </div>

                        <div className="group">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1 transition-colors group-focus-within:text-cyan-400">Confirm Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder:text-slate-600 transition-all shadow-inner group-hover:border-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
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
                                Create Account
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[25deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </motion.button>
                </div>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline decoration-cyan-400/30 underline-offset-4 transition-all">
                    Access System
                </Link>
            </div>
        </AuthLayout>
    );
};
