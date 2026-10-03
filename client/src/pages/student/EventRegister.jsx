import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, MapPin, CheckCircle2, CreditCard, Award } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { createWizardStore } from '@/stores/wizard';
import { eventsApi } from '@/api/events';
import { membershipsApi } from '@/api/memberships';
import { ticketsApi } from '@/api/tickets';
import { paymentsApi } from '@/api/payments';
import { formatCurrency, formatDateTime } from '@/utils/format';

// Step 1: Event Summary
const EventStep = ({ formData }) => {
  const event = formData.event || {};
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-2 text-sm">
        <h3 className="font-bold text-base text-ink">{event.title}</h3>
        <p className="text-xs text-muted leading-relaxed">{event.description}</p>
        <div className="pt-2 border-t border-line space-y-1 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatDateTime(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.venue || 'Campus Auditorium'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Price Step
const PriceStep = ({ formData }) => {
  const event = formData.event || {};
  const isMember = Boolean(formData.isMember);
  const membership = formData.membership;
  const standardPrice = Number(event.non_member_price ?? event.price ?? 0);
  const memberPrice = Number(event.member_price ?? 0);
  const applicablePrice = isMember ? memberPrice : standardPrice;

  return (
    <div className="space-y-4 text-sm">
      <div className="p-4 rounded-md bg-canvas border border-line space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted">Membership Tier</span>
          <span className="font-semibold text-ink flex items-center gap-1.5">
            {isMember ? (
              <>
                <Award className="h-4 w-4 text-primary" />
                <span className="text-primary font-bold">
                  {membership?.plan_name ? `${membership.plan_name} (Active Member)` : 'Active Association Member'}
                </span>
              </>
            ) : (
              'Non-Member'
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted">Standard Registration Fee</span>
          <span className={`text-muted ${isMember && standardPrice > applicablePrice ? 'line-through' : ''}`}>
            {formatCurrency(standardPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-line text-base">
          <span className="font-bold text-ink">Final Registration Fee</span>
          <span className="font-extrabold text-primary">
            {applicablePrice === 0 ? 'Free' : formatCurrency(applicablePrice)}
          </span>
        </div>
      </div>

      {isMember ? (
        <p className="text-xs text-secondary font-medium text-center">
          ✓ Association member rate ({formatCurrency(memberPrice)}) applied automatically.
        </p>
      ) : (
        <p className="text-xs text-muted text-center">
          Standard non-member rate applies. Join association membership to unlock member discount!
        </p>
      )}
    </div>
  );
};

// Step 3: Payment Step
const PaymentStep = ({ formData }) => {
  const event = formData.event || {};
  const isMember = Boolean(formData.isMember);
  const standardPrice = Number(event.non_member_price ?? event.price ?? 0);
  const memberPrice = Number(event.member_price ?? 0);
  const applicablePrice = isMember ? memberPrice : standardPrice;

  return (
    <div className="space-y-4 text-center py-2">
      <div className="h-12 w-12 rounded-pill bg-primary-soft text-primary flex items-center justify-center mx-auto mb-2">
        <CreditCard className="h-6 w-6" />
      </div>
      <h4 className="font-bold text-base text-ink">
        {applicablePrice === 0 ? 'Free Pass Authorization' : 'Payment Confirmation'}
      </h4>
      <p className="text-xs text-muted max-w-sm mx-auto">
        {applicablePrice === 0
          ? 'Confirm your reservation for this event at no charge.'
          : `Total amount due: ${formatCurrency(applicablePrice)}. Secure digital clearance.`}
      </p>
    </div>
  );
};

// Step 4: Done Step with QR
const DoneStep = ({ formData }) => {
  return (
    <div className="text-center py-4">
      <div className="h-14 w-14 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">Registration Confirmed!</h3>
      <p className="text-xs text-muted mb-4">
        Your digital pass has been issued. You can view and download your QR code pass anytime from My Tickets.
      </p>

      {formData.qrDataUrl && (
        <div className="p-3 bg-surface border-2 border-primary/20 rounded-lg inline-block shadow-soft mb-2">
          <img
            src={formData.qrDataUrl}
            alt="Ticket QR"
            className="h-44 w-44 object-contain mx-auto"
          />
        </div>
      )}
    </div>
  );
};

export const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingEvent, setLoadingEvent] = useState(true);

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        eventId: id,
        event: null,
        membership: null,
        isMember: false,
        qrDataUrl: null,
      }),
    [id]
  );

  useEffect(() => {
    Promise.allSettled([
      eventsApi.get(id),
      membershipsApi.getMyMembership(),
    ]).then(([evRes, memRes]) => {
      const evData = evRes.status === 'fulfilled' ? evRes.value?.data : null;
      const memData = memRes.status === 'fulfilled' ? memRes.value?.data : null;
      const isMember = Boolean(
        memData?.isActive ||
        String(memData?.status).toUpperCase() === 'ACTIVE'
      );

      wizardStore.getState().updateFormData({
        event: evData,
        membership: memData,
        isMember,
      });
      setLoadingEvent(false);
    });
  }, [id, wizardStore]);

  const steps = [
    {
      id: 'event',
      title: 'Event Details',
      subtitle: 'Review schedule and venue information',
      component: EventStep,
    },
    {
      id: 'price',
      title: 'Pricing & Member Rate',
      subtitle: 'Calculated fee for your student tier',
      component: PriceStep,
    },
    {
      id: 'payment',
      title: 'Pass Authorization',
      subtitle: 'Complete registration clearance',
      component: PaymentStep,
    },
    {
      id: 'done',
      title: 'Registration Pass',
      subtitle: '',
      component: DoneStep,
    },
  ];

  const handleSubmit = async (_formData) => {
    try {
      const regRes = await eventsApi.register(id);
      const regData = regRes.data || {};
      const registration = regData.registration || regData;
      const paymentId = regData.payment?.id || regData.payment_id || registration.payment_id;

      // If a payment is required, process it
      if (paymentId) {
        await paymentsApi.process(paymentId, true);
      }

      // Fetch the generated QR code
      const regId = registration?.id || regData.id;
      if (regId) {
        try {
          const qrRes = await ticketsApi.getQrCode(regId);
          const qr = qrRes.data?.qrDataUrl || qrRes.data?.qrCode || qrRes.qrDataUrl;
          wizardStore.getState().updateFormData({ qrDataUrl: qr });
        } catch (qrErr) {
          console.warn('QR fetch delayed:', qrErr);
        }
      }

      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err?.message || 'Registration failed.');
      throw err;
    }
  };

  if (loadingEvent) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        Loading event information...
      </div>
    );
  }

  return (
    <div className="py-10">
      <Wizard
        steps={steps}
        store={wizardStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/student/tickets')}
        confirmButtonText="Confirm Registration"
        doneButtonText="View My Tickets"
      />
    </div>
  );
};

export default EventRegister;
