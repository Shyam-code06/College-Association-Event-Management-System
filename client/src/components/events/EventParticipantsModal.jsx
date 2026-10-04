import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, CheckCircle2, Clock, X, Download, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { eventsApi } from '@/api/events';
import { ticketsApi } from '@/api/tickets';
import { formatDateTime } from '@/utils/format';

export const EventParticipantsModal = ({ isOpen, onClose, event }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen && event?.id) {
      setLoading(true);
      eventsApi
        .getEventRegistrations(event.id, { limit: 100 })
        .then((res) => {
          const list = res.data || [];
          setParticipants(list);
        })
        .catch((err) => {
          toast.error(err?.message || 'Failed to load participants.');
          setParticipants([]);
        })
        .finally(() => setLoading(false));
    } else {
      setParticipants([]);
      setSearch('');
      setStatusFilter('ALL');
    }
  }, [isOpen, event?.id]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const name = (p.user_name || p.name || '').toLowerCase();
      const email = (p.user_email || p.email || '').toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q) || String(p.id).includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'CHECKED_IN') {
        return Boolean(p.checked_in_at || p.checked_in || p.check_in_time);
      }
      if (statusFilter === 'CONFIRMED') {
        return (p.status || '').toUpperCase() === 'CONFIRMED';
      }
      return true;
    });
  }, [participants, search, statusFilter]);

  const checkedInCount = useMemo(
    () => participants.filter((p) => Boolean(p.checked_in_at || p.checked_in || p.check_in_time)).length,
    [participants]
  );

  const handleExportCSV = () => {
    if (!participants.length) return;
    const headers = ['Registration ID', 'Student Name', 'Email', 'Status', 'Checked In', 'Check In Time', 'Registered Date'];
    const rows = participants.map((p) => [
      p.id,
      `"${p.user_name || p.name || 'N/A'}"`,
      `"${p.user_email || p.email || 'N/A'}"`,
      p.status || 'CONFIRMED',
      p.checked_in_at || p.checked_in || p.check_in_time ? 'YES' : 'NO',
      p.checked_in_at ? formatDateTime(p.checked_in_at) : 'N/A',
      p.created_at ? formatDateTime(p.created_at) : 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_${event?.name || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetParticipant, setTargetParticipant] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (participant) => {
    setTargetParticipant(participant);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReason.trim() || deleteReason.trim().length < 3) {
      toast.error('Please enter a valid reason (min 3 characters).');
      return;
    }
    setDeleting(true);
    try {
      await ticketsApi.deleteAttendance({
        registrationId: targetParticipant.id,
        reason: deleteReason.trim(),
      });
      toast.success('Attendance revoked successfully.');
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === targetParticipant.id
            ? { ...p, checked_in: false, check_in_time: null, checked_in_at: null }
            : p
        )
      );
      setDeleteModalOpen(false);
      setTargetParticipant(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to revoke attendance.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={event ? `Participated Students — ${event.name || event.title}` : 'Participated Students'}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Top Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas p-3.5 rounded-lg border border-line">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted block">Total Registered</span>
                <span className="font-bold text-ink text-sm">{participants.length} Students</span>
              </div>
              <div className="h-6 w-px bg-line" />
              <div>
                <span className="text-muted block">Checked In</span>
                <span className="font-bold text-success text-sm">{checkedInCount} Checked In</span>
              </div>
              <div className="h-6 w-px bg-line" />
              <div>
                <span className="text-muted block">Event Capacity</span>
                <span className="font-semibold text-ink text-sm">{event?.capacity || 'N/A'}</span>
              </div>
            </div>

            {participants.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search by student name, email, or pass ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-md border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-canvas p-1 rounded-md border border-line text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All ({participants.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CHECKED_IN')}
                className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                  statusFilter === 'CHECKED_IN'
                    ? 'bg-surface text-success shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Checked In ({checkedInCount})
              </button>
            </div>
          </div>

          {/* Participants Table Content */}
          <div className="border border-line rounded-lg overflow-hidden bg-surface max-h-[50vh] overflow-y-auto">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-muted gap-2">
                <Spinner size="md" />
                <span className="text-xs">Loading registered students...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-16 text-center text-muted">
                <Users className="h-8 w-8 mx-auto text-muted/50 mb-2" />
                <p className="text-sm font-medium text-ink">
                  {participants.length === 0 ? 'No students participated yet' : 'No matching students found'}
                </p>
                <p className="text-xs mt-1">
                  {participants.length === 0
                    ? 'When students register for this event, their details will appear here.'
                    : 'Try adjusting your search criteria.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas border-b border-line text-muted font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Pass ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Registered Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {filteredParticipants.map((p) => {
                    const isCheckedIn = Boolean(p.checked_in_at || p.checked_in || p.check_in_time);
                    return (
                      <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                          {p.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-ink">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-pill bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {(p.user_name || p.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <span>{p.user_name || p.name || 'Student'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {p.user_email || p.email || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge status={p.status || 'CONFIRMED'} />
                        </td>
                        <td className="py-2.5 px-3">
                          {isCheckedIn ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-success/10 text-success text-[11px] font-semibold">
                                <CheckCircle2 className="h-3 w-3" /> Checked In
                              </span>
                              {p.checked_in_at && (
                                <span className="block text-[10px] text-muted mt-0.5">
                                  {formatDateTime(p.checked_in_at)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-muted/10 text-muted text-[11px]">
                              <Clock className="h-3 w-3" /> Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {p.created_at ? formatDateTime(p.created_at) : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              title="Delete Attendance / Undo Check-In"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-danger hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Revoke</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-muted">
              Showing {filteredParticipants.length} of {participants.length} students
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Attendance Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Revoke Attendance"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            You are about to revoke attendance check-in for{' '}
            <strong className="text-ink font-semibold">
              {targetParticipant?.user_name || targetParticipant?.name || 'Attendee'}
            </strong>{' '}
            (Registration ID: {targetParticipant?.id}). Their digital pass will revert to un-scanned status.
          </p>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Reason for Deleting Attendance <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Scanned accidentally, attendee left early, duplicate gate scan..."
              className="w-full text-xs p-2.5 rounded-md border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger resize-none"
            />
            <span className="text-[10px] text-muted mt-1 block">
              A reason is required for administrative and security auditing.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleConfirmDelete}
              loading={deleting}
              disabled={!deleteReason.trim() || deleteReason.trim().length < 3 || deleting}
            >
              Revoke Attendance
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EventParticipantsModal;
