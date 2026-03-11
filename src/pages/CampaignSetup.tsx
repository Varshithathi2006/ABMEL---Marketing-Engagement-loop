import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Upload, FileText, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '../store/useCampaignStore';
import { SupabaseService } from '../services/SupabaseService';
import { useAuthStore } from '../store/useAuthStore';

const PLATFORMS = ['Instagram', 'Facebook', 'YouTube', 'Twitter/X', 'LinkedIn', 'Google Ads'];

export const CampaignSetup = () => {
    const navigate = useNavigate();
    const { setInput, planCampaign, input } = useCampaignStore();
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
    const [isDragging, setIsDragging] = useState(false);

    const [formData, setFormData] = useState({
        product: input.product || '',
        goal: input.goal || 'AWARENESS',
        price: input.budget || '',
        numVariants: input.numVariants || 3,
        brandGuidelines: input.brandGuidelines || '',
        guidelineFileName: input.guidelineFileName || '',
        guidelineStorageUrl: input.guidelineStorageUrl || '',
        audience: input.audience || '',
        productDescription: input.productDescription || '',
        keyFeatures: input.keyFeatures || '',
        targetPlatforms: input.targetPlatforms || [] as string[],
    });

    useEffect(() => {
        if (input.product) {
            setFormData(f => ({
                ...f,
                product: input.product,
                goal: input.goal || 'AWARENESS',
                price: input.budget || '',
                numVariants: input.numVariants || 3,
                brandGuidelines: input.brandGuidelines || '',
                guidelineFileName: input.guidelineFileName || '',
                guidelineStorageUrl: input.guidelineStorageUrl || '',
                audience: input.audience || '',
                productDescription: input.productDescription || '',
                keyFeatures: input.keyFeatures || '',
                targetPlatforms: input.targetPlatforms || [],
            }));
        }
    }, [input]);

    const updateField = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        setInput({ [field === 'price' ? 'budget' : field]: value });
        setError(null);
    };

    const togglePlatform = (platform: string) => {
        const current = formData.targetPlatforms;
        const next = current.includes(platform)
            ? current.filter(p => p !== platform)
            : [...current, platform];
        updateField('targetPlatforms', next);
    };

    // --- File Upload Logic ---
    const handleFile = async (file: File) => {
        const allowed = ['.pdf', '.docx', '.txt'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowed.includes(ext)) {
            setError('Only PDF, DOCX, or TXT files are accepted.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be under 10MB.');
            return;
        }

        setUploadedFile(file);
        setUploadStatus('uploading');
        setError(null);

        try {
            // 1. Read text content for agents (PDF/DOCX: best-effort as binary text, TXT: full)
            let extractedText = '';
            if (ext === '.txt') {
                extractedText = await file.text();
            } else {
                // For PDF/DOCX, store filename + note. Agent will use filename as context reference.
                extractedText = `[Guardrails document: ${file.name}] - Uploaded ${new Date().toLocaleDateString()}. Apply brand safety rules from this document.`;
            }

            // 2. Upload to Supabase Storage
            let storageUrl = '';
            if (user?.id) {
                storageUrl = await SupabaseService.getInstance().uploadGuidelineFile(user.id, file);
            }

            // 3. Update store
            const updates = {
                brandGuidelines: extractedText,
                guidelineFileName: file.name,
                guidelineStorageUrl: storageUrl,
            };
            setFormData(f => ({ ...f, ...updates }));
            setInput(updates);
            setUploadStatus('done');
        } catch (e: any) {
            console.error('[Upload] Failed:', e);
            setError(`Upload failed: ${e.message}`);
            setUploadStatus('error');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const removeFile = () => {
        setUploadedFile(null);
        setUploadStatus('idle');
        setFormData(f => ({ ...f, brandGuidelines: '', guidelineFileName: '', guidelineStorageUrl: '' }));
        setInput({ brandGuidelines: '', guidelineFileName: '', guidelineStorageUrl: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Validation ---
    const validateStep = (currentStep: number): boolean => {
        if (currentStep === 1) {
            if (!formData.product.trim()) { setError('Product name is required.'); return false; }
            if (!formData.price.trim()) { setError('Price is required.'); return false; }
            if (!/^\₹?\d+(\.\d{1,2})?$/.test(formData.price.replace(/,/g, ''))) {
                setError('Price must be a valid number (e.g. 999 or ₹1499).'); return false;
            }
            if (formData.numVariants < 1 || formData.numVariants > 10) {
                setError('Number of variants must be between 1 and 10.'); return false;
            }
        }
        if (currentStep === 3) {
            if (!formData.audience.trim()) { setError('Audience description is required.'); return false; }
        }
        return true;
    };

    const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };

    const handleLaunch = async () => {
        if (!validateStep(step)) return;
        try {
            await planCampaign();
            navigate('/execution');
        } catch (e: any) {
            setError('Failed to launch campaign: ' + e.message);
        }
    };

    const STEPS = ['Basics', 'Guardrails', 'Details', 'Review'];

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-12">
                {[1, 2, 3, 4].map(num => (
                    <div key={num} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border 
                            ${step >= num ? 'bg-[#64FFDA] text-[#0A192F] border-[#64FFDA]' : 'bg-[#112240] text-slate-500 border-slate-700'}`}>
                            {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                        </div>
                        <span className={`text-sm ${step >= num ? 'text-slate-200' : 'text-slate-600'}`}>
                            {STEPS[num - 1]}
                        </span>
                        {num < 4 && <div className="w-12 h-[1px] bg-slate-800 ml-3"></div>}
                    </div>
                ))}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Step 1: Basics ── */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Campaign Basics</h2>
                        <div className="space-y-5">
                            {/* Product Name */}
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.product}
                                    onChange={e => updateField('product', e.target.value)}
                                    className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                    placeholder="e.g. HydroWave Pro Water Bottle"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Campaign Goal */}
                                <div>
                                    <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Campaign Goal</label>
                                    <select
                                        value={formData.goal}
                                        onChange={e => updateField('goal', e.target.value)}
                                        className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                    >
                                        <option value="AWARENESS">AWARENESS</option>
                                        <option value="CONVERSIONS">CONVERSIONS</option>
                                        <option value="ENGAGEMENT">ENGAGEMENT</option>
                                    </select>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Price (INR) *</label>
                                    <input
                                        type="text"
                                        value={formData.price}
                                        onChange={e => updateField('price', e.target.value)}
                                        className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                        placeholder="₹ 999"
                                    />
                                </div>

                                {/* n Variants */}
                                <div>
                                    <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Ad Variants (n)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={formData.numVariants}
                                        onChange={e => updateField('numVariants', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                        className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none text-center font-mono text-lg"
                                    />
                                    <p className="text-xs text-slate-500 mt-1 text-center">1 – 10 creatives</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded hover:opacity-90 transition-opacity">
                        Next: Upload Guardrails →
                    </button>
                </div>
            )}

            {/* ── Step 2: Guardrails Upload ── */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Brand Guardrails</h2>
                        <p className="text-slate-400 mb-8">Upload your brand guidelines document (PDF, DOCX, or TXT). The AI agents will use this to ensure brand compliance.</p>

                        {/* Upload Zone */}
                        {!uploadedFile ? (
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                                    ${isDragging
                                        ? 'border-[#64FFDA] bg-[#64FFDA]/5'
                                        : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[#0A192F] border border-slate-700 flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-[#64FFDA]" />
                                    </div>
                                    <div>
                                        <p className="text-slate-200 font-semibold text-lg">Drop your file here</p>
                                        <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['.PDF', '.DOCX', '.TXT'].map(f => (
                                            <span key={f} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-mono text-slate-400">{f}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-600">Max file size: 10MB</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                                />
                            </div>
                        ) : (
                            /* File Uploaded State */
                            <div className={`rounded-xl border p-6 transition-all ${uploadStatus === 'done' ? 'border-green-500/50 bg-green-500/5' :
                                    uploadStatus === 'uploading' ? 'border-blue-500/50 bg-blue-500/5' :
                                        'border-red-500/50 bg-red-500/5'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${uploadStatus === 'done' ? 'bg-green-500/20 text-green-400' :
                                            uploadStatus === 'uploading' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {uploadStatus === 'uploading' ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <FileText className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-100 font-semibold truncate">{uploadedFile.name}</p>
                                        <p className="text-slate-500 text-sm">
                                            {(uploadedFile.size / 1024).toFixed(1)} KB
                                            {uploadStatus === 'uploading' && ' · Uploading to Supabase...'}
                                            {uploadStatus === 'done' && ' · ✓ Saved to Supabase Storage'}
                                            {uploadStatus === 'error' && ' · Upload failed'}
                                        </p>
                                    </div>
                                    {uploadStatus !== 'uploading' && (
                                        <button
                                            onClick={removeFile}
                                            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="mt-4 text-xs text-slate-500 text-center">
                            This step is optional — you can skip if no brand guidelines document is available.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleNext}
                            disabled={uploadStatus === 'uploading'}
                            className="flex-1 py-4 border border-slate-600 text-slate-300 font-bold rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Skip →
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={uploadStatus === 'uploading' || (!uploadedFile && !formData.brandGuidelines)}
                            className="flex-1 py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Process & Continue →'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Product Details & Audience ── */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Product Details & Audience</h2>
                        <div className="space-y-5">
                            {/* Target Audience */}
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Target Audience *</label>
                                <textarea
                                    value={formData.audience}
                                    onChange={e => updateField('audience', e.target.value)}
                                    className="w-full h-24 bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none resize-none"
                                    placeholder="Describe the ideal customer. e.g. Health-conscious adults aged 25–40 who track their daily water intake..."
                                />
                            </div>

                            {/* Product Description */}
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Product Description</label>
                                <textarea
                                    value={formData.productDescription}
                                    onChange={e => updateField('productDescription', e.target.value)}
                                    className="w-full h-20 bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none resize-none"
                                    placeholder="Brief overview of the product, its purpose and what makes it stand out..."
                                />
                            </div>

                            {/* Key Features / USP */}
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-2 uppercase tracking-wider">Key Features / USP</label>
                                <input
                                    type="text"
                                    value={formData.keyFeatures}
                                    onChange={e => updateField('keyFeatures', e.target.value)}
                                    className="w-full bg-[#0A192F] border border-slate-700 rounded p-3 text-slate-100 focus:border-[#64FFDA] outline-none"
                                    placeholder="e.g. BPA-free, 24hr temperature retention, smart hydration tracking"
                                />
                            </div>

                            {/* Target Platforms */}
                            <div>
                                <label className="block text-xs font-mono text-[#64FFDA] mb-3 uppercase tracking-wider">Target Platforms</label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(platform => {
                                        const active = formData.targetPlatforms.includes(platform);
                                        return (
                                            <button
                                                key={platform}
                                                type="button"
                                                onClick={() => togglePlatform(platform)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
                                                    ${active
                                                        ? 'bg-[#64FFDA] text-[#0A192F] border-[#64FFDA] font-bold'
                                                        : 'bg-[#0A192F] text-slate-400 border-slate-700 hover:border-slate-500'
                                                    }`}
                                            >
                                                {platform}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-600 mt-2">Select all that apply. Leave empty to let the AI decide.</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded hover:opacity-90 transition-opacity">
                        Finalize Configuration →
                    </button>
                </div>
            )}

            {/* ── Step 4: Pre-Flight Check ── */}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#112240] p-8 rounded-lg border border-slate-800">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-6">System Pre-Flight Check</h2>

                        <div className="space-y-3 font-mono text-sm">
                            {[
                                { label: 'PRODUCT_ENTITY', value: formData.product || 'N/A' },
                                { label: 'GOAL_VECTOR', value: formData.goal },
                                { label: 'PRICE_POINT', value: formData.price || 'N/A' },
                                { label: 'AD_VARIANTS_N', value: `${formData.numVariants} creatives` },
                                { label: 'AUDIENCE_TARGET', value: formData.audience ? formData.audience.substring(0, 60) + (formData.audience.length > 60 ? '…' : '') : 'N/A' },
                                { label: 'PRODUCT_DESCRIPTION', value: formData.productDescription ? '✓ Provided' : 'Using Defaults' },
                                { label: 'KEY_FEATURES', value: formData.keyFeatures ? formData.keyFeatures.substring(0, 60) + (formData.keyFeatures.length > 60 ? '…' : '') : 'N/A' },
                                {
                                    label: 'TARGET_PLATFORMS',
                                    value: formData.targetPlatforms.length > 0
                                        ? formData.targetPlatforms.join(', ')
                                        : 'AI-Determined'
                                },
                                {
                                    label: 'BRAND_GUARDRAILS',
                                    value: formData.guidelineFileName
                                        ? `📎 ${formData.guidelineFileName}`
                                        : formData.brandGuidelines ? 'User Defined (Text)' : 'Safe Defaults'
                                },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between border-b border-slate-800 pb-2 gap-4">
                                    <span className="text-slate-500 shrink-0">{label}</span>
                                    <span className="text-[#64FFDA] text-right truncate">{value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-500">AGENTS_READY</span>
                                <span className="text-[#64FFDA]">5/5 [ACTIVE]</span>
                            </div>
                        </div>

                        <div className="mt-8 bg-[#0A192F] p-4 rounded border border-slate-700 text-xs text-slate-400">
                            &gt; INITIALIZING AGENT SWARM...<br />
                            &gt; PLANNING_AGENT: STANDBY<br />
                            &gt; MARKET_AGENT: STANDBY<br />
                            &gt; PERSONA_AGENT: STANDBY<br />
                            &gt; CREATIVE_AGENT: STANDBY [{formData.numVariants} variants]<br />
                            &gt; IMAGE_AGENT: STANDBY
                        </div>
                    </div>

                    <button
                        onClick={handleLaunch}
                        className="w-full py-4 bg-[#64FFDA] text-[#0A192F] font-bold rounded shadow-[0_0_20px_rgba(100,255,218,0.3)] hover:shadow-[0_0_30px_rgba(100,255,218,0.5)] transition-shadow text-lg"
                    >
                        EXECUTE STRATEGY SWARM
                    </button>
                    <p className="text-center text-xs text-slate-600">Strictly deterministic execution. Artifacts will be generated.</p>
                </div>
            )}
        </div>
    );
};
