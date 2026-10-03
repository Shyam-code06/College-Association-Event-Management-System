import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Award,
  Calendar,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { reportsApi } from '@/api/reports';
import { formatCurrency } from '@/utils/format';
import { useAuthStore } from '@/stores/auth';

export const CollegeOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getCollegeOverview()
      .then((res) => {
        setData(res.data || {});
      })
      .catch((err) => console.error('Failed to load overview', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary-soft text-primary text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {user?.collegeName || 'College Administration'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time management summary of association memberships, events, and revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/admin/finance')}
            icon={IndianRupee}
          >
            Ledger
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/events')}
            icon={Calendar}
          >
            Manage Events
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Association Members"
            value={data?.total_members || 0}
            subtitle="Active student membership passes"
            icon={Award}
            indicator="primary"
          />
          <StatCard
            title="Total Revenue Collected"
            value={formatCurrency(data?.total_revenue || 0)}
            subtitle="Tickets, memberships, and merch"
            icon={IndianRupee}
            indicator="success"
          />
          <StatCard
            title="Total Events Hosted"
            value={data?.total_events || 0}
            subtitle="Campus workshops and fests"
            icon={Calendar}
            indicator="secondary"
          />
          <StatCard
            title="Event Registrations"
            value={data?.total_registrations || 0}
            subtitle="Digital QR gate passes issued"
            icon={Users}
            indicator="primary"
          />
          <StatCard
            title="Pending Claims"
            value={data?.pending_expenses || 0}
            subtitle="Reimbursements awaiting review"
            icon={Receipt}
            indicator={data?.pending_expenses > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Merchandise Orders"
            value={data?.total_orders || 0}
            subtitle="Campus club apparel orders"
            icon={ShoppingBag}
          />
          <StatCard
            title="Active Organizers"
            value={data?.active_organizers || 0}
            subtitle="Authorized event leaders"
            icon={Users}
          />
          <StatCard
            title="Active Campaigns"
            value={data?.active_fundraisers || 0}
            subtitle="Association donation initiatives"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card
          className="p-6 bg-surface border border-line rounded-lg cursor-pointer hover:shadow-card transition-all"
          onClick={() => navigate('/admin/finance')}
        >
          <div className="h-10 w-10 rounded-md bg-primary-soft text-primary flex items-center justify-center mb-3">
            <IndianRupee className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-ink">Finance & Balance</h3>
          <p className="text-xs text-muted mt-1">
            Check double-entry transactions and record manual entries.
          </p>
        </Card>

        <Card
          className="p-6 bg-surface border border-line rounded-lg cursor-pointer hover:shadow-card transition-all"
          onClick={() => navigate('/admin/expenses')}
        >
          <div className="h-10 w-10 rounded-md bg-warning/10 text-warning flex items-center justify-center mb-3">
            <Receipt className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-ink">Expense Claims Queue</h3>
          <p className="text-xs text-muted mt-1">
            Review uploaded bills and approve or reject reimbursement claims.
          </p>
        </Card>

        <Card
          className="p-6 bg-surface border border-line rounded-lg cursor-pointer hover:shadow-card transition-all"
          onClick={() => navigate('/admin/products')}
        >
          <div className="h-10 w-10 rounded-md bg-secondary/10 text-secondary flex items-center justify-center mb-3">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-ink">Merchandise & Stock</h3>
          <p className="text-xs text-muted mt-1">
            Manage product size variants and live apparel stock levels.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CollegeOverview;
