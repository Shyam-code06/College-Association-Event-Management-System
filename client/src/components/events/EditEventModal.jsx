import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { eventsApi } from '@/api/events';

export const EditEventModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    event_date: '',
    start_time: '10:00',
    capacity: 100,
    non_member_price: 0,
    member_price: 0,
    status: 'published',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      // Parse event_date to YYYY-MM-DD
      let dateVal = '';
      if (event.event_date) {
        dateVal = event.event_date.split('T')[0];
      }

      // Parse start_time to HH:MM
      let timeVal = '10:00';
      if (event.start_time) {
        timeVal = event.start_time.substring(0, 5);
      }

      setFormData({
        name: event.name || event.title || '',
        location: event.location || event.venue || '',
        event_date: dateVal,
        start_time: timeVal,
        capacity: event.capacity || 100,
        non_member_price: event.non_member_price !== undefined ? Number(event.non_member_price) : Number(event.price || 0),
        member_price: Number(event.member_price || 0),
        status: (event.status || 'published').toLowerCase(),
        description: event.description || '',
      });
      setErrors({});
    }
  }, [event, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Event name is required';
    if (!formData.location?.trim()) newErrors.location = 'Venue/location is required';
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const regPrice = Number(formData.non_member_price || 0);
      const memPrice = Number(formData.member_price || 0);

      await eventsApi.update(event.id, {
        name: formData.name.trim(),
        location: formData.location.trim(),
        event_date: formData.event_date,
        start_time: formData.start_time ? `${formData.start_time}:00` : '10:00:00',
        capacity: Number(formData.capacity),
        is_paid: regPrice > 0,
        non_member_price: regPrice,
        member_price: memPrice,
        status: formData.status,
        description: formData.description?.trim() || null,
      });

      toast.success('Event updated successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.message || err?.raw?.message || 'Failed to update event.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Event Details"
      subtitle={`Modify parameters for "${event?.name || event?.title || 'Event'}"`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <FormField label="Event Name" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Apex Hackathon 2026"
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Event Date" required error={errors.event_date}>
            <Input
              type="date"
              value={formData.event_date}
              onChange={(e) => handleChange('event_date', e.target.value)}
            />
          </FormField>

          <FormField label="Start Time" required>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Campus Venue / Location" required error={errors.location}>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g. Auditorium A, Block 3"
            />
          </FormField>

          <FormField label="Total Seating Capacity" required error={errors.capacity}>
            <Input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Regular Price (INR)">
            <Input
              type="number"
              min="0"
              step="any"
              value={formData.non_member_price}
              onChange={(e) => handleChange('non_member_price', e.target.value)}
              placeholder="0 for Free"
            />
          </FormField>

          <FormField label="Member Price (INR)">
            <Input
              type="number"
              min="0"
              step="any"
              value={formData.member_price}
              onChange={(e) => handleChange('member_price', e.target.value)}
              placeholder="0 for Free"
            />
          </FormField>

          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </FormField>
        </div>

        <FormField label="Description">
          <Textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Event agenda, keynote speaker details, rules..."
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEventModal;
