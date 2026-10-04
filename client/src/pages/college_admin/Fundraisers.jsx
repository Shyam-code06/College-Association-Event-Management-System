import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, UserCheck, Calendar, CheckSquare, Mail, Bell, Clock } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { fundraisersApi } from '@/api/fundraisers';
import { eventsApi } from '@/api/events';
import { formatDate } from '@/utils/format';

export const AdminFundraisers = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Create Volunteer Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Volunteer Tasks Modal
  const [activeInitiative, setActiveInitiative] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [taskInvitationDeadline, setTaskInvitationDeadline] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');

  // Fetch students list for dropdown when assigning tasks
  const loadStudents = async (eventId) => {
    setLoadingStudents(true);
    try {
      const res = await fundraisersApi.getStudents(eventId);
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch created events list for the Event dropdown
  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await eventsApi.list({ limit: 100 });
      setEventsList(res.data || []);
    } catch {
      setEventsList([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setDescription('');
    setEndDate('');
    setSelectedEventId('');
    setSelectedOrganization('Odoo Student Association');
    setIsCreateOpen(true);
    loadEvents();
  };

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    if (!eventId) return;

    const ev = eventsList.find((item) => String(item.id) === String(eventId));
    if (ev) {
      setTitle(`${ev.name} - Volunteers Team`);
      if (ev.event_date) {
        const dateStr = ev.event_date.includes('T') ? ev.event_date.split('T')[0] : ev.event_date;
        setEndDate(dateStr);
      }
      if (ev.description) {
        setDescription(`Volunteer tasks, stage coordination, and assistance for "${ev.name}" at ${ev.location || 'campus'}.`);
      }
      if (ev.organization) {
        setSelectedOrganization(ev.organization);
      }
    }
  };

  const handleCreateInitiative = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fundraisersApi.create({
        title: title.trim(),
        description: description?.trim() || '',
        organization: selectedOrganization || 'Odoo Student Association',
        event_id: selectedEventId ? Number(selectedEventId) : null,
        target_amount: 1, // Non-monetary placeholder for backend schema
        end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
      });
      toast.success('Volunteer project created successfully!');
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setEndDate('');
      setSelectedEventId('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to create volunteer project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTasksModal = async (initiative) => {
    setActiveInitiative(initiative);
    loadStudents(initiative.event_id);
    try {
      const res = await fundraisersApi.getTasks(initiative.id);
      setTasks(res.data || []);
    } catch {
      toast.error('Failed to load volunteer tasks.');
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title.');
      return;
    }
    if (!selectedStudentId) {
      toast.error('Please select an active member volunteer.');
      return;
    }
    if (!taskInvitationDeadline) {
      toast.error('Please set an invitation response deadline.');
      return;
    }

    setIsAssigning(true);
    try {
      await fundraisersApi.createTask(activeInitiative.id, {
        title: taskTitle.trim(),
        description: taskDesc?.trim() || '',
        assignee_id: Number(selectedStudentId),
        due_date: taskDueDate || undefined,
        invitation_deadline: taskInvitationDeadline || undefined,
      });

      toast.success('Volunteer invited! Email notification queued with response deadline.');
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskInvitationDeadline('');
      setSelectedStudentId('');

      // Refresh task list
      const res = await fundraisersApi.getTasks(activeInitiative.id);
      setTasks(res.data || []);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to invite volunteer.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await fundraisersApi.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated!');
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to update task status.');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Volunteer Project / Work',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.title}</span>
          <span className="block text-xs text-muted truncate max-w-sm mt-0.5">
            {row.description || 'No additional description'}
          </span>
        </div>
      ),
    },
    {
      key: 'tasks_summary',
      header: 'Assigned Tasks',
      render: (row) => {
        const total = row.progress?.tasks_total || 0;
        const completed = row.progress?.tasks_completed || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-primary-soft text-primary text-xs font-semibold">
              <CheckSquare className="w-3.5 h-3.5" />
              {completed}/{total} Completed
            </span>
          </div>
        );
      },
    },
    {
      key: 'end_date',
      header: 'Target Date',
      render: (row) => (
        <span className="text-xs text-ink font-medium flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted" />
          {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status || 'ACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openTasksModal(row)}
          icon={UserCheck}
        >
          Assign Tasks & Volunteers
        </Button>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Volunteer & Work Management"
        subtitle="Organize student volunteer teams, assign work responsibilities, and track completion (Non-Monetary)"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Volunteers & Tasks', href: '/organizer/fundraisers' },
        ]}
        api={fundraisersApi.list}
        columns={columns}
        actionLabel="New Volunteer Project"
        onAction={handleOpenCreateModal}
        actionIcon={Plus}
        searchPlaceholder="Search volunteer projects..."
      />

      {/* Create Volunteer Project Modal (No Money Fields!) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Volunteer Project / Team"
        subtitle="Setup an event team or campus initiative to allocate work to student volunteers"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateInitiative} className="space-y-4">
          {/* Dropdown for Created Events */}
          <FormField label="Select Created Event">
            <Select
              value={selectedEventId}
              onChange={(e) => handleEventSelect(e.target.value)}
              disabled={loadingEvents}
            >
              <option value="">
                {loadingEvents ? 'Loading events...' : '-- Choose from Created Events (Auto-fills details) --'}
              </option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} {ev.event_date ? `(${formatDate(ev.event_date)})` : ''}
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-muted mt-1">
              Select an event to automatically populate the title, deadline, and description, or enter a custom title below.
            </p>
          </FormField>

          <FormField label="Project / Activity Title" required>
            <Input
              placeholder="e.g. Annual Campus Fest Logistics & Stage Team"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Target Completion Date" required>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Work Scope & Description">
            <Textarea
              rows={3}
              placeholder="Describe the volunteer duties, meeting locations, and responsibilities needed for this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Volunteer Tasks & Assignments Modal */}
      <Modal
        isOpen={Boolean(activeInitiative)}
        onClose={() => setActiveInitiative(null)}
        title={`Volunteer Management: ${activeInitiative?.title}`}
        subtitle="Invite association members as event volunteers and track their response deadlines"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Volunteer Rules Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" /> Volunteer Eligibility & Role Policy:
            </p>
            <p className="text-[11px] leading-relaxed">
              • Only active association members can be invited as volunteers.<br />
              • Students registered as attendees for this event are excluded and cannot volunteer.
            </p>
          </div>

          {/* Assignment / Invitation Form */}
          <form
            onSubmit={handleAssignTask}
            className="p-4 bg-canvas/70 rounded-lg border border-line space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-line">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Invite Member as Volunteer
              </h4>
              <span className="text-[11px] text-muted flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-primary" /> Invitation email & announcement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Select Association Member Volunteer" required>
                <Select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  disabled={loadingStudents}
                >
                  <option value="">
                    {loadingStudents
                      ? 'Loading association members...'
                      : students.length > 0
                      ? '-- Choose Active Member Volunteer --'
                      : '-- No Eligible Members (Must be member & non-attendee) --'}
                  </option>
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.email}) • {std.plan_name || 'Active Member'}
                    </option>
                  ))}
                </Select>
                {students.length === 0 && !loadingStudents && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Note: Only students who have active memberships and are not attending this event can be invited.
                  </p>
                )}
              </FormField>

              <FormField label="Invitation Response Deadline" required>
                <Input
                  type="date"
                  value={taskInvitationDeadline}
                  onChange={(e) => setTaskInvitationDeadline(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted mt-0.5">
                  Cutoff date by which the member must accept or decline.
                </p>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Task Title / Role Responsibility" required>
                <Input
                  placeholder="e.g. Stage Sound Check & Guest Ushering"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Task Due Date (Execution Date)">
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Detailed Work Instructions">
              <Input
                placeholder="e.g. Meet with sound coordinator at 8:30 AM at Gate 2. Distribute badges."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </FormField>

            <div className="pt-2 flex justify-between items-center">
              <p className="text-[11px] text-muted flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-secondary" />
                Invites student via portal & records email log.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Plus}
                isLoading={isAssigning}
              >
                Send Volunteer Invitation
              </Button>
            </div>
          </form>

          {/* Assigned Tasks List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
              <span>Invited & Assigned Volunteers ({tasks.length})</span>
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.length > 0 ? (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-surface border border-line rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink text-sm">{t.title}</span>
                        <Badge status={t.status || 'PENDING'} />
                        {t.invitation_status && (
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              t.invitation_status === 'accepted'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : t.invitation_status === 'declined'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            Invite: {t.invitation_status}
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-muted mt-1">{t.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {t.assignee_name || 'Assigned Student'}{' '}
                          {t.assignee_email && `(${t.assignee_email})`}
                        </span>
                        {t.invitation_deadline && (
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                            <Clock className="w-3 h-3" /> Invite Deadline: {formatDate(t.invitation_deadline)}
                          </span>
                        )}
                        {t.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Work Due: {formatDate(t.due_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {t.invitation_status === 'accepted' ? (
                        <>
                          <span className="text-[11px] text-muted font-medium">Status:</span>
                          <Select
                            value={t.status || 'pending'}
                            onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                            className="h-8 text-xs w-32"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </Select>
                        </>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              t.invitation_status === 'declined'
                                ? 'bg-rose-500/15 text-rose-600'
                                : t.invitation_status === 'expired'
                                ? 'bg-red-500/15 text-red-600'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {t.invitation_status === 'declined'
                              ? 'Invite Declined'
                              : t.invitation_status === 'expired'
                              ? 'Invite Expired'
                              : 'Awaiting Acceptance'}
                          </span>
                          <span className="text-[10px] text-muted">
                            Can be completed once student accepts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-line rounded-md bg-canvas/30">
                  <p className="text-xs text-muted">
                    No volunteer tasks assigned to this project yet. Use the form above to assign a student!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminFundraisers;
