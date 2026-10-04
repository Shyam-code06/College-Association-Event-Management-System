import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { announcementsApi } from '@/api/announcements';
import { formatDateTime } from '@/utils/format';

export const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    announcementsApi
      .list({ limit: 50 })
      .then((res) => {
        setAnnouncements(res.data || []);
      })
      .catch((err) => console.error('Failed to load announcements', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Campus Announcements & Bulletins
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Official news, alerts, and circulars from the student association council
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-3 bg-surface">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card
              key={item.id}
              className="p-6 bg-surface border border-line rounded-lg shadow-soft space-y-3 hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge status={item.priority || 'INFO'} />
                <span className="text-xs text-muted flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(item.created_at || item.createdAt)}
                </span>
              </div>

              <h3 className="text-base font-bold text-ink">{item.title}</h3>

              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {item.content || item.message}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="There are currently no active broadcast announcements."
        />
      )}
    </div>
  );
};

export default StudentAnnouncements;
