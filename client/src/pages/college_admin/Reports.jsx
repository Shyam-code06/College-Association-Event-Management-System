import React, { useState, useEffect, useRef } from 'react';
import { Users, Award, IndianRupee, Calendar, Download, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { reportsApi } from '@/api/reports';
import { formatCurrency } from '@/utils/format';

export const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    reportsApi
      .getCollegeOverview()
      .then((res) => {
        setData(res.data || {});
      })
      .catch((err) => console.error('Failed to load overview report', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !data) return;

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
      pdf.save('college-association-analytics-report.pdf');

      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = data
    ? [
        { name: 'Members', count: Number(data.total_members || 0), color: '#714B67' },
        { name: 'Events', count: Number(data.total_events || 0), color: '#017E84' },
        { name: 'Registrations', count: Number(data.total_registrations || 0), color: '#F2BB62' },
        { name: 'Merch Orders', count: Number(data.total_orders || 0), color: '#28A745' },
      ]
    : [];

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title="College Association Reports"
        subtitle="Aggregate key performance indicators across all student association activities"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Reports', href: '/admin/reports' },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadPdf}
            disabled={loading || !data || isExporting}
            icon={isExporting ? Loader2 : Download}
          >
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
        }
      />

      <div ref={reportRef} className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-white">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(data?.total_revenue || 0)}
                subtitle="All income streams combined"
                icon={IndianRupee}
                indicator="success"
              />
              <StatCard
                title="Active Members"
                value={data?.total_members || 0}
                subtitle="Paid membership passes"
                icon={Award}
                indicator="primary"
              />
              <StatCard
                title="Event Registrations"
                value={data?.total_registrations || 0}
                subtitle="Student tickets generated"
                icon={Users}
                indicator="secondary"
              />
              <StatCard
                title="Campus Events"
                value={data?.total_events || 0}
                subtitle="Workshops & competitions"
                icon={Calendar}
              />
            </div>

            <Card className="p-6 bg-surface border border-line rounded-lg shadow-card">
              <h3 className="font-bold text-base text-ink mb-6">
                Activity Distribution Overview
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
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
