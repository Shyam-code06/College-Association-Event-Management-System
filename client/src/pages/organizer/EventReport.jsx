import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Users,
  CheckCircle2,
  IndianRupee,
  Download,
  Loader2,
  Calendar,
  Plus,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { eventsApi } from '@/api/events';
import { reportsApi } from '@/api/reports';
import { formatCurrency } from '@/utils/format';

export const EventReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    eventsApi
      .list({ limit: 50 })
      .then((res) => {
        const list = res.data || [];
        setEvents(list);
        if (list.length > 0) {
          if (!selectedEventId) {
            setSelectedEventId(String(list[0].id));
          }
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load events', err);
        setLoading(false);
      })
      .finally(() => setEventsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    reportsApi
      .getEventReport(selectedEventId)
      .then((res) => {
        setReport(res.data || null);
      })
      .catch((err) => {
        console.error('Failed to load event report', err);
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const selectedEvent = events.find((e) => String(e.id) === String(selectedEventId));

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !report) return;

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF report...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      
      const fileName = `${(selectedEvent?.title || 'event-report').toLowerCase().replace(/\s+/g, '-')}-analytics.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = report
    ? [
        { name: 'Total Capacity', value: Number(report.capacity || 0), color: '#6C757D' },
        { name: 'Registered', value: Number(report.total_registered || 0), color: '#714B67' },
        { name: 'Checked In', value: Number(report.checked_in || 0), color: '#28A745' },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Event Attendance & Revenue Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Turnout rates, gate check-in statistics, and ticket sales revenue
          </p>
        </div>

        {events.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64">
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadPdf}
              disabled={loading || !report || isExporting}
              icon={isExporting ? Loader2 : Download}
              className={isExporting ? 'animate-pulse' : ''}
            >
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/organizer/events/new')}
            icon={Plus}
          >
            Create Event
          </Button>
        )}
      </div>

      {eventsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Campus Events Yet"
          description="Your campus association has not created any events yet. Create an event to track turnout rates, gate scan attendance, and ticket revenue analytics."
          actionLabel="Create First Event"
          onAction={() => navigate('/organizer/events/new')}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : report ? (
        <div ref={reportRef} className="space-y-8 bg-white p-4 rounded-xl">
          {/* Export Header inside PDF */}
          <div className="border-b border-line pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {selectedEvent?.title || 'Event Analytics Report'}
              </h2>
              <p className="text-xs text-muted">
                Generated from Skyline Student Association Portal
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2 py-1 bg-primary-soft text-primary rounded">
                Official Report
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Registered"
              value={report.total_registered || 0}
              subtitle={`Out of ${report.capacity || 0} seats`}
              icon={Users}
              indicator="primary"
            />
            <StatCard
              title="Gate Check-Ins"
              value={report.checked_in || 0}
              subtitle={`${
                report.total_registered > 0
                  ? Math.round((report.checked_in / report.total_registered) * 100)
                  : 0
              }% attendance turnout`}
              icon={CheckCircle2}
              indicator="success"
            />
            <StatCard
              title="Ticket Revenue"
              value={formatCurrency(report.total_revenue || 0)}
              subtitle="Direct INR collections"
              icon={IndianRupee}
              indicator="secondary"
            />
            <StatCard
              title="Member Ratio"
              value={`${report.member_registrations || 0}`}
              subtitle="Discounted member passes"
              icon={Users}
            />
          </div>

          {/* Bar Chart Visualization */}
          <Card className="p-6 bg-surface border border-line rounded-lg shadow-card">
            <h3 className="font-bold text-base text-ink mb-6">
              Turnout & Capacity Breakdown
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#6C757D" fontSize={12} />
                  <YAxis stroke="#6C757D" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #DEE2E6',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center bg-surface border border-line">
          <p className="text-sm text-muted">No attendance data found for this event.</p>
        </Card>
      )}
    </div>
  );
};

export default EventReport;
