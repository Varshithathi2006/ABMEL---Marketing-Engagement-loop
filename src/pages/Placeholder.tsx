import { Construction } from 'lucide-react';

export const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
        <Construction size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">{title}</h2>
        <p className="text-sm">This module is under development.</p>
    </div>
);
