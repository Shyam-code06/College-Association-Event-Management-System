import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  Clock,
  Calendar,
  Search,
  ChevronDown,
  Trash2,
  Users,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { eventsApi } from '@/api/events';
import { ticketsApi } from '@/api/tickets';
import { formatDateTime } from '@/utils/format';

export const GateScanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Searchbar for events
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Result state
  const [scanResult, setScanResult] = useState(null); // { valid: boolean, reason, message, attendee, registrationId, token }
  const [recentScans, setRecentScans] = useState([]);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [feedTab, setFeedTab] = useState('scans'); // 'scans' | 'attendees'

  // Delete Attendance Modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { registrationId, qrToken, attendeeName }
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);

  // 3-second scan cooldown map: Map<cleanToken, timestampMs>
  const lastScanMapRef = useRef(new Map());
  const scannerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsEventDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch events excluding completed or cancelled ones
  useEffect(() => {
    eventsApi
      .list({ limit: 100 })
      .then((res) => {
        const list = res.data || [];
        // Filter out completed and cancelled events
        const activeList = list.filter((ev) => {
          const st = String(ev.status || '').toLowerCase();
          return st !== 'completed' && st !== 'cancelled';
        });
        setEvents(activeList);
        if (!selectedEventId && activeList.length > 0) {
          setSelectedEventId(String(activeList[0].id));
        }
      })
      .catch((err) => {
        console.error('Failed to load events for scanner', err);
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  // Load checked-in attendees for the active event
  const loadEventAttendees = async (eventId) => {
    if (!eventId) return;
    setLoadingAttendees(true);
    try {
      const res = await eventsApi.getEventRegistrations(eventId, { limit: 100 });
      const checkedInList = (res.data || []).filter(
        (r) => Boolean(r.checked_in || r.checked_in_at || r.check_in_time)
      );
      setEventAttendees(checkedInList);
    } catch (err) {
      console.warn('Failed to load event attendees', err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadEventAttendees(selectedEventId);
    }
  }, [selectedEventId]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const title = (ev.title || ev.name || '').toLowerCase();
      const q = eventSearchQuery.toLowerCase().trim();
      return title.includes(q);
    });
  }, [events, eventSearchQuery]);

  const selectedEvent = useMemo(() => {
    return events.find((ev) => String(ev.id) === String(selectedEventId));
  }, [events, selectedEventId]);

  const handleVerifyToken = async (token) => {
    const cleanToken = token ? token.trim() : '';
    if (!cleanToken) return;

    if (!selectedEventId) {
      toast.error('Please select an active event first.');
      return;
    }

    // 3-second cooldown for the same card
    const now = Date.now();
    const lastScanTime = lastScanMapRef.current.get(cleanToken);
    if (lastScanTime && now - lastScanTime < 3000) {
      const remainingSeconds = Math.ceil((3000 - (now - lastScanTime)) / 1000);
      toast(`Card recently scanned. Please wait ${remainingSeconds}s before re-scanning same card.`, {
        icon: '⏳',
        id: `cooldown-${cleanToken}`,
        duration: 1500,
      });
      return;
    }
    lastScanMapRef.current.set(cleanToken, now);

    setIsVerifying(true);
    try {
      const res = await ticketsApi.scanTicket({
        qrToken: cleanToken,
        eventId: Number(selectedEventId),
      });

      const attendeeName =
        res.attendee?.name || res.data?.student_name || res.data?.name || 'Attendee';
      const regId = res.attendee?.registrationId || res.data?.registrationId || null;

      const result = {
        valid: true,
        message: res.message || 'Access Granted. Valid Entry.',
        attendee: attendeeName,
        registrationId: regId,
        timestamp: new Date(),
        token: cleanToken,
      };

      setScanResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 19)]);
      toast.success(`Ticket Verified: ${attendeeName}`);
      loadEventAttendees(selectedEventId);
    } catch (err) {
      const reason = err?.errors?.[0]?.message || err?.message || 'INVALID_TICKET';
      const result = {
        valid: false,
        reason: reason,
        message: err?.message || 'Verification Failed',
        attendee: err?.attendeeName || null,
        registrationId: err?.registrationId || null,
        timestamp: new Date(),
        token: cleanToken,
      };

      setScanResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 19)]);
      toast.error(`Entry Denied: ${result.message}`);
    } finally {
      setIsVerifying(false);
      setManualToken('');
    }
  };

  // Setup HTML5 QR Scanner
  useEffect(() => {
    if (scanMode === 'camera' && selectedEventId) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleVerifyToken(decodedText);
        },
        (_err) => {
          // Continuous scan error callback, ignore normal frame missed
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [scanMode, selectedEventId]);

  // Handle Delete Attendance
  const handleDeleteAttendance = async (e) => {
    e.preventDefault();
    if (!deleteReason.trim()) {
      toast.error('Please specify a reason for deleting attendance.');
      return;
    }

    setIsDeletingAttendance(true);
    try {
      await ticketsApi.deleteAttendance({
        registrationId: deleteTarget.registrationId,
        qrToken: deleteTarget.qrToken,
        reason: deleteReason.trim(),
      });

      toast.success(
        `Attendance deleted for ${deleteTarget.attendeeName || 'Attendee'}.`
      );

      // Clear scan cooldown for this card so it can be re-scanned if needed
      if (deleteTarget.qrToken) {
        lastScanMapRef.current.delete(deleteTarget.qrToken);
      }

      // If active scan result matches, clear it
      if (
        scanResult &&
        (scanResult.token === deleteTarget.qrToken ||
          scanResult.registrationId === deleteTarget.registrationId)
      ) {
        setScanResult(null);
      }

      // Mark as revoked in recentScans
      setRecentScans((prev) =>
        prev.map((scan) =>
          scan.token === deleteTarget.qrToken ||
          (deleteTarget.registrationId && scan.registrationId === deleteTarget.registrationId)
            ? { ...scan, revoked: true }
            : scan
        )
      );

      // Refresh attendee list
      loadEventAttendees(selectedEventId);

      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete attendance record.');
    } finally {
      setIsDeletingAttendance(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Searchable Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            Gate Pass Scanner
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time digital ticket validation for campus gates & check-in desks
          </p>
        </div>

        {/* Searchable Event Selector (Excludes Completed Events) */}
        <div ref={dropdownRef} className="relative w-full sm:w-80">
          <button
            type="button"
            onClick={() => setIsEventDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-surface border border-line rounded-lg shadow-sm text-left hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm text-ink truncate">
                {selectedEvent ? selectedEvent.title || selectedEvent.name : 'Select Active Event'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted shrink-0" />
          </button>

          {isEventDropdownOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-full sm:w-96 bg-surface border border-line rounded-lg shadow-xl p-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search active events..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas border border-line rounded-md text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-line/40">
                {filteredEvents.length === 0 ? (
                  <p className="text-xs text-muted text-center py-3">No active events found</p>
                ) : (
                  filteredEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(String(ev.id));
                        setIsEventDropdownOpen(false);
                        setScanResult(null);
                        setEventSearchQuery('');
                      }}
                      className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors hover:bg-canvas ${
                        String(ev.id) === String(selectedEventId)
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-ink'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="block truncate font-medium">{ev.title || ev.name}</span>
                        {ev.event_date && (
                          <span className="block text-[10px] text-muted">{ev.event_date}</span>
                        )}
                      </div>
                      <Badge
                        status={
                          String(ev.status).toUpperCase() === 'PUBLISHED'
                            ? 'CONFIRMED'
                            : 'DRAFT'
                        }
                      >
                        {ev.status || 'Active'}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {loadingEvents ? (
        <Card className="p-8 text-center bg-surface border border-line">
          <p className="text-xs text-muted">Loading campus events...</p>
        </Card>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Active Events Found"
          description="There are currently no active or upcoming events created. Completed events are filtered out."
          actionLabel="Create Event"
          onAction={() => navigate('/organizer/events/new')}
        />
      ) : (
        <>
          {/* Mode Toggle Buttons */}
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Button
              variant={scanMode === 'camera' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScanMode('camera')}
              icon={Camera}
            >
              Camera Scanner
            </Button>
            <Button
              variant={scanMode === 'manual' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScanMode('manual')}
              icon={Keyboard}
            >
              Manual Token Entry
            </Button>
          </div>

          {/* Main Scanner Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Scanner / Input */}
            <Card className="p-6 bg-surface border border-line rounded-lg shadow-card flex flex-col items-center justify-center">
              {scanMode === 'camera' ? (
                <div className="w-full">
                  <div
                    id="qr-reader-container"
                    className="w-full overflow-hidden rounded-lg border border-line"
                  />
                  <p className="text-center text-xs text-muted mt-3">
                    Align the attendee&apos;s phone QR code within the camera frame.
                    <span className="block text-[11px] text-muted/80 mt-0.5">
                      (Includes automatic 3s duplicate scan protection)
                    </span>
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyToken(manualToken);
                  }}
                  className="w-full space-y-4 py-8"
                >
                  <div className="text-center mb-4">
                    <Keyboard className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h3 className="font-bold text-base text-ink">Enter Pass ID or Ticket Token</h3>
                    <p className="text-xs text-muted">
                      Type the Pass ID (e.g. <strong>#3</strong>) or paste the alphanumeric QR token
                    </p>
                  </div>

                  <Input
                    placeholder="e.g. #3 or SKY-TKT-8f92b7c4"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    disabled={isVerifying}
                    autoFocus
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    isLoading={isVerifying}
                  >
                    Validate Pass
                  </Button>
                </form>
              )}
            </Card>

            {/* Right: Validation Result Alert */}
            <div className="space-y-6">
              {scanResult ? (
                <div
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    scanResult.valid
                      ? 'bg-success/10 border-success text-success'
                      : 'bg-danger/10 border-danger text-danger'
                  }`}
                >
                  {scanResult.valid ? (
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
                  ) : (
                    <XCircle className="h-16 w-16 mx-auto mb-3" />
                  )}

                  <h2 className="text-xl font-black uppercase tracking-wide">
                    {scanResult.valid ? 'VALID PASS • ENTRY GRANTED' : 'ENTRY REJECTED'}
                  </h2>

                  <p className="text-sm font-semibold mt-2 text-ink">
                    {scanResult.message}
                  </p>

                  {scanResult.valid && (
                    <div className="mt-4 p-3 bg-surface rounded-md border border-line text-ink text-xs font-medium text-left space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Attendee:</span>
                        <span className="font-bold text-sm text-ink">{scanResult.attendee}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-muted">
                        <span>Check-In Time:</span>
                        <span>Just now</span>
                      </div>

                      {/* Delete Attendance Button directly on scan result */}
                      <div className="pt-2 border-t border-line flex justify-end">
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-danger border-danger/30 hover:bg-danger/10"
                          icon={Trash2}
                          onClick={() =>
                            setDeleteTarget({
                              registrationId: scanResult.registrationId,
                              qrToken: scanResult.token,
                              attendeeName: scanResult.attendee,
                            })
                          }
                        >
                          Delete Attendance (Undo Check-In)
                        </Button>
                      </div>
                    </div>
                  )}

                  {scanResult.reason && (
                    <div className="mt-3 text-xs font-mono font-bold">
                      Code: {scanResult.reason}
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-8 text-center bg-surface border border-line h-full flex flex-col items-center justify-center">
                  <QrCode className="h-12 w-12 text-muted/50 mb-3" />
                  <h3 className="font-bold text-base text-ink">Ready to Scan</h3>
                  <p className="text-xs text-muted max-w-xs mt-1">
                    Scan result and attendee verification details will appear here instantly.
                  </p>
                </Card>
              )}

              {/* Feed with Tabs: Recent Scans vs Event Attendees */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedTab('scans')}
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                        feedTab === 'scans'
                          ? 'text-primary bg-primary/10'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 inline mr-1" />
                      Recent Scans ({recentScans.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedTab('attendees')}
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                        feedTab === 'attendees'
                          ? 'text-primary bg-primary/10'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 inline mr-1" />
                      Checked-In Attendees ({eventAttendees.length})
                    </button>
                  </div>

                  {feedTab === 'attendees' && (
                    <button
                      type="button"
                      onClick={() => loadEventAttendees(selectedEventId)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      title="Refresh attendees list"
                    >
                      <RotateCcw className="h-3 w-3" /> Refresh
                    </button>
                  )}
                </div>

                {feedTab === 'scans' ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {recentScans.length > 0 ? (
                      recentScans.map((scan, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-md border flex items-center justify-between text-xs ${
                            scan.revoked
                              ? 'bg-canvas opacity-60 border-line line-through'
                              : 'bg-surface border border-line'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {scan.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-danger shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-ink truncate block">
                                {scan.valid ? scan.attendee : scan.reason || 'Invalid'}
                              </span>
                              <span className="block text-[10px] font-mono text-muted truncate">
                                {scan.token}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              status={
                                scan.revoked
                                  ? 'REJECTED'
                                  : scan.valid
                                  ? 'CONFIRMED'
                                  : 'REJECTED'
                              }
                            >
                              {scan.revoked ? 'REVOKED' : scan.valid ? 'ACCEPTED' : 'DENIED'}
                            </Badge>

                            {scan.valid && !scan.revoked && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    registrationId: scan.registrationId,
                                    qrToken: scan.token,
                                    attendeeName: scan.attendee,
                                  })
                                }
                                title="Delete Attendance / Revoke"
                                className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted italic">No scans recorded yet this session.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {loadingAttendees ? (
                      <p className="text-xs text-muted text-center py-4">Loading attendees...</p>
                    ) : eventAttendees.length > 0 ? (
                      eventAttendees.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 bg-surface rounded-md border border-line flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-ink block">
                              {att.user_name || att.name || 'Student'}
                            </span>
                            <span className="text-[11px] text-muted block">
                              {att.user_email || att.email || '—'} • Check-in:{' '}
                              {formatDateTime(att.checked_in_at || att.check_in_time)}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="xs"
                            className="text-danger border-danger/30 hover:bg-danger/10"
                            icon={Trash2}
                            onClick={() =>
                              setDeleteTarget({
                                registrationId: att.id,
                                qrToken: att.qr_token,
                                attendeeName: att.user_name || att.name || 'Student',
                              })
                            }
                          >
                            Delete Attendance
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted italic text-center py-4">
                        No checked-in attendees for this event yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Attendance Modal with Reason */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteReason('');
        }}
        title="Delete Attendance Record"
        maxWidth="max-w-md"
      >
        {deleteTarget && (
          <form onSubmit={handleDeleteAttendance} className="space-y-4">
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Revoke Check-In Status</span>
                This will reset the attendee&apos;s check-in status for{' '}
                <strong>{deleteTarget.attendeeName}</strong>. The card will become eligible for re-scan.
              </div>
            </div>

            <FormField
              label="Reason for Attendance Deletion"
              required
              hint="State the justification for revoking this check-in (required for audit)"
            >
              <Textarea
                rows={3}
                placeholder="e.g. Scanned by mistake, attendee departed before event commencement, duplicate scan"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                required
                autoFocus
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-danger hover:bg-danger/90 text-white"
                isLoading={isDeletingAttendance}
                icon={Trash2}
              >
                Delete Attendance
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default GateScanner;
