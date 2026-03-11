import { User, Bell, Database } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsPage = () => {
    const { llmProvider, temperature, updateSettings, notifications } = useSettingsStore();
    const { user } = useAuthStore();

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>

            <div className="space-y-6">

                {/* Profile Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-500" />
                        Account Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                            <input type="text" value={user?.email || 'N/A'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Role</label>
                            <input type="text" value="System Admin" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-400 outline-none" readOnly />
                        </div>
                    </div>
                </div>

                {/* API & Data Intelligence */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Database size={20} className="text-purple-500" />
                        Intelligence Configuration
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">Model Tier</label>
                            <select
                                value={llmProvider}
                                onChange={(e) => updateSettings({ llmProvider: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 appearance-none"
                            >
                                <option value="groq">Standard (Fast & Efficient)</option>
                                <option value="openai">Premium (High Reasoning)</option>
                                <option value="ollama">Enterprise (Private/Local)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-3">Creativity Mode</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { val: 0.2, label: 'Precise', desc: 'Factual & Direct' },
                                    { val: 0.7, label: 'Balanced', desc: 'Standard Mix' },
                                    { val: 1.0, label: 'Artistic', desc: 'Max Creative Freedom' }
                                ].map((mode) => (
                                    <button
                                        key={mode.label}
                                        onClick={() => updateSettings({ temperature: mode.val })}
                                        className={`p-3 rounded-lg border text-left transition-all ${temperature === mode.val
                                            ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="text-sm font-bold mb-1">{mode.label}</div>
                                        <div className="text-[10px] opacity-70">{mode.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Bell size={20} className="text-yellow-500" />
                        Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Email Reports</span>
                            <button
                                onClick={() => updateSettings({ notifications: { ...notifications, email: !notifications.email } })}
                                className={`w-10 h-6 rounded-full relative transition-colors ${notifications.email ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications.email ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Push Notifications</span>
                            <button
                                onClick={() => updateSettings({ notifications: { ...notifications, push: !notifications.push } })}
                                className={`w-10 h-6 rounded-full relative transition-colors ${notifications.push ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications.push ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button
                    onClick={() => {
                        // Persist via store (which handles localstorage) + optional DB sync
                        // For now store handles it via persist middleware
                        const btn = document.getElementById('save-btn');
                        if (btn) btn.innerText = 'Saved!';
                        setTimeout(() => { if (btn) btn.innerText = 'Save Configuration'; }, 2000);
                    }}
                    id="save-btn"
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};
