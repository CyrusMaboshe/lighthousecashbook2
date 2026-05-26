import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Circle, Clock, TrendingUp, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Target {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

interface Todo {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  assigned_to?: string;
  created_by_username: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface CampaignTargetsProps {
  companyId: string;
  username: string;
  isAdmin: boolean;
}

export function CampaignTargets({ companyId, username, isAdmin }: CampaignTargetsProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showTodoDialog, setShowTodoDialog] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Target form state
  const [targetForm, setTargetForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: '',
    category: 'Revenue'
  });

  // Todo form state
  const [todoForm, setTodoForm] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    assigned_to: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetsRes, todosRes, transactionsRes] = await Promise.all([
        supabase.from('mt_company_targets').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('mt_company_todos').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('mt_company_transactions').select('amount, type, category_name').eq('company_id', companyId)
      ]);

      if (targetsRes.data) {
        const updatedTargets = targetsRes.data.map(target => {
          const categoryTransactions = transactionsRes.data?.filter(
            t => t.category_name === target.category
          ) || [];
          
          const currentAmount = categoryTransactions.reduce((sum, t) => {
            return t.type === 'cash-in' ? sum + Number(t.amount) : sum - Number(t.amount);
          }, 0);

          return { ...target, current_amount: currentAmount };
        });
        setTargets(updatedTargets);
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
    const targetsChannel = supabase
      .channel('mt_company_targets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_targets', filter: `company_id=eq.${companyId}` }, () => {
        fetchData();
      })
      .subscribe();

    const todosChannel = supabase
      .channel('mt_company_todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mt_company_todos', filter: `company_id=eq.${companyId}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(targetsChannel);
      supabase.removeChannel(todosChannel);
    };
  };

  const handleCreateTarget = async () => {
    if (!targetForm.title || !targetForm.target_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const targetData = {
        company_id: companyId,
        title: targetForm.title,
        description: targetForm.description || null,
        target_amount: Number(targetForm.target_amount),
        current_amount: 0,
        target_date: targetForm.target_date || null,
        category: targetForm.category,
        status: 'active',
        created_by_username: username
      };

      if (editingTarget) {
        await supabase.from('mt_company_targets').update(targetData).eq('id', editingTarget.id);
        toast.success('Target updated successfully');
      } else {
        await supabase.from('mt_company_targets').insert(targetData);
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
    if (!todoForm.title) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const todoData = {
        company_id: companyId,
        title: todoForm.title,
        description: todoForm.description || null,
        priority: todoForm.priority,
        status: editingTodo?.status || 'pending',
        due_date: todoForm.due_date || null,
        assigned_to: todoForm.assigned_to || null,
        created_by_username: username
      };

      if (editingTodo) {
        await supabase.from('mt_company_todos').update(todoData).eq('id', editingTodo.id);
        toast.success('Task updated successfully');
      } else {
        await supabase.from('mt_company_todos').insert(todoData);
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

  const handleToggleTodoStatus = async (todo: Todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await supabase
        .from('mt_company_todos')
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
    if (!confirm('Are you sure you want to delete this target?')) return;
    
    try {
      await supabase.from('mt_company_targets').delete().eq('id', targetId);
      toast.success('Target deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Failed to delete target');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await supabase.from('mt_company_todos').delete().eq('id', todoId);
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
    setTodoForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
    setEditingTodo(null);
  };

  const editTarget = (target: Target) => {
    setEditingTarget(target);
    setTargetForm({
      title: target.title,
      description: target.description || '',
      target_amount: target.target_amount.toString(),
      target_date: target.target_date || '',
      category: target.category
    });
    setShowTargetDialog(true);
  };

  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
      assigned_to: todo.assigned_to || ''
    });
    setShowTodoDialog(true);
  };

  const getProgressPercentage = (target: Target) => {
    if (target.target_amount === 0) return 0;
    return Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Targets & Goals
          </h2>
          <p className="text-muted-foreground mt-1">Track your progress and manage tasks</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetTargetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Target
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTarget ? 'Edit Target' : 'Create New Target'}</DialogTitle>
                  <DialogDescription>Set financial goals and track your progress</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Target Title *</Label>
                    <Input
                      id="title"
                      value={targetForm.title}
                      onChange={(e) => setTargetForm({ ...targetForm, title: e.target.value })}
                      placeholder="e.g., Monthly Revenue Goal"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={targetForm.description}
                      onChange={(e) => setTargetForm({ ...targetForm, description: e.target.value })}
                      placeholder="Add details about this target..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Target Amount (ZMW) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={targetForm.target_amount}
                        onChange={(e) => setTargetForm({ ...targetForm, target_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={targetForm.category}
                        onChange={(e) => setTargetForm({ ...targetForm, category: e.target.value })}
                        placeholder="Revenue, Sales, etc."
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="target_date">Target Date</Label>
                    <Input
                      id="target_date"
                      type="date"
                      value={targetForm.target_date}
                      onChange={(e) => setTargetForm({ ...targetForm, target_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTargetDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateTarget}>{editingTarget ? 'Update' : 'Create'} Target</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs defaultValue="targets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="targets">
            <TrendingUp className="h-4 w-4 mr-2" />
            Targets
          </TabsTrigger>
          <TabsTrigger value="todos">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            To-Do List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : targets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No targets set yet</p>
                {isAdmin && (
                  <Button className="mt-4" onClick={() => setShowTargetDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Target
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {targets.map((target) => {
                const percentage = getProgressPercentage(target);
                const progressColor = getProgressColor(percentage);
                const isOverdue = target.target_date && new Date(target.target_date) < new Date();

                return (
                  <Card key={target.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{target.title}</CardTitle>
                          <CardDescription className="mt-1">{target.description}</CardDescription>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editTarget(target)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTarget(target.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-3" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-semibold text-lg">ZMW {target.current_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold text-lg">ZMW {target.target_amount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge variant="outline">{target.category}</Badge>
                        {target.target_date && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3" />
                            {new Date(target.target_date).toLocaleDateString()}
                            {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          {isAdmin && (
            <Dialog open={showTodoDialog} onOpenChange={setShowTodoDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetTodoForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                  <DialogDescription>Manage your to-do list and track tasks</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="todo-title">Task Title *</Label>
                    <Input
                      id="todo-title"
                      value={todoForm.title}
                      onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                      placeholder="What needs to be done?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="todo-description">Description</Label>
                    <Textarea
                      id="todo-description"
                      value={todoForm.description}
                      onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                      placeholder="Add more details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={todoForm.priority} onValueChange={(value: any) => setTodoForm({ ...todoForm, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={todoForm.due_date}
                        onChange={(e) => setTodoForm({ ...todoForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Input
                      id="assigned_to"
                      value={todoForm.assigned_to}
                      onChange={(e) => setTodoForm({ ...todoForm, assigned_to: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTodoDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateTodo}>{editingTodo ? 'Update' : 'Add'} Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : todos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks yet</p>
                {isAdmin && (
                  <Button className="mt-4" onClick={() => setShowTodoDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => {
                const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'completed';
                
                return (
                  <Card key={todo.id} className={`${todo.status === 'completed' ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleTodoStatus(todo)}
                          className="mt-1 flex-shrink-0"
                        >
                          {todo.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium ${todo.status === 'completed' ? 'line-through' : ''}`}>
                              {todo.title}
                            </h4>
                            {isAdmin && (
                              <div className="flex gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editTodo(todo)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTodo(todo.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {todo.description && (
                            <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                              {todo.priority}
                            </Badge>
                            
                            {todo.due_date && (
                              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Clock className="h-3 w-3" />
                                {new Date(todo.due_date).toLocaleDateString()}
                                {isOverdue && <AlertCircle className="h-3 w-3" />}
                              </div>
                            )}
                            
                            {todo.assigned_to && (
                              <span className="text-xs text-muted-foreground">
                                Assigned to: {todo.assigned_to}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
