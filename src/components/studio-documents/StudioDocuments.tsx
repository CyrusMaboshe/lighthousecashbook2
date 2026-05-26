
import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Download,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    FileUp,
    File as FileIcon,
    ChevronRight,
    Presentation,
    Check,
    ArrowLeft,
    ArrowLeftRight,
    ShieldCheck,
    Sparkles,
    Briefcase,
    Layout,
    ArrowRightCircle,
    Zap,
    History
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';

import { studioDocumentsService, StudioDocument } from '@/services/studioDocumentsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export function StudioDocuments() {
    const { isAdmin, currentUser } = useAuth();
    const { toast } = useToast();
    const [documents, setDocuments] = useState<StudioDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'files' | 'editor'>('files');
    const [isEditing, setIsEditing] = useState(false);
    const [currentDoc, setCurrentDoc] = useState<Partial<StudioDocument>>({
        title: '',
        type: 'editor',
        content: { sections: [{ title: '', blocks: [''] }] }
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
        const channel = supabase
            .channel('studio-docs-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'studio_documents' }, () => {
                loadDocuments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await studioDocumentsService.getAll();
            if (data) setDocuments(data);
        } catch (error) {
            toast({ title: "Sync Error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            toast({ title: "Invalid file type", description: "PDF only", variant: "destructive" });
            return;
        }
        try {
            setUploading(true);
            const { publicUrl, fileName, fileSize } = await studioDocumentsService.uploadFile(file);
            await studioDocumentsService.create({
                title: fileName.replace('.pdf', ''),
                type: 'file',
                content: null,
                file_url: publicUrl,
                file_name: fileName,
                file_size: fileSize,
                author_id: currentUser?.id as string
            });
            toast({ title: "Success", description: "File uploaded" });
            loadDocuments();
        } catch (error) {
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveEditorDoc = async () => {
        if (!currentDoc.title) {
            toast({ title: "Error", description: "Title required", variant: "destructive" });
            return;
        }
        try {
            if (currentDoc.id) {
                await studioDocumentsService.update(currentDoc.id, currentDoc);
                toast({ title: "Success" });
            } else {
                await studioDocumentsService.create({ ...currentDoc as any, author_id: currentUser?.id as string });
                toast({ title: "Success" });
            }
            setIsEditing(false);
            loadDocuments();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanent deletion protocol?')) return;
        try {
            await studioDocumentsService.delete(id);
            toast({ title: "Success" });
            loadDocuments();
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    const addSection = () => {
        const sections = [...(currentDoc.content?.sections || [])];
        sections.push({ title: '', blocks: [''] });
        setCurrentDoc({ ...currentDoc, content: { ...currentDoc.content, sections } });
    };

    const updateSectionTitle = (index: number, title: string) => {
        const sections = [...(currentDoc.content?.sections || [])];
        sections[index].title = title;
        setCurrentDoc({ ...currentDoc, content: { ...currentDoc.content, sections } });
    };

    const updateBlock = (sIndex: number, bIndex: number, text: string) => {
        const sections = [...(currentDoc.content?.sections || [])];
        sections[sIndex].blocks[bIndex] = text;
        setCurrentDoc({ ...currentDoc, content: { ...currentDoc.content, sections } });
    };

    const addBlock = (sIndex: number) => {
        const sections = [...(currentDoc.content?.sections || [])];
        sections[sIndex].blocks.push('');
        setCurrentDoc({ ...currentDoc, content: { ...currentDoc.content, sections } });
    };

    if (isEditing) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="glass-card p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-6">
                                <Button variant="ghost" onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-0 text-slate-400 hover:text-white">
                                    <ArrowLeft className="w-6 h-6" />
                                </Button>
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1">Editor Terminal</p>
                                    {isAdmin ? (
                                        <Input
                                            className="text-4xl font-black bg-transparent border-none border-b border-white/10 rounded-none focus-visible:ring-0 px-0 h-auto text-white placeholder:text-white/20"
                                            placeholder="Untitled Document..."
                                            value={currentDoc.title}
                                            onChange={(e) => setCurrentDoc({ ...currentDoc, title: e.target.value })}
                                        />
                                    ) : (
                                        <h1 className="text-4xl font-black text-white tracking-tight">{currentDoc.title}</h1>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isAdmin && (
                            <Button onClick={handleSaveEditorDoc} className="glass-btn-primary h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">
                                <Save className="w-4 h-4 mr-2" /> Sync Document
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-8 max-w-4xl mx-auto pb-32">
                    {(currentDoc.content?.sections || []).map((section: any, sIndex: number) => (
                        <div key={sIndex} className="glass-card p-8 space-y-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${sIndex * 100}ms` }}>
                            {isAdmin ? (
                                <Input
                                    className="text-xl font-black bg-transparent border-none border-b border-white/5 rounded-none focus-visible:ring-0 px-0 text-blue-400 placeholder:text-blue-400/20"
                                    placeholder="Section Vector (e.g. MISSION OVERVIEW)"
                                    value={section.title}
                                    onChange={(e) => updateSectionTitle(sIndex, e.target.value)}
                                />
                            ) : (
                                <h3 className="text-xl font-black text-blue-400 uppercase tracking-tight italic border-b border-white/5 pb-4">{section.title}</h3>
                            )}
                            <div className="space-y-6">
                                {(section.blocks || []).map((block: string, bIndex: number) => (
                                    <div key={bIndex} className="group relative">
                                        {isAdmin ? (
                                            <Textarea
                                                className="min-h-[120px] glass-input py-6 text-lg font-medium leading-relaxed bg-white/[0.02]"
                                                placeholder="Decrypt content here..."
                                                value={block}
                                                onChange={(e) => updateBlock(sIndex, bIndex, e.target.value)}
                                            />
                                        ) : (
                                            <div className="p-8 bg-white/[0.03] rounded-3xl text-slate-300 text-lg leading-relaxed font-medium border border-white/5 shadow-inner">
                                                {block}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isAdmin && (
                                    <Button variant="ghost" className="w-full h-14 rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest" onClick={() => addBlock(sIndex)}>
                                        <Plus className="w-4 h-4 mr-2" /> Inject Block
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isAdmin && (
                        <Button className="w-full h-20 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/[0.02] text-[11px] font-black uppercase tracking-[0.3em] transition-all" onClick={addSection}>
                            <Plus className="w-5 h-5 mr-3" /> New Section Vector
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="glass-card overflow-hidden p-8 md:p-12 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-4 border border-white/20 shadow-2xl shadow-indigo-500/40">
                                <Briefcase className="w-full h-full text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Intelligence Archive</h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    Official Studio Assets & Governance
                                </p>
                            </div>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <input type="file" id="file-upload" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                            <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading} className="h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">
                                <FileUp className={cn("w-4 h-4 mr-2", uploading && "animate-bounce")} />
                                {uploading ? 'Transmitting...' : 'Upload PDF'}
                            </Button>
                            <Button onClick={() => { setCurrentDoc({ title: '', type: 'editor', content: { sections: [{ title: '', blocks: [''] }] } }); setIsEditing(true); }} className="glass-btn-primary h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4 mr-2" /> Generate Doc
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-1.5 bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/5 flex gap-2 w-fit shadow-inner">
                <button
                    onClick={() => setActiveTab('files')}
                    className={cn(
                        "flex items-center gap-3 px-8 h-12 rounded-2xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest",
                        activeTab === 'files' ? "bg-white/[0.08] text-white border border-white/20" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <FileIcon className="w-4 h-4" /> Personnel Assets
                </button>
                <button
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                        "flex items-center gap-3 px-8 h-12 rounded-2xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest",
                        activeTab === 'editor' ? "bg-white/[0.08] text-white border border-white/20" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Presentation className="w-4 h-4" /> Strategic Blueprints
                </button>
            </div>

            <div className="min-h-[500px]">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <Zap className="w-12 h-12 text-indigo-500 animate-pulse mb-6" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Compiling Archives...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.filter(d => d.type === (activeTab === 'files' ? 'file' : 'editor')).length === 0 ? (
                            <div className="col-span-full py-40 glass-card text-center border-dashed bg-white/[0.01]">
                                <History className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
                                <h3 className="text-xl font-black text-slate-600 uppercase tracking-tighter">Archive Epoch Zero</h3>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2">No records found in this sector</p>
                            </div>
                        ) : (
                            documents.filter(d => d.type === (activeTab === 'files' ? 'file' : 'editor')).map((doc, idx) => (
                                <div
                                    key={doc.id}
                                    onClick={() => doc.type === 'file' ? window.open(doc.file_url!, '_blank') : (setCurrentDoc(doc), setIsEditing(true))}
                                    className="glass-card group p-8 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col border-white/5 animate-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-1000" />

                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 group-hover:rotate-[10deg] shadow-2xl",
                                            doc.type === 'file' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                        )}>
                                            {doc.type === 'file' ? <FileIcon className="w-7 h-7" /> : <Presentation className="w-7 h-7" />}
                                        </div>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-xl font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors line-clamp-2">{doc.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                SEC_LVL_1
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                            {doc.type === 'file' ? `${Math.round((doc.file_size || 0) / 1024)} KB VECTOR` : `${doc.content?.sections?.length || 0} FRAGMENTS`}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 group-hover:translate-x-1">
                                            <ChevronRight className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
