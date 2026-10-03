import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QRCodeModal } from '@/components/ui/QRCodeModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventsApi } from '@/api/events';
import { ticketsApi } from '@/api/tickets';
import { formatDateTime } from '@/utils/format';

export const MyTickets = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    eventsApi
      .getMyRegistrations()
      .then((res) => {
        setRegistrations(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load tickets', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleShowQr = async (reg) => {
    setLoadingQr(true);
    try {
      const res = await ticketsApi.getQrCode(reg.id);
      const qrDataUrl = res.data?.qrDataUrl || res.data?.qrCode || res.qrDataUrl;
      const qrToken = res.data?.qrToken || res.qrToken || reg.qr_token;

      setSelectedTicket({
        registration_id: reg.id,
        event_name: reg.event_title || reg.title || 'Association Event',
        event_date: formatDateTime(reg.event_date),
        location: reg.venue || 'Campus Hall',
        qr_code_data_url: qrDataUrl,
        qr_token: qrToken,
      });
      setIsQrModalOpen(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to load QR code pass.');
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            My Event Passes & Tickets
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Access secure digital passes with dynamic QR codes for gate check-in
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/events')}>
          Browse More Events
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3 bg-surface">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {registrations.map((reg) => (
            <Card
              key={reg.id}
              className="p-6 bg-surface border border-line rounded-lg shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge status={reg.status || 'CONFIRMED'} />
                  <span className="text-[11px] font-mono text-muted">
                    Pass #{reg.id}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink leading-snug mb-2">
                  {reg.event_title || 'Campus Event'}
                </h3>

                <div className="space-y-1.5 py-3 border-y border-line text-xs text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatDateTime(reg.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{reg.venue || 'Campus Hall'}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleShowQr(reg)}
                icon={QrCode}
                className="w-full justify-center"
                isLoading={loadingQr && selectedTicket?.registration_id === reg.id}
              >
                Show Gate QR Pass
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No event passes found"
          description="You haven't registered for any campus events yet."
          actionLabel="Browse Events"
          onAction={() => navigate('/events')}
        />
      )}

      {/* Large QR pass modal */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        ticketData={selectedTicket}
      />
    </div>
  );
};

export default MyTickets;
