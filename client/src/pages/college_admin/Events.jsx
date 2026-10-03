import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, XCircle, BarChart2, Pencil } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditEventModal } from '@/components/events/EditEventModal';
import { eventsApi } from '@/api/events';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const AdminEvents = () => {
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCancelEvent = async () => {
    if (!cancelTarget) return;
    try {
      await eventsApi.cancel(cancelTarget.id);
      toast.success('Event cancelled.');
      setCancelTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel event.');
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Event Name',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.name || row.title}</span>
          <span className="block text-xs text-muted truncate max-w-xs">{row.location || row.venue}</span>
        </div>
      ),
    },
    {
      key: 'event_date',
      header: 'Event Schedule',
      render: (row) => formatDateTime(row.event_date),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => (
        <span>
          {row.available_seats !== undefined
            ? `${row.capacity - row.available_seats} / ${row.capacity}`
            : row.capacity}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Standard / Member',
      render: (row) => {
        const regPrice = row.non_member_price !== undefined ? Number(row.non_member_price) : Number(row.price || 0);
        const memPrice = Number(row.member_price || 0);
        return (
          <span className="text-xs">
            {regPrice === 0 ? 'Free' : formatCurrency(regPrice)} /{' '}
            {memPrice === 0 ? 'Free' : formatCurrency(memPrice)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status || 'PUBLISHED'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditTarget(row)}
            icon={Pencil}
          >
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/organizer/reports?eventId=${row.id}`)}
            icon={BarChart2}
          >
            Stats
          </Button>

          {row.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/10"
              onClick={() => setCancelTarget(row)}
              icon={XCircle}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="College Events"
        subtitle="Supervise campus workshops, guest lectures, hackathons, and ticketing"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Events', href: '/admin/events' },
        ]}
        api={eventsApi.list}
        columns={columns}
        actionLabel="Create Event"
        onAction={() => navigate('/organizer/events/new')}
        actionIcon={Plus}
        searchPlaceholder="Search events..."
      />

      <EditEventModal
        isOpen={Boolean(editTarget)}
        event={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelEvent}
        title="Cancel Event"
        description={`Are you sure you want to cancel "${cancelTarget?.name || cancelTarget?.title}"? Registered students will be notified and ticket sales will be stopped.`}
        confirmText="Cancel Event"
        variant="danger"
      />
    </>
  );
};

export default AdminEvents;
