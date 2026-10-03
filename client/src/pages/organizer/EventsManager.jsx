import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode, BarChart2, Pencil } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EditEventModal } from '@/components/events/EditEventModal';
import { eventsApi } from '@/api/events';
import { formatCurrency, formatDateTime } from '@/utils/format';

export const EventsManager = () => {
  const navigate = useNavigate();
  const [editTarget, setEditTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      header: 'Schedule',
      render: (row) => formatDateTime(row.event_date),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => {
        const registered = row.capacity - (row.available_seats !== undefined ? row.available_seats : row.capacity);
        return <span>{registered} / {row.capacity}</span>;
      },
    },
    {
      key: 'price',
      header: 'Pricing',
      render: (row) => {
        const regPrice = row.non_member_price !== undefined ? Number(row.non_member_price) : Number(row.price || 0);
        const memPrice = Number(row.member_price || 0);
        return (
          <span className="text-xs">
            Reg: {regPrice === 0 ? 'Free' : formatCurrency(regPrice)}
            <br />
            Mem: {memPrice === 0 ? 'Free' : formatCurrency(memPrice)}
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
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(row);
            }}
            icon={Pencil}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizer/scanner?eventId=${row.id}`);
            }}
            icon={QrCode}
          >
            Gate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizer/reports?eventId=${row.id}`);
            }}
            icon={BarChart2}
          >
            Stats
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="Organized Events"
        subtitle="Manage assigned association events, gate scanners, and registrations"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Events Manager', href: '/organizer/events' },
        ]}
        api={eventsApi.list}
        columns={columns}
        actionLabel="Create Event"
        onAction={() => navigate('/organizer/events/new')}
        actionIcon={Plus}
        searchPlaceholder="Search events..."
        emptyTitle="No events created yet"
        emptyDescription="Create your first association event to begin issuing tickets."
      />

      <EditEventModal
        isOpen={Boolean(editTarget)}
        event={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
};

export default EventsManager;
