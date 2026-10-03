import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useAuthStore } from '@/stores/auth';

export const EventsBrowse = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    eventsApi
      .list({ limit: 50 })
      .then((res) => {
        setEvents(res.data || []);
      })
      .catch((err) => console.error('Failed to load events', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((ev) =>
    (ev.name || ev.title)?.toLowerCase().includes(search.toLowerCase()) ||
    (ev.location || ev.venue)?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRegisterClick = (eventId) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/student/events/${eventId}/register`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Campus Events & Activities
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Discover workshops, fests, hackathons, and guest seminars
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by event or venue..."
          className="w-full md:w-72"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4 bg-surface">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const isPast = ev.event_date && new Date(ev.event_date) < new Date();
            const isClosed =
              isPast ||
              (ev.status || '').toLowerCase() === 'completed' ||
              (ev.status || '').toLowerCase() === 'closed';
            const isSoldOut = ev.available_seats !== undefined && ev.available_seats <= 0;
            const isCancelled = (ev.status || '').toLowerCase() === 'cancelled';

            return (
              <Card
                key={ev.id}
                className="flex flex-col justify-between p-6 bg-surface hover:shadow-card transition-all duration-200 border border-line rounded-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge
                      status={
                        isCancelled
                          ? 'cancelled'
                          : isClosed
                          ? 'closed'
                          : ev.status || 'published'
                      }
                    />
                    <span className="text-xs font-semibold text-muted flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {isClosed
                        ? 'Event Concluded'
                        : ev.available_seats !== undefined
                        ? `${ev.available_seats} seats left`
                        : `${ev.capacity} capacity`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink leading-snug mb-2">
                    {ev.name || ev.title}
                  </h3>

                  <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
                    {ev.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2 py-3 border-y border-line text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDateTime(ev.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{ev.location || ev.venue || 'Campus Auditorium'}</span>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-muted block text-[11px]">Regular Price</span>
                      <span className="font-bold text-ink text-sm">
                        {Number(ev.non_member_price ?? ev.price) === 0 ? 'Free' : formatCurrency(ev.non_member_price ?? ev.price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary block text-[11px] font-medium">
                        Member Price
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {Number(ev.member_price) === 0
                          ? 'Free'
                          : formatCurrency(ev.member_price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <Button
                    variant={isClosed || isCancelled || isSoldOut ? 'outline' : 'primary'}
                    size="md"
                    className="w-full justify-center"
                    disabled={isSoldOut || isCancelled || isClosed}
                    onClick={() => handleRegisterClick(ev.id)}
                    icon={!isSoldOut && !isCancelled && !isClosed ? ArrowRight : undefined}
                  >
                    {isCancelled
                      ? 'Event Cancelled'
                      : isClosed
                      ? 'Event Closed'
                      : isSoldOut
                      ? 'Sold Out'
                      : 'Register Now'}
                  </Button>
                </div>
              </Card>
            );
          })}

        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No events scheduled"
          description="There are currently no upcoming events matching your search."
        />
      )}
    </div>
  );
};

export default EventsBrowse;
