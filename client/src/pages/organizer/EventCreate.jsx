import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Wizard } from '@/components/ui/Wizard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createWizardStore } from '@/stores/wizard';
import { eventsApi } from '@/api/events';
import { formatCurrency, formatDateTime } from '@/utils/format';

// Step 1: Basics
const basicsSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  description: z.string().min(5, 'Event description must be at least 5 characters'),
});

const BasicsStep = ({ formData, updateFormData, errors }) => (
  <div className="space-y-4">
    <FormField label="Event Title" required error={errors.title}>
      <Input
        placeholder="e.g. Annual Tech Symposium & Hackathon"
        value={formData.title || ''}
        onChange={(e) => updateFormData({ title: e.target.value })}
      />
    </FormField>

    <FormField label="Event Description" required error={errors.description}>
      <Textarea
        rows={4}
        placeholder="Provide an overview of speakers, schedule, and guidelines..."
        value={formData.description || ''}
        onChange={(e) => updateFormData({ description: e.target.value })}
      />
    </FormField>
  </div>
);

// Helper for min datetime-local string (current date & time)
const getMinDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Step 2: Date & Place
const scheduleSchema = z.object({
  event_date: z
    .string()
    .min(1, 'Please select the event date and time')
    .refine(
      (val) => {
        const selected = new Date(val);
        return !isNaN(selected.getTime()) && selected >= new Date();
      },
      { message: 'Event date cannot be in the past. Please choose a future date & time.' }
    ),
  venue: z.string().min(2, 'Venue is required'),
});

const ScheduleStep = ({ formData, updateFormData, errors }) => {
  const minDateTime = useMemo(() => getMinDateTime(), []);

  return (
    <div className="space-y-4">
      <FormField label="Date & Time" required error={errors.event_date}>
        <Input
          type="datetime-local"
          min={minDateTime}
          value={formData.event_date || ''}
          onChange={(e) => updateFormData({ event_date: e.target.value })}
        />
      </FormField>

      <FormField label="Campus Venue / Auditorium" required error={errors.venue}>
        <Input
          placeholder="e.g. Main Auditorium, Block 3"
          value={formData.venue || ''}
          onChange={(e) => updateFormData({ venue: e.target.value })}
        />
      </FormField>
    </div>
  );
};


// Step 3: Capacity & Pricing
const capacityPricingSchema = z.object({
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 attendee'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  member_price: z.coerce.number().min(0, 'Member price must be 0 or greater'),
});

const CapacityPricingStep = ({ formData, updateFormData, errors }) => (
  <div className="space-y-4">
    <FormField label="Total Seating Capacity" required error={errors.capacity}>
      <Input
        type="number"
        placeholder="e.g. 150"
        value={formData.capacity || ''}
        onChange={(e) => updateFormData({ capacity: e.target.value })}
      />
    </FormField>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Standard Ticket Price (INR)" required error={errors.price}>
        <Input
          type="number"
          placeholder="0 for free"
          value={formData.price ?? ''}
          onChange={(e) => updateFormData({ price: e.target.value })}
        />
      </FormField>

      <FormField label="Member Ticket Price (INR)" required error={errors.member_price}>
        <Input
          type="number"
          placeholder="0 for free"
          value={formData.member_price ?? ''}
          onChange={(e) => updateFormData({ member_price: e.target.value })}
        />
      </FormField>
    </div>
  </div>
);

// Step 4: Review
const ReviewEventStep = ({ formData }) => (
  <div className="space-y-4 text-sm">
    <div className="p-4 rounded-md bg-canvas border border-line space-y-2">
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Title</span>
        <span className="font-semibold text-ink">{formData.title}</span>
      </div>
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Date & Time</span>
        <span className="font-semibold text-ink">
          {formData.event_date ? formatDateTime(formData.event_date) : '—'}
        </span>
      </div>
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Venue</span>
        <span className="font-semibold text-ink">{formData.venue}</span>
      </div>
      <div className="flex justify-between py-1 border-b border-line">
        <span className="text-muted">Max Capacity</span>
        <span className="font-semibold text-ink">{formData.capacity} attendees</span>
      </div>
      <div className="flex justify-between py-1 text-xs">
        <span className="text-muted">Regular / Member Price</span>
        <span className="font-bold text-primary">
          {formatCurrency(formData.price || 0)} / {formatCurrency(formData.member_price || 0)}
        </span>
      </div>
    </div>
  </div>
);

// Step 5: Done
const DoneEventStep = () => (
  <div className="text-center py-6">
    <div className="h-16 w-16 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="h-10 w-10" />
    </div>
    <h3 className="text-xl font-bold text-ink mb-1">Event Created & Published!</h3>
    <p className="text-sm text-muted max-w-sm mx-auto">
      The event is now live on the student portal. Tickets and QR passes will be generated as students register.
    </p>
  </div>
);

export const EventCreate = () => {
  const navigate = useNavigate();

  const wizardStore = useMemo(
    () =>
      createWizardStore({
        title: '',
        description: '',
        event_date: '',
        venue: '',
        capacity: 100,
        price: 0,
        member_price: 0,
      }),
    []
  );

  const steps = [
    {
      id: 'basics',
      title: 'Event Basics',
      subtitle: 'Name and overview of the campus event',
      schema: basicsSchema,
      component: BasicsStep,
    },
    {
      id: 'schedule',
      title: 'Date and Place',
      subtitle: 'Timing and campus auditorium details',
      schema: scheduleSchema,
      component: ScheduleStep,
    },
    {
      id: 'capacity_pricing',
      title: 'Capacity and Pricing',
      subtitle: 'Max attendees and member discount pricing',
      schema: capacityPricingSchema,
      component: CapacityPricingStep,
    },
    {
      id: 'review',
      title: 'Review Event',
      subtitle: 'Check all parameters before publishing',
      component: ReviewEventStep,
    },
    {
      id: 'done',
      title: 'Event Published',
      subtitle: '',
      component: DoneEventStep,
    },
  ];

  const handleSubmit = async (data) => {
    try {
      let dateStr = '';
      let timeStr = '10:00:00';
      if (data.event_date) {
        const parts = data.event_date.split('T');
        dateStr = parts[0];
        if (parts[1]) {
          timeStr = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
        }
      }

      const regularPrice = Number(data.price || 0);
      const memberPrice = Number(data.member_price || 0);
      const isPaid = regularPrice > 0;

      await eventsApi.create({
        name: data.title,
        description: data.description || '',
        event_date: dateStr,
        start_time: timeStr,
        location: data.venue,
        capacity: Number(data.capacity),
        is_paid: isPaid,
        non_member_price: regularPrice,
        member_price: memberPrice,
        status: 'published',
      });
      toast.success(
        'Event published successfully! Announcement and invitation emails have been queued and will be sent automatically in 2 minutes to all association members.',
        { duration: 6000 }
      );
    } catch (err) {
      const msg = err?.message || err?.raw?.message || 'Failed to publish event.';
      toast.error(msg);
      throw err;
    }
  };

  return (
    <div className="py-10 max-w-4xl mx-auto px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/organizer/events')}
        icon={ArrowLeft}
        className="mb-4"
      >
        Back to Events
      </Button>
      <Wizard
        steps={steps}
        store={wizardStore}
        onSubmit={handleSubmit}
        onDone={() => navigate('/organizer/events')}
        confirmButtonText="Publish Event"
        doneButtonText="Back to Events List"
      />
    </div>
  );
};

export default EventCreate;
