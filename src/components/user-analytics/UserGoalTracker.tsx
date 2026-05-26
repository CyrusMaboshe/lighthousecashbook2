import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Pause,
  Edit,
  Trash2
} from 'lucide-react';
import { UserAnalyticsData, UserGoal, User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface UserGoalTrackerProps {
  analyticsData: UserAnalyticsData | null;
  currentUser: User | null;
}

export function UserGoalTracker({ analyticsData, currentUser }: UserGoalTrackerProps) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const { toast } = useToast();

  // Form state for creating/editing goals
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    category: 'revenue'
  });

  // Load goals from localStorage (in a real app, this would be from a database)
  useEffect(() => {
    if (currentUser) {
      const savedGoals = localStorage.getItem(`user_goals_${currentUser.id}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  }, [currentUser]);

  // Save goals to localStorage
  const saveGoals = (updatedGoals: UserGoal[]) => {
    if (currentUser) {
      localStorage.setItem(`user_goals_${currentUser.id}`, JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    }
  };

  // Create new goal
  const createGoal = () => {
    if (!formData.title || !formData.targetAmount || !formData.targetDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newGoal: UserGoal = {
      id: Date.now().toString(),
      userId: currentUser?.id || '',
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      targetDate: formData.targetDate,
      category: formData.category,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
    
    setFormData({ title: '', targetAmount: '', targetDate: '', category: 'revenue' });
    setShowCreateGoal(false);
    
    toast({
      title: "Goal Created",
      description: `Your goal "${newGoal.title}" has been created successfully!`
    });
  };

  // Update goal progress based on current analytics
  const updateGoalProgress = (goal: UserGoal): UserGoal => {
    let currentAmount = 0;
    
    if (analyticsData) {
      switch (goal.category) {
        case 'revenue':
          currentAmount = analyticsData.totalRevenue;
          break;
        case 'transactions':
          currentAmount = analyticsData.totalTransactions;
          break;
        case 'customers':
          currentAmount = analyticsData.totalCustomers;
          break;
        default:
          currentAmount = goal.currentAmount;
      }
    }

    const updatedGoal = { ...goal, currentAmount };
    
    // Check if goal is completed
    if (currentAmount >= goal.targetAmount && goal.status === 'active') {
      updatedGoal.status = 'completed';
    }

    return updatedGoal;
  };

  // Get updated goals with current progress
  const updatedGoals = goals.map(updateGoalProgress);

  // Update goals if progress changed
  useEffect(() => {
    const hasChanges = goals.some((goal, index) => 
      goal.currentAmount !== updatedGoals[index].currentAmount ||
      goal.status !== updatedGoals[index].status
    );
    
    if (hasChanges) {
      saveGoals(updatedGoals);
    }
  }, [analyticsData]);

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    saveGoals(updatedGoals);
    toast({
      title: "Goal Deleted",
      description: "Your goal has been removed successfully"
    });
  };

  const toggleGoalStatus = (goalId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          status: goal.status === 'active' ? 'paused' : 'active'
        };
      }
      return goal;
    });
    saveGoals(updatedGoals as any);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'paused': return Pause;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const activeGoals = updatedGoals.filter(g => g.status === 'active');
  const completedGoals = updatedGoals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header with Create Goal Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Goals</h2>
          <p className="text-slate-600">Set and track your business objectives</p>
        </div>
        
        <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Reach ZMW 10,000 revenue"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Goal</SelectItem>
                    <SelectItem value="transactions">Transaction Goal</SelectItem>
                    <SelectItem value="customers">Customer Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="Enter target value"
                />
              </div>
              
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createGoal} className="flex-1">Create Goal</Button>
                <Button variant="outline" onClick={() => setShowCreateGoal(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Goals</p>
                <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed Goals</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {updatedGoals.length > 0 ? Math.round((completedGoals.length / updatedGoals.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const StatusIcon = getStatusIcon(goal.status);
                const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant="outline" className="capitalize">
                            {goal.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {goal.currentAmount.toFixed(0)} / {goal.targetAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGoalStatus(goal.id)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Completed Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">{goal.title}</h4>
                      <p className="text-sm text-green-600">
                        Completed • {goal.currentAmount.toFixed(0)} / {goal.targetAmount.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Achieved
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {updatedGoals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Goals Set</h3>
            <p className="text-slate-600 mb-4">
              Start by creating your first goal to track your progress and stay motivated.
            </p>
            <Button onClick={() => setShowCreateGoal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
