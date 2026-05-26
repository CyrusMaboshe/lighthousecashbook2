
import React, { useState } from 'react';
import {
    FileText, Edit2, Save, X, Building2, Wallet,
    Users, LogOut, Star, TrendingUp, ShieldCheck,
    Rocket, Sparkles, BookOpen, Clock, Target,
    Receipt, WalletCards, Briefcase, UserCheck,
    Shield, CheckCircle2, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { useCorePlan } from '@/hooks/useCorePlan';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function CorePlanView() {
    const { plan, loading, updatePlan } = useCorePlan();
    const { currentUser, isAdmin } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    const handleEdit = () => {
        setEditContent(plan?.content || '');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (await updatePlan(editContent, currentUser?.username || 'Admin')) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    if (loading && !plan) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-white/10 p-8 sm:p-12 mb-8">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="w-12 h-12 text-blue-400/20 animate-pulse" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-blue-400 font-bold tracking-wider uppercase text-xs">Operational Blueprint</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            2026 Core Operating Plan
                        </h1>
                        <p className="text-slate-400 max-w-2xl leading-relaxed">
                            The strategic framework and governance policies for Lighthouse Media. Designed for transparency, growth, and team unity.
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex-shrink-0">
                            {!isEditing ? (
                                <Button
                                    onClick={handleEdit}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl px-6 py-6 h-auto flex gap-2 group transition-all"
                                >
                                    <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Edit Plan
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        className="bg-emerald-500/80 hover:bg-emerald-500 text-white border border-emerald-400/30 rounded-2xl px-6"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="ghost"
                                        className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl px-4"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isEditing ? (
                <Card className="glass-card overflow-hidden rounded-3xl border-white/10">
                    <CardContent className="p-6">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[600px] glass-input font-mono text-sm leading-relaxed p-6"
                            placeholder="Enter the operating plan in Markdown format..."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Quick Info Sidebar (Desktop Only) */}
                    <div className="hidden md:block md:col-span-3 space-y-4">
                        <div className="glass-card rounded-2xl p-4 border-white/10">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Key Principles</h3>
                            <div className="space-y-3">
                                <PrincipleItem icon={ShieldCheck} label="Studio Unity" />
                                <PrincipleItem icon={Briefcase} label="Business-First" />
                                <PrincipleItem icon={Target} label="Effort-Based" />
                                <PrincipleItem icon={WalletCards} label="Financial Discipline" />
                                <PrincipleItem icon={UserCheck} label="Accountability" />
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-4 border-white/10 bg-blue-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-blue-400 font-bold uppercase">Cycle Focus</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                "Save without mercy until the mission is accomplished."
                            </p>
                        </div>
                    </div>

                    {/* Main Plan Content */}
                    <div className="md:col-span-9 space-y-8">
                        <div className="glass-card rounded-[32px] p-6 sm:p-10 border-white/10 shadow-2xl relative overflow-hidden">
                            {/* Background detail */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-50" />

                            <div className="prose prose-invert prose-slate max-w-none 
                                prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
                                prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-12 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4
                                prose-h3:text-blue-400 prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-sm
                                prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-lg
                                prose-li:text-slate-400
                                prose-strong:text-emerald-400 prose-strong:font-bold
                                prose-hr:border-white/5
                                prose-table:border prose-table:border-white/5 prose-table:rounded-xl prose-table:overflow-hidden
                                prose-th:bg-white/5 prose-th:p-4 prose-th:text-white prose-th:font-bold
                                prose-td:p-4 prose-td:border-t prose-td:border-white/5
                                ">
                                <div className="font-sans text-slate-300">
                                    <PlanRenderer content={plan?.content || ''} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PrincipleItem({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white group">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">{label}</span>
        </div>
    );
}

// High-end renderer for the core plan
function PlanRenderer({ content }: { content: string }) {
    const sections = content.split('\n---');

    return (
        <div className="space-y-16 py-4">
            {sections.map((section, idx) => (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <SectionRenderer content={section.trim()} />
                </div>
            ))}

            {/* Footer */}
            <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Authorized by Lighthouse Media Leadership</span>
                </div>
                <div className="font-bold tracking-widest uppercase">Effective Year: 2026</div>
            </div>
        </div>
    );
}

function SectionRenderer({ content }: { content: string }) {
    const lines = content.split('\n');

    // Find the first header to use as section title
    const headerLineIndex = lines.findIndex(l => l.trim().startsWith('## '));
    const headerLine = headerLineIndex !== -1 ? lines[headerLineIndex] : null;
    const title = headerLine?.replace('## ', '').replace(/🏢|💰|🤝|🚪|🌟/, '').trim();
    const Icon = getSectionIcon(title || '');

    return (
        <div className="space-y-10">
            {title && (
                <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                    <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-600/20 to-indigo-600/10 flex items-center justify-center border border-white/10 shadow-xl">
                        <Icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">{title}</h2>
                        <div className="flex items-center gap-2">
                            <span className="h-1 w-12 bg-blue-500 rounded-full" />
                            <span className="h-1 w-4 bg-white/20 rounded-full" />
                            <span className="h-1 w-1 bg-white/10 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {lines.map((line, i) => {
                    const trimmedLine = line.trim();

                    // Don't render the line we used for the section title
                    if (i === headerLineIndex) return null;
                    if (!trimmedLine) return null;

                    // Handle document title (# )
                    if (trimmedLine.startsWith('# ')) {
                        return (
                            <div key={i} className="py-6 border-b border-white/5 mb-10">
                                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-400">
                                    {trimmedLine.replace('# ', '').replace(/\*\*/g, '')}
                                </h1>
                            </div>
                        );
                    }

                    if (trimmedLine.startsWith('### ')) {
                        return (
                            <h3 key={i} className="text-xl font-black text-white mt-12 mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                {trimmedLine.replace('### ', '').replace(/\*\*/g, '')}
                            </h3>
                        );
                    }

                    // Financial metrics detection (Key: Value)
                    if (trimmedLine.startsWith('**') && (trimmedLine.includes(':') || trimmedLine.includes(' - '))) {
                        const separator = trimmedLine.includes(':') ? ':' : ' - ';
                        const parts = trimmedLine.split(separator);
                        const label = parts[0].replace(/\*\*/g, '').trim();
                        const value = parts.slice(1).join(separator).trim();

                        return (
                            <div key={i} className="glass-card-static bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-blue-400 font-black uppercase text-[10px] tracking-[0.2em] block mb-2">{label}</span>
                                <span className="text-white text-lg font-medium leading-relaxed block">{value}</span>
                            </div>
                        );
                    }

                    // List items
                    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                        return (
                            <div key={i} className="flex gap-4 p-5 rounded-2xl hover:bg-white/5 transition-all text-slate-400 group border border-transparent hover:border-white/5">
                                <div className="mt-1">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                </div>
                                <span className="text-lg leading-relaxed group-hover:text-slate-200 transition-colors"
                                    dangerouslySetInnerHTML={{
                                        __html: trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                                    }}
                                />
                            </div>
                        );
                    }

                    // Table renderer (enhanced)
                    if (trimmedLine.startsWith('|')) {
                        if (trimmedLine.includes('---')) return null;
                        const cells = trimmedLine.split('|').filter(c => c.trim() !== '');
                        const tableLines = lines.filter(l => l.trim().startsWith('|'));
                        const isHeader = i === lines.indexOf(tableLines[0]);

                        return (
                            <div key={i} className={cn(
                                "grid gap-4 p-5",
                                cells.length === 4 ? "grid-cols-4" : cells.length === 3 ? "grid-cols-3" : "grid-cols-1",
                                isHeader ? "bg-white/10 rounded-t-[20px] border-x border-t border-white/10" : "bg-white/5 border-x border-b border-white/10 last:rounded-b-[20px]",
                            )}>
                                {cells.map((cell, ci) => (
                                    <span key={ci} className={cn(
                                        "text-sm",
                                        isHeader ? "font-black text-white uppercase tracking-wider" : "text-slate-300 font-medium"
                                    )}>
                                        {cell.trim()}
                                    </span>
                                ))}
                            </div>
                        );
                    }

                    // Paragraphs
                    return (
                        <p key={i} className="text-slate-400 text-lg leading-relaxed py-3 px-2"
                            dangerouslySetInnerHTML={{
                                __html: trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function getSectionIcon(title: string) {
    const t = title.toLowerCase();
    if (t.includes('structure')) return Building2;
    if (t.includes('financial')) return Wallet;
    if (t.includes('team')) return Users;
    if (t.includes('exit')) return LogOut;
    if (t.includes('principles')) return Star;
    return Info;
}

// Keep these for potential future use or manual components
function CardItem({ title, icon: Icon, children, color = "blue" }: { title: string, icon: any, children: React.ReactNode, color?: string }) {
    const colorClasses: any = {
        blue: "from-blue-500/20 to-indigo-500/10 border-blue-500/20",
        emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20",
        amber: "from-amber-500/20 to-orange-500/10 border-amber-500/20",
        rose: "from-rose-500/20 to-pink-500/10 border-rose-500/20"
    };

    const iconClasses: any = {
        blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        rose: "bg-rose-500/20 text-rose-400 border-rose-500/30"
    };

    return (
        <div className={cn("glass-card rounded-[24px] border p-6 bg-gradient-to-br", colorClasses[color])}>
            <div className="flex items-center gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", iconClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <div className="space-y-2 text-slate-400 leading-relaxed">
                {children}
            </div>
        </div>
    );
}

function FinancialMetric({ label, value, subtext }: { label: string, value: string, subtext?: string }) {
    return (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-1 hover:border-white/20 transition-all">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">{label}</span>
            <span className="text-2xl font-black text-white">{value}</span>
            {subtext && <span className="text-[10px] text-emerald-400 font-bold">{subtext}</span>}
        </div>
    );
}
