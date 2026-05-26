import React, { useState, useEffect } from 'react';
import { Plus, Building2, Shield, Settings, Activity, Globe, Lock, Search, Filter, MoreVertical, CheckCircle2, AlertCircle, Users, Mail, UserPlus, Briefcase, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TenantManager, CompanyCreateInput } from '@/services/TenantManager';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { GlassAppShell, GlassView } from '../glass-ui/GlassAppShell';
import { GlassViewWrapper } from '../glass-ui/GlassViewWrapper';
import '../glass-ui/GlassTheme.css';

export function RebuiltSuperAdminDashboard() {
    const { role } = useTenant();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('deployments');
    const [currentView, setCurrentView] = useState<GlassView>('infrastructure');
    const [companies, setCompanies] = useState<any[]>([]);
    const [tenantAdmins, setTenantAdmins] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newCompany, setNewCompany] = useState<CompanyCreateInput>({
        name: '',
        tenant_id: '',
        admin_email: ''
    });

    const [assignment, setAssignment] = useState({
        userEmail: '',
        companyId: ''
    });

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [comps, admins] = await Promise.all([
                TenantManager.listCompanies(),
                TenantManager.listTenantAdmins()
            ]);
            setCompanies(comps || []);
            setTenantAdmins(admins || []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast({
                title: "Sync Error",
                description: "Failed to load platform data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleAssignAdmin = async () => {
        if (!assignment.userEmail || !assignment.companyId) {
            toast({
                title: "Validation Error",
                description: "Email and Company are required.",
                variant: "destructive",
            });
            return;
        }

        setIsAdminLoading(true);
        try {
            const { data: userData, error: userError } = await supabase
                .from('rebuilt_profiles')
                .select('id')
                .eq('email', assignment.userEmail)
                .single();

            if (userError || !userData) {
                throw new Error("User not found. Please ensure the user has signed up first.");
            }

            await TenantManager.assignTenantAdmin(userData.id, assignment.companyId);

            toast({
                title: "Admin Assigned",
                description: `Successfully linked ${assignment.userEmail} as a business super admin.`,
            });
            setIsAssignDialogOpen(false);
            setAssignment({ userEmail: '', companyId: '' });
            loadDashboardData();
        } catch (error: any) {
            toast({
                title: "Assignment Failed",
                description: error.message || "Failed to link admin.",
                variant: "destructive",
            });
        } finally {
            setIsAdminLoading(false);
        }
    };

    const handleCreateCompany = async () => {
        if (!newCompany.name || !newCompany.tenant_id) {
            toast({
                title: "Validation Error",
                description: "Name and Tenant ID are required.",
                variant: "destructive",
            });
            return;
        }

        try {
            await TenantManager.createCompany(newCompany);
            toast({
                title: "Success",
                description: `Company ${newCompany.name} created successfully.`,
            });
            setIsCreateDialogOpen(false);
            setNewCompany({ name: '', tenant_id: '', admin_email: '' });
            loadDashboardData();
        } catch (error: any) {
            toast({
                title: "Error Creating Company",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const toggleStatus = async (company: any) => {
        const newStatus = company.status === 'active' ? 'inactive' : 'active';
        try {
            await TenantManager.toggleCompanyStatus(company.id, newStatus);
            toast({
                title: "Status Updated",
                description: `${company.name} is now ${newStatus}.`,
            });
            loadDashboardData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tenant_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAdmins = tenantAdmins.filter(a =>
        a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const renderDashboardContent = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Instances" value={companies.length} icon={<Building2 className="h-5 w-5" />} trend="+1 this month" />
                <StatCard title="Business Admins" value={tenantAdmins.length} icon={<Shield className="h-5 w-5" />} sub="Platform Super Admins" />
                <StatCard title="Auth Protocols" value="Supabase" icon={<Lock className="h-5 w-5" />} sub="JWT + RLS Active" />
                <StatCard title="Platform Scope" value="Global" icon={<Globe className="h-5 w-5" />} sub="Multi-tenant core" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto">
                        <TabsTrigger value="deployments" className="px-6 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <Building2 className="mr-2 h-4 w-4" />
                            Deployments
                        </TabsTrigger>
                        <TabsTrigger value="admins" className="px-6 py-3 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <Shield className="mr-2 h-4 w-4" />
                            Company Admin's Management
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2 w-full sm:w-auto">
                        {activeTab === 'deployments' ? (
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="glass-btn-primary flex-1 sm:flex-none">
                                        <Plus className="mr-2 h-5 w-5" />
                                        Launch Company
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f172a] border-white/10 text-white backdrop-blur-2xl rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold">New Company Instance</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Deploy a new isolated environment for a client.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Company Name</Label>
                                            <Input
                                                id="name"
                                                value={newCompany.name}
                                                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                                placeholder="e.g. Acme Corp"
                                                className="glass-input"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tenant_id" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tenant ID (Slug)</Label>
                                            <Input
                                                id="tenant_id"
                                                value={newCompany.tenant_id}
                                                onChange={(e) => setNewCompany({ ...newCompany, tenant_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                placeholder="e.g. acme-corp"
                                                className="glass-input"
                                            />
                                            <p className="text-[10px] text-slate-500 font-mono mt-1">Unique identifier: {newCompany.tenant_id || '...'}</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Admin Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newCompany.admin_email}
                                                onChange={(e) => setNewCompany({ ...newCompany, admin_email: e.target.value })}
                                                placeholder="admin@acme.com"
                                                className="glass-input"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
                                        <Button onClick={handleCreateCompany} className="glass-btn-primary">Initialize Instance</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="glass-btn-primary flex-1 sm:flex-none">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Appoint Admin
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f172a] border-white/10 text-white backdrop-blur-2xl rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold">Appoint Company Admin</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Grant Super Admin privileges to a user for a specific business.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <Label className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">User Email</Label>
                                            <Input
                                                placeholder="admin@example.com"
                                                value={assignment.userEmail}
                                                onChange={(e) => setAssignment({ ...assignment, userEmail: e.target.value })}
                                                className="glass-input"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Target Business</Label>
                                            <Select
                                                value={assignment.companyId}
                                                onValueChange={(val) => setAssignment({ ...assignment, companyId: val })}
                                            >
                                                <SelectTrigger className="glass-input h-14">
                                                    <SelectValue placeholder="Select Business..." />
                                                </SelectTrigger>
                                                <SelectContent className="glass-select-content">
                                                    {companies.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="glass-select-item">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="text-slate-400">Cancel</Button>
                                        <Button
                                            onClick={handleAssignAdmin}
                                            disabled={isAdminLoading}
                                            className="glass-btn-primary"
                                        >
                                            {isAdminLoading ? 'Syncing...' : 'Confirm Appointment'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                        placeholder={`Filter ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 glass-input text-lg"
                    />
                </div>

                <TabsContent value="deployments" className="m-0">
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">Company Name</th>
                                        <th className="px-8 py-5">Tenant ID</th>
                                        <th className="px-8 py-5">Principal Admin</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing infrastructure data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCompanies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-medium">
                                                No active instances found matching your search.
                                            </td>
                                        </tr>
                                    ) : filteredCompanies.map((company) => (
                                        <tr key={company.id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shadow-lg">
                                                        <Building2 className="h-5 w-5 text-blue-400" />
                                                    </div>
                                                    <span className="font-bold text-white text-lg">{company.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <code className="text-xs font-black bg-white/5 px-2 py-1 rounded-lg text-blue-400 border border-white/10">
                                                    {company.tenant_id}
                                                </code>
                                            </td>
                                            <td className="px-8 py-6 text-slate-300 text-sm font-semibold">
                                                {company.admin_email || 'Unassigned'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className={`rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest ${company.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {company.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                                                        onClick={() => toggleStatus(company)}
                                                    >
                                                        {company.status === 'active' ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
                                                        <Settings className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="admins" className="m-0">
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">Administrator</th>
                                        <th className="px-8 py-5">Managed Business</th>
                                        <th className="px-8 py-5">Auth Scope</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing administrative profiles...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredAdmins.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-medium">
                                                No business admins appointed matching your search.
                                            </td>
                                        </tr>
                                    ) : filteredAdmins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-lg">
                                                        <Users className="h-5 w-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-lg">{admin.full_name || 'Legacy Admin'}</p>
                                                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-black uppercase tracking-[0.1em] mt-0.5">
                                                            <Mail className="h-3 w-3" /> {admin.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <Briefcase className="h-4 w-4 text-slate-500" />
                                                    <span className="text-base font-bold text-slate-300">
                                                        {admin.companies?.name || 'Unlinked Business'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                    TENANT_SUPER_ADMIN
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Settings className="h-5 w-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );

    return (
        <GlassAppShell
            currentView={currentView}
            onViewChange={setCurrentView}
            onLogout={handleLogout}
            isAdmin={true}
            companyName="Platform Master"
            username="Super Admin"
            onFabClick={() => setActiveTab('deployments')}
        >
            <GlassViewWrapper title="Infrastructure" subtitle="Global Multi-tenant Management Console">
                {renderDashboardContent()}
            </GlassViewWrapper>
        </GlassAppShell>
    );
}

function StatCard({ title, value, icon, trend, sub }: any) {
    return (
        <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex flex-row items-center justify-between mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</span>
                <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors shadow-sm">
                    {React.cloneElement(icon, { className: "h-5 w-5 text-blue-400" })}
                </div>
            </div>
            <div className="space-y-2">
                <div className="text-4xl font-black text-white leading-none tracking-tight">{value}</div>
                {trend ? (
                    <p className="text-[10px] text-emerald-400 font-black flex items-center gap-1.5 uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" />
                        {trend}
                    </p>
                ) : sub && (
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}
