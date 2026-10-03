import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Award,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth';
import { membershipsApi } from '@/api/memberships';
import { eventsApi } from '@/api/events';
import { formatDateTime } from '@/utils/format';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [membership, setMembership] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      membershipsApi.getMyMembership(),
      eventsApi.getMyRegistrations({ limit: 5 }),
    ]).then(([memRes, regRes]) => {
      if (memRes.status === 'fulfilled' && memRes.value?.data) {
        setMembership(memRes.value.data);
      }
      if (regRes.status === 'fulfilled' && regRes.value?.data) {
        setRegistrations(regRes.value.data);
      }
    });
  }, []);

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
            Welcome to your Skyline student association portal. Track your passes and events.
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
            {membership?.status === 'ACTIVE' ? 'My Plan' : 'Join Association'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Membership Status"
          value={membership?.status === 'ACTIVE' ? 'Active Member' : 'Non-Member'}
          subtitle={membership ? `${membership.plan_name || 'Association Plan'}` : 'Upgrade to get discounts'}
          icon={Award}
          indicator={membership?.status === 'ACTIVE' ? 'success' : 'default'}
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
          value={membership?.merch_discount_percent ? `${membership.merch_discount_percent}% OFF` : '0%'}
          subtitle="Exclusive store savings"
          icon={ShoppingBag}
          indicator="secondary"
        />
        <StatCard
          title="Campus College"
          value={user?.collegeName || 'Skyline'}
          subtitle="Registered student campus"
          icon={Calendar}
        />
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
