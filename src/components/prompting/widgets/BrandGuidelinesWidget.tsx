import { useState } from 'react';
import { Upload, FileText, Check } from 'lucide-react';
import clsx from 'clsx';
// TiltCard Removed

export const BrandGuidelinesWidget = ({ onComplete }: { onComplete: (data: any) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsUploading(true);

        // Simulate processing / Real upload logic
        try {
            await new Promise(r => setTimeout(r, 1500)); // Fake parse time
            setIsUploading(false);
        } catch (err) {
            setIsUploading(false);
        }
    };

    const confirmUpload = () => {
        if (!file) return;
        setIsCompleted(true);
        onComplete({
            text: "Parsed Brand Guidelines",
            fileName: file.name,
            file: file
        });
    };

    if (isCompleted) {
        return (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Check size={14} />
                </div>
                <div className="text-sm text-slate-200 font-medium">
                    Brand Guidelines Uploaded <span className="text-slate-500 ml-2">({file?.name})</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">

                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    Campaign Guardrails
                </h2>
                <p className="text-sm text-slate-500 mb-6">Upload your brand guidelines or strategy guardrails to align the AI Agents.</p>

                <div className="relative">
                    <div className={clsx(
                        "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors",
                        isUploading ? "border-blue-500/50 bg-blue-500/5" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
                    )}>
                        <input
                            type="file"
                            accept=".pdf,.txt,.md,.doc,.docx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            disabled={isUploading}
                        />

                        <div className="mb-4">
                            {isUploading ? (
                                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : file ? (
                                <FileText className="w-10 h-10 text-blue-500 mx-auto" />
                            ) : (
                                <Upload className="w-10 h-10 text-slate-600 mx-auto" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-slate-200">
                                {file ? file.name : "Click to upload guardrails or drag and drop"}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isUploading ? "Digesting guardrails..." : "PDF, DOC, TXT, MD (Max 10MB)"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                        onClick={() => onComplete({ skipped: true })}
                        className="text-slate-500 hover:text-slate-300 text-sm font-medium px-2 py-2"
                    >
                        Skip for now
                    </button>

                    <button
                        onClick={confirmUpload}
                        disabled={!file || isUploading}
                        className={clsx(
                            "px-6 py-2 rounded-md text-sm font-semibold transition-all shadow-sm",
                            (!file || isUploading)
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-500"
                        )}
                    >
                        Confirm Upload
                    </button>
                </div>
            </div>
        </div>
    );
};
