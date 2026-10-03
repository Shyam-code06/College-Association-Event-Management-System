import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckSquare, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { fundraisersApi } from '@/api/fundraisers';
import { formatDate } from '@/utils/format';

export const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fundraisersApi.getMyTasks();
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await fundraisersApi.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated!');
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      toast.error(err?.message || 'Failed to update task status.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          My Volunteer Work & Tasks
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Track association volunteer responsibilities, instructions, and update task progress
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-2 bg-surface">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="p-5 bg-surface border border-line rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-soft transition-all"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge status={task.status || 'PENDING'} />
                  {task.fundraiser_title && (
                    <span className="text-xs text-muted flex items-center gap-1 font-medium">
                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      Project: {task.fundraiser_title}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-ink">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {task.due_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted mt-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due: {formatDate(task.due_date)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted font-medium hidden sm:inline">Status:</span>
                <Select
                  value={String(task.status || 'pending').toLowerCase()}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="w-36 text-xs font-medium"
                >
                  <option value="pending">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="You currently have no volunteer tasks assigned. Check back when an organizer assigns you a role!"
        />
      )}
    </div>
  );
};

export default MyTasks;
