import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { ResourceListPage } from '@/components/common/ResourceListPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { announcementsApi } from '@/api/announcements';
import { formatDateTime } from '@/utils/format';

export const AdminAnnouncements = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // New Announcement Modal
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('INFO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    try {
      await announcementsApi.create({
        title,
        content,
        priority,
      });
      toast.success('Announcement broadcasted!');
      setIsOpen(false);
      setTitle('');
      setContent('');
      setPriority('INFO');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to post announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Headline',
      render: (row) => (
        <div>
          <span className="font-bold text-ink">{row.title}</span>
          <span className="block text-xs text-muted truncate max-w-sm">
            {row.content}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge status={row.priority || 'INFO'} />,
    },
    {
      key: 'created_at',
      header: 'Date Published',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <>
      <ResourceListPage
        key={refreshKey}
        title="College Announcements"
        subtitle="Broadcast campus notices, fest updates, and official circulars"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Announcements', href: '/admin/announcements' },
        ]}
        api={announcementsApi.list}
        columns={columns}
        actionLabel="New Broadcast"
        onAction={() => setIsOpen(true)}
        actionIcon={Plus}
        searchPlaceholder="Search circulars..."
      />

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Broadcast Campus Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Headline Title" required>
            <Input
              placeholder="e.g. Schedule Change for Tech Fest"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Alert Priority">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="INFO">Informational (Blue)</option>
              <option value="WARNING">Important Notice (Yellow)</option>
              <option value="DANGER">Urgent / Alert (Red)</option>
            </Select>
          </FormField>

          <FormField label="Message Content" required>
            <Textarea
              rows={4}
              placeholder="Type message text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Broadcast Now
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AdminAnnouncements;
