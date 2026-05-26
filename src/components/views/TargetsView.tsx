
import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, TrendingUp, Pencil, Trash2, Clock, Circle, CalendarDays, MoreVertical, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TargetItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface TodoItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export function TargetsView() {
  const { currentUser, isAdmin } = useAuth();
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showTodoDialog, setShowTodoDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [updatingTarget, setUpdatingTarget] = useState<TargetItem | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<string>('0');
  const [manualPercentage, setManualPercentage] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [viewingTarget, setViewingTarget] = useState<TargetItem | null>(null);
  const [showTargetDetailsDialog, setShowTargetDetailsDialog] = useState(false);

  const [targetForm, setTargetForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: '',
    category: 'Revenue'
  });

  const [todoForm, setTodoForm] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchData();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [currentUser?.id]);

  const fetchData = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const [targetsRes, todosRes] = await Promise.all([
        supabase.from('user_targets').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('user_todos').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
      ]);

      if (targetsRes.data) {
        setTargets(targetsRes.data);
      }

      if (todosRes.data) setTodos(todosRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load targets and tasks');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser?.id) return;

    const targetsChannel = supabase
      .channel(`user_targets_changes-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_targets', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchData();
      })
      .subscribe();

    const todosChannel = supabase
      .channel(`user_todos_changes-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_todos', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(targetsChannel);
      supabase.removeChannel(todosChannel);
    };
  };

  const handleCreateTarget = async () => {
    if (!currentUser?.id || !targetForm.title || !targetForm.target_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const targetData = {
        user_id: currentUser.id,
        title: targetForm.title,
        description: targetForm.description || null,
        target_amount: Number(targetForm.target_amount),
        current_amount: 0,
        target_date: targetForm.target_date || null,
        category: targetForm.category,
        status: 'active' as const
      };

      if (editingTarget) {
        await supabase.from('user_targets').update(targetData).eq('id', editingTarget.id);
        toast.success('Target updated successfully');
      } else {
        await supabase.from('user_targets').insert(targetData);
        toast.success('Target created successfully');
      }

      setShowTargetDialog(false);
      resetTargetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving target:', error);
      toast.error('Failed to save target');
    }
  };

  const handleCreateTodo = async () => {
    if (!currentUser?.id || !todoForm.title) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const todoData = {
        user_id: currentUser.id,
        title: todoForm.title,
        description: todoForm.description || null,
        priority: todoForm.priority,
        status: editingTodo?.status || ('pending' as const),
        due_date: todoForm.due_date || null
      };

      if (editingTodo) {
        await supabase.from('user_todos').update(todoData).eq('id', editingTodo.id);
        toast.success('Task updated successfully');
      } else {
        await supabase.from('user_todos').insert(todoData);
        toast.success('Task created successfully');
      }

      setShowTodoDialog(false);
      resetTodoForm();
      fetchData();
    } catch (error) {
      console.error('Error saving todo:', error);
      toast.error('Failed to save task');
    }
  };

  const handleToggleTodoStatus = async (todo: TodoItem) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await supabase
        .from('user_todos')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', todo.id);

      fetchData();
      toast.success(newStatus === 'completed' ? 'Task marked as completed' : 'Task marked as pending');
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    // if (!confirm('Are you sure you want to delete this target?')) return; // Replaced with immediate action or custom dialog if needed, but keeping standard interaction for now

    try {
      await supabase.from('user_targets').delete().eq('id', targetId);
      toast.success('Target deleted successfully');
      fetchData();
      if (showTargetDetailsDialog) setShowTargetDetailsDialog(false);
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Failed to delete target');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await supabase.from('user_todos').delete().eq('id', todoId);
      toast.success('Task deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    }
  };

  const resetTargetForm = () => {
    setTargetForm({ title: '', description: '', target_amount: '', target_date: '', category: 'Revenue' });
    setEditingTarget(null);
  };

  const resetTodoForm = () => {
    setTodoForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setEditingTodo(null);
  };

  const editTarget = (target: TargetItem) => {
    setEditingTarget(target);
    setTargetForm({
      title: target.title,
      description: target.description || '',
      target_amount: target.target_amount.toString(),
      target_date: target.target_date || '',
      category: target.category
    });
    setShowTargetDialog(true);
    if (showTargetDetailsDialog) setShowTargetDetailsDialog(false);
  };

  const editTodo = (todo: TodoItem) => {
    setEditingTodo(todo);
    setTodoForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || ''
    });
    setShowTodoDialog(true);
  };

  const getProgressPercentage = (target: TargetItem) => {
    if (target.target_amount === 0) return 0;
    return Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
  };

  // Premium progress gradient
  const getProgressGradient = (percentage: number) => {
    if (percentage >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'low': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const handleUpdateProgress = async () => {
    if (!updatingTarget) return;

    // Use manual amount if provided, otherwise calculate from percentage
    const newCurrentAmount = manualAmount
      ? Number(manualAmount)
      : (updatingTarget.target_amount * Number(manualPercentage || selectedProgress)) / 100;

    try {
      await supabase
        .from('user_targets')
        .update({ current_amount: newCurrentAmount })
        .eq('id', updatingTarget.id);

      toast.success('Progress updated successfully');
      setShowProgressDialog(false);
      setUpdatingTarget(null);
      setManualPercentage('');
      setManualAmount('');
      fetchData();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const openProgressDialog = (target: TargetItem) => {
    setUpdatingTarget(target);
    const currentPercentage = getProgressPercentage(target);
    setSelectedProgress(currentPercentage.toString());
    setManualPercentage(currentPercentage.toFixed(1));
    setManualAmount(target.current_amount.toString());
    setShowProgressDialog(true);
  };

  const openTargetDetails = (target: TargetItem) => {
    setViewingTarget(target);
    setShowTargetDetailsDialog(true);
  };

  return (
    <div className="space-y-8 sm:p-2 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-2xl">
              <Target className="h-7 w-7 text-blue-400" />
            </div>
            Targets & Goals
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1 px-1">
            Financial Milestones & Strategic Tasks
          </p>
        </div>

        <div className="flex gap-4 w-full sm:w-auto">
          <Button
            onClick={() => { resetTargetForm(); setShowTargetDialog(true); }}
            className="glass-btn-primary flex-1 sm:flex-none h-14 px-8"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Target
          </Button>
        </div>
      </div>

      <Tabs defaultValue="targets" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto w-full max-w-md">
          <TabsTrigger
            value="targets"
            className="flex-1 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-400 font-bold text-xs uppercase tracking-widest"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Targets
          </TabsTrigger>
          <TabsTrigger
            value="todos"
            className="flex-1 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-slate-400 font-bold text-xs uppercase tracking-widest"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-8 m-0">
          <Tabs defaultValue="ongoing" className="w-full">
            <TabsList className="bg-transparent border-none w-full justify-start rounded-none h-auto p-0 mb-8 flex gap-8">
              <TabsTrigger
                value="ongoing"
                className="rounded-none bg-transparent p-0 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:text-blue-400 data-[state=active]:border-blue-400 pb-2 transition-all"
              >
                Ongoing ({targets.filter(t => t.status !== 'completed' && getProgressPercentage(t) < 100).length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-none bg-transparent p-0 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-transparent data-[state=active]:text-green-400 data-[state=active]:border-green-400 pb-2 transition-all"
              >
                Completed ({targets.filter(t => t.status === 'completed' || getProgressPercentage(t) >= 100).length})
              </TabsTrigger>

            </TabsList>

            <TabsContent value="ongoing" className="space-y-6 m-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing milestones...</p>
                </div>
              ) : targets.filter(t => t.status !== 'completed' && getProgressPercentage(t) < 100).length === 0 ? (
                <div className="glass-card p-20 text-center flex flex-col items-center border-dashed">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <Target className="h-10 w-10 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">No Active Milestones</h3>
                  <p className="text-slate-400 max-w-xs mx-auto mb-8 font-medium">Define your first financial target to begin tracking your growth path.</p>
                  <Button onClick={() => setShowTargetDialog(true)} className="glass-btn-secondary">
                    Initialize Target
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {targets.filter(t => t.status !== 'completed' && getProgressPercentage(t) < 100).map((target) => (
                    <TargetCard
                      key={target.id}
                      target={target}
                      onClick={() => openTargetDetails(target)}
                      percentage={getProgressPercentage(target)}
                      gradient={getProgressGradient(getProgressPercentage(target))}
                      isAdmin={isAdmin}
                      onUpdate={() => openProgressDialog(target)}
                      onEdit={() => editTarget(target)}
                      onDelete={() => handleDeleteTarget(target.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6 m-0">
              {targets.filter(t => t.status === 'completed' || getProgressPercentage(t) >= 100).length === 0 ? (
                <div className="glass-card p-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">No Accomplishments Yet</h3>
                  <p className="text-slate-400 font-medium">Keep pushing! Your completed goals will be archived here.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {targets.filter(t => t.status === 'completed' || getProgressPercentage(t) >= 100).map((target) => (
                    <TargetCard
                      key={target.id}
                      target={target}
                      onClick={() => openTargetDetails(target)}
                      percentage={100}
                      gradient="bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"

                      isAdmin={isAdmin}
                      isCompleted={true}
                      onEdit={() => editTarget(target)}
                      onDelete={() => handleDeleteTarget(target.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="todos" className="m-0 space-y-6">
          <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Roadmap</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tight">Daily operational priorities</p>
            </div>
            <Button onClick={() => { resetTodoForm(); setShowTodoDialog(true); }} className="glass-btn-primary h-11">
              <Plus className="h-4 w-4 mr-2" /> Add Priority
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Updating roadmap...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="glass-card p-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-slate-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Roadmap Clear</h3>
              <p className="text-slate-400 font-medium">Efficiency peak reached. No pending priorities.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {todos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggleTodoStatus(todo)}
                  onEdit={() => editTodo(todo)}
                  onDelete={() => handleDeleteTodo(todo.id)}
                  priorityColor={getPriorityBadgeColor(todo.priority)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Main Target Creation/Edit Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="glass-dialog-content max-w-xl flex flex-col max-h-[90vh] p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight">{editingTarget ? 'Update Milestone' : 'Initialize Milestone'}</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Define your strategic financial objective and deadline.</DialogDescription>
          </div>
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Milestone Objective</Label>
              <Input
                id="title"
                value={targetForm.title}
                onChange={(e) => setTargetForm({ ...targetForm, title: e.target.value })}
                placeholder="e.g. Q4 Revenue Excellence"
                className="glass-input h-14"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Strategic Details</Label>
              <Textarea
                id="description"
                value={targetForm.description}
                onChange={(e) => setTargetForm({ ...targetForm, description: e.target.value })}
                placeholder="Elaborate on the success criteria..."
                className="glass-input min-h-[100px] py-4"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Capital Goal (ZMW)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={targetForm.target_amount}
                    onChange={(e) => setTargetForm({ ...targetForm, target_amount: e.target.value })}
                    placeholder="0.00"
                    className="glass-input h-14 pl-12"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Taxonomy</Label>
                <Input
                  id="category"
                  value={targetForm.category}
                  onChange={(e) => setTargetForm({ ...targetForm, category: e.target.value })}
                  placeholder="e.g. Performance"
                  className="glass-input h-14"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target_date" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Deadline</Label>
              <Input
                id="target_date"
                type="date"
                value={targetForm.target_date}
                onChange={(e) => setTargetForm({ ...targetForm, target_date: e.target.value })}
                className="glass-input h-14"
              />
            </div>
          </div>
          <DialogFooter className="p-8 border-t border-white/5 shrink-0 items-center">
            <Button variant="ghost" onClick={() => setShowTargetDialog(false)} className="text-slate-400 hover:text-white font-bold px-8">
              Cancel
            </Button>
            <Button onClick={handleCreateTarget} className="glass-btn-primary h-12 px-10">
              {editingTarget ? 'Sync Milestone' : 'Deploy Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Todo Creation/Edit Dialog */}
      <Dialog open={showTodoDialog} onOpenChange={setShowTodoDialog}>
        <DialogContent className="glass-dialog-content max-w-lg flex flex-col max-h-[90vh] p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight">{editingTodo ? 'Edit Priority' : 'New Roadmap Priority'}</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Add an operational task to your execution path.</DialogDescription>
          </div>
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Priority Title</Label>
              <Input
                value={todoForm.title}
                onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                placeholder="Execution point..."
                className="glass-input h-14"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Contextual Info</Label>
              <Textarea
                value={todoForm.description}
                onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                placeholder="Operational context..."
                className="glass-input min-h-[100px] py-4"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Urgency Tier</Label>
                <Select value={todoForm.priority} onValueChange={(v: any) => setTodoForm({ ...todoForm, priority: v })}>
                  <SelectTrigger className="glass-input h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-select-content">
                    <SelectItem value="low" className="glass-select-item">Low Priority</SelectItem>
                    <SelectItem value="medium" className="glass-select-item">Medium</SelectItem>
                    <SelectItem value="high" className="glass-select-item">High Priority</SelectItem>
                    <SelectItem value="urgent" className="glass-select-item">Critical Path</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Execution Date</Label>
                <Input
                  type="date"
                  value={todoForm.due_date}
                  onChange={(e) => setTodoForm({ ...todoForm, due_date: e.target.value })}
                  className="glass-input h-14"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 border-t border-white/5 shrink-0 items-center">
            <Button variant="ghost" onClick={() => setShowTodoDialog(false)} className="text-slate-400 hover:text-white font-bold px-8">Cancel</Button>
            <Button onClick={handleCreateTodo} className="glass-btn-primary h-12 px-10">Sync Priority</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="glass-dialog-content max-w-md flex flex-col max-h-[90vh] p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight">Sync Progress</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
              {updatingTarget?.title}
            </DialogDescription>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Completion Metric</Label>
                <div className="text-3xl font-black text-white">{manualPercentage}<span className="text-slate-600 text-lg sm:text-lg ml-1">%</span></div>
              </div>
              <Input
                type="range"
                value={manualPercentage}
                onChange={(e) => {
                  setManualPercentage(e.target.value);
                  const newAmount = (Number(e.target.value) / 100) * (updatingTarget?.target_amount || 0);
                  setManualAmount(newAmount.toFixed(2));
                }}
                className="h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                min={0}
                max={100}
                step={0.1}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Manual Valuation (ZMW)</Label>
              <Input
                type="number"
                value={manualAmount}
                onChange={(e) => {
                  setManualAmount(e.target.value);
                  const newPerc = (Number(e.target.value) / (updatingTarget?.target_amount || 1)) * 100;
                  setManualPercentage(Math.min(newPerc, 100).toFixed(1));
                }}
                className="glass-input h-14 text-xl font-bold"
              />
            </div>
          </div>

          <DialogFooter className="p-8 border-t border-white/5 shrink-0">
            <Button onClick={handleUpdateProgress} className="w-full glass-btn-primary h-14 text-lg font-black uppercase tracking-widest shadow-blue-500/20">
              Confirm Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Sub-components for better organization and cleanliness

function TargetCard({ target, onClick, percentage, gradient, isAdmin, onUpdate, onEdit, onDelete, isCompleted }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card group p-8 relative overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] border-white/5",
        isCompleted && "border-green-500/20 bg-green-500/[0.03]"

      )}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{target.title}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{target.category}</p>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              Fulfilled
            </div>

          ) : (
            <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
              Strategic
            </div>
          )}

          {isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="glass-card w-40 p-2 border-white/10 shadow-2xl">
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-full justify-start text-xs font-bold uppercase tracking-widest hover:bg-white/10 rounded-lg">
                    <Pencil className="h-3.5 w-3.5 mr-3 text-blue-400" /> Modify
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-full justify-start text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 text-red-500 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5 mr-3" /> Terminate
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Path</span>
          <span className="text-xl font-black text-white">{percentage.toFixed(0)}<span className="text-slate-600 text-sm ml-0.5">%</span></span>
        </div>
        <div className="h-4 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-0.5">
          <div
            className={cn("h-full rounded-full transition-all duration-1000 ease-out", gradient)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-1">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Liquid Value</p>
            <p className="text-xl font-black text-white flex items-baseline">
              <span className="text-xs text-slate-500 mr-1.5 font-bold uppercase tracking-tighter">ZMW</span>
              <AnimatedNumber value={target.current_amount} />
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Target Cap</p>
            <p className="text-xl font-black text-slate-400 flex items-baseline justify-end">
              <span className="text-xs text-slate-600 mr-1.5 font-bold uppercase tracking-tighter">ZMW</span>
              <AnimatedNumber value={target.target_amount} />
            </p>
          </div>
        </div>
      </div>

      {!isCompleted && isAdmin && (
        <Button
          onClick={(e) => { e.stopPropagation(); onUpdate(); }}
          className="w-full mt-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] group-hover:border-blue-500/30 transition-all font-sans"
          size="sm"
        >
          Sync Progress
        </Button>
      )}
    </div>
  );
}

function TodoCard({ todo, onToggle, onEdit, onDelete, priorityColor }: any) {
  const isCompleted = todo.status === 'completed';

  return (
    <div className={cn(
      "glass-card p-6 flex flex-row items-center gap-6 group transition-all duration-300 hover:bg-white/[0.04]",
      isCompleted && "opacity-40 grayscale-[0.5]"
    )}>
      <button
        onClick={onToggle}
        className={cn(
          "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg",
          isCompleted
            ? "bg-green-500 border-green-500 text-white shadow-green-500/20"

            : "border-white/10 bg-white/5 hover:border-blue-500 hover:bg-blue-500/5 text-transparent"
        )}
      >
        <CheckCircle2 className={cn("h-6 w-6 transition-all", isCompleted ? "scale-100" : "scale-0 opacity-0")} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1.5">
          <h4 className={cn("text-lg font-black tracking-tight truncate", isCompleted ? "text-slate-500 line-through" : "text-white")}>{todo.title}</h4>
          <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border", priorityColor)}>
            {todo.priority}
          </div>
        </div>
        <p className={cn("text-sm line-clamp-1 font-medium", isCompleted ? "text-slate-600" : "text-slate-400")}>
          {todo.description || 'No contextual details provided.'}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-10 w-10 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-10 w-10 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
