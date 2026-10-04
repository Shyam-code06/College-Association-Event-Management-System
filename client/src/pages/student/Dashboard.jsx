import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  Calendar,
  Award,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth';
import { membershipsApi } from '@/api/memberships';
import { eventsApi } from '@/api/events';
import { fundraisersApi } from '@/api/fundraisers';
import { formatDateTime, formatDate } from '@/utils/format';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [membership, setMembership] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [volunteerTasks, setVolunteerTasks] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const loadData = () => {
    Promise.allSettled([
      membershipsApi.getMyMembership(),
      eventsApi.getMyRegistrations({ limit: 5 }),
      fundraisersApi.getMyTasks({ limit: 10 }),
    ]).then(([memRes, regRes, taskRes]) => {
      if (memRes.status === 'fulfilled' && memRes.value?.data) {
        setMembership(memRes.value.data);
      }
      if (regRes.status === 'fulfilled' && regRes.value?.data) {
        setRegistrations(regRes.value.data);
      }
      if (taskRes.status === 'fulfilled' && taskRes.value?.data) {
        setVolunteerTasks(taskRes.value.data || []);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespondInvitation = async (taskId, action) => {
    setRespondingId(taskId);
    try {
      await fundraisersApi.respondInvitation(taskId, action);
      toast.success(
        action === 'accept'
          ? 'Volunteer invitation accepted! You are now assigned to this event team.'
          : 'Volunteer invitation declined.'
      );
      loadData();
    } catch (err) {
      toast.error(err?.message || `Failed to ${action} invitation.`);
    } finally {
      setRespondingId(null);
    }
  };

  const isMember = Boolean(
    membership?.isActive ||
    String(membership?.status).toUpperCase() === 'ACTIVE'
  );

  const pendingInvitations = volunteerTasks.filter(
    (t) => (t.invitation_status || 'pending').toLowerCase() === 'pending'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary-soft text-primary text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Student Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Hello, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Welcome to your Odoo student organization portal. Track your passes and events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/events')}
            icon={Calendar}
          >
            Browse Events
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/student/membership')}
            icon={Award}
          >
            {isMember ? 'My Plan' : 'Join Association'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Membership Status"
          value={isMember ? 'Active Member' : 'Non-Member'}
          subtitle={isMember && membership?.plan_name ? membership.plan_name : (isMember ? 'Association Plan' : 'Upgrade to get discounts')}
          icon={Award}
          indicator={isMember ? 'success' : 'default'}
        />
        <StatCard
          title="Active Tickets"
          value={registrations.length}
          subtitle="Registered upcoming events"
          icon={Ticket}
          indicator="primary"
        />
        <StatCard
          title="Merch Discount"
          value={
            isMember && (membership?.maxDiscountPercent || membership?.merch_discount_percent)
              ? `${Number(membership?.maxDiscountPercent ?? membership?.merch_discount_percent)}% OFF`
              : '0%'
          }
          subtitle="Exclusive store savings"
          icon={ShoppingBag}
          indicator="secondary"
        />
        <StatCard
          title="Volunteer Roles"
          value={volunteerTasks.length}
          subtitle={
            pendingInvitations.length > 0
              ? `${pendingInvitations.length} pending invitation${pendingInvitations.length > 1 ? 's' : ''}`
              : 'Assigned campus duties'
          }
          icon={Users}
          indicator={pendingInvitations.length > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* Volunteer Invitations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-ink">Volunteer Invitations & Roles</h2>
            {pendingInvitations.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {pendingInvitations.length} Action Required
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/tasks')}
            icon={ArrowRight}
          >
            My Work & Tasks
          </Button>
        </div>

        {volunteerTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {volunteerTasks.map((task) => {
              const status = (task.invitation_status || 'pending').toLowerCase();
              const isPending = status === 'pending';
              const isAccepted = status === 'accepted';
              const isDeclined = status === 'declined';
              const isExpired =
                isPending &&
                task.invitation_deadline &&
                new Date(task.invitation_deadline) < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <Card
                  key={task.id}
                  className={`p-5 flex flex-col justify-between gap-4 border transition-all ${
                    isPending
                      ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-sm'
                      : 'border-line bg-surface'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
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
                          {isExpired ? 'Invitation Expired' : `Invitation: ${status}`}
                        </span>
                        {task.organization && (
                          <span className="text-[11px] text-muted font-medium">
                            • {task.organization}
                          </span>
                        )}
                      </div>

                      {task.invitation_deadline && (
                        <span
                          className={`text-xs flex items-center gap-1 font-semibold ${
                            isExpired
                              ? 'text-rose-600'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Cutoff: {formatDate(task.invitation_deadline)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-ink">{task.title}</h3>
                      {task.fundraiser_title && (
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          Project: {task.fundraiser_title}
                        </p>
                      )}
                      {task.description && (
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 rounded-md bg-canvas/60 border border-line text-[11px] text-muted flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Member Role:</strong> As an accepted volunteer, you coordinate this event and cannot register as a participating attendee.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted">
                      {task.due_date ? `Work Due: ${formatDate(task.due_date)}` : 'Execution on event day'}
                    </span>

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
                          Accept Role
                        </Button>
                      </div>
                    )}

                    {isAccepted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/student/tasks')}
                        className="text-xs"
                      >
                        Open Task Board
                      </Button>
                    )}

                    {isDeclined && (
                      <span className="text-xs text-muted italic">Declined by you</span>
                    )}

                    {isExpired && (
                      <span className="text-xs text-rose-600 font-medium">Response window closed</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 bg-surface border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Active Member Volunteer Opportunities
              </h3>
              <p className="text-xs text-muted max-w-xl">
                Only active student association members can be invited to coordinate campus events. Keep your membership active to receive volunteer invitations!
              </p>
            </div>
            {!isMember && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/student/membership')}
                icon={Award}
              >
                Join Association
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Upcoming Event Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">My Upcoming Event Passes</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/tickets')}
            icon={ArrowRight}
          >
            View All Tickets
          </Button>
        </div>

        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.slice(0, 4).map((reg) => (
              <Card key={reg.id} className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge status={reg.status || 'CONFIRMED'} />
                    <span className="text-[11px] text-muted">
                      {formatDateTime(reg.event_date)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-ink truncate">
                    {reg.event_title || 'Campus Event'}
                  </h3>
                  <p className="text-xs text-muted truncate mt-0.5">
                    Venue: {reg.venue || 'Campus Auditorium'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/student/tickets')}
                  icon={Ticket}
                >
                  Pass
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-surface border border-line">
            <Ticket className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">No event passes yet</p>
            <p className="text-xs text-muted mt-1 mb-4">
              Explore upcoming hackathons, guest lectures, and campus fests.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/events')}>
              Explore Events
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
