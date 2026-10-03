import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { fundraisersApi } from '@/api/fundraisers';
import { formatDate } from '@/utils/format';

export const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

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

  const handleRespondInvitation = async (taskId, action) => {
    setRespondingId(taskId);
    try {
      await fundraisersApi.respondInvitation(taskId, action);
      toast.success(
        action === 'accept'
          ? 'Volunteer invitation accepted! You can now update work progress.'
          : 'Volunteer invitation declined.'
      );
      fetchTasks();
    } catch (err) {
      toast.error(err?.message || `Failed to ${action} invitation.`);
    } finally {
      setRespondingId(null);
    }
  };

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          My Volunteer Work & Tasks
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Review volunteer invitations, meet acceptance deadlines, and manage assigned event responsibilities
        </p>
      </div>

      {/* Volunteer Exclusivity Notice */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Member-Only Volunteer Policy:</strong> You are eligible for volunteer roles as an active association member. Once you accept a volunteer role for an event, you are designated as staff/coordination and cannot purchase or register as a participating attendee for that event.
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
          {tasks.map((task) => {
            const invStatus = (task.invitation_status || 'pending').toLowerCase();
            const isPending = invStatus === 'pending';
            const isAccepted = invStatus === 'accepted';
            const isDeclined = invStatus === 'declined';
            const isExpired =
              isPending &&
              task.invitation_deadline &&
              new Date(task.invitation_deadline) < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <Card
                key={task.id}
                className={`p-5 bg-surface border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isPending
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : 'border-line'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge status={task.status || 'PENDING'} />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isAccepted
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : isDeclined
                          ? 'bg-rose-500/15 text-rose-600'
                          : isExpired
                          ? 'bg-red-500/15 text-red-600'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isExpired ? 'Invitation Expired' : `Invitation: ${invStatus}`}
                    </span>

                    {task.fundraiser_title && (
                      <span className="text-xs text-muted flex items-center gap-1 font-medium">
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                        Project: {task.fundraiser_title}
                      </span>
                    )}

                    {task.organization && (
                      <span className="text-xs text-muted font-medium">
                        • {task.organization}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-ink">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-muted leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted pt-1">
                    {task.invitation_deadline && (
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          isExpired
                            ? 'text-rose-600'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Acceptance Cutoff: {formatDate(task.invitation_deadline)}
                      </span>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Execution Due: {formatDate(task.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions / Status changer */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line">
                  {isPending && !isExpired && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={respondingId === task.id}
                        onClick={() => handleRespondInvitation(task.id, 'decline')}
                        icon={XCircle}
                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={respondingId === task.id}
                        onClick={() => handleRespondInvitation(task.id, 'accept')}
                        icon={CheckCircle2}
                        className="text-xs"
                      >
                        Accept Invitation
                      </Button>
                    </div>
                  )}

                  {isPending && isExpired && (
                    <span className="text-xs text-rose-600 font-semibold">
                      Invitation Expired
                    </span>
                  )}

                  {isDeclined && (
                    <span className="text-xs text-muted italic">
                      You declined this invitation
                    </span>
                  )}

                  {isAccepted && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted font-medium hidden sm:inline">
                        Work Status:
                      </span>
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
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="You currently have no volunteer tasks assigned. Check back when an organizer invites you to an event!"
        />
      )}
    </div>
  );
};

export default MyTasks;
