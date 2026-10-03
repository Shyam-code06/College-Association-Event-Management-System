import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { eventsApi } from '@/api/events';
import { ticketsApi } from '@/api/tickets';

export const GateScanner = () => {
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Result state
  const [scanResult, setScanResult] = useState(null); // { valid: boolean, reason, message, attendee }
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);

  useEffect(() => {
    eventsApi.list({ limit: 50 }).then((res) => {
      const list = res.data || [];
      setEvents(list);
      if (!selectedEventId && list.length > 0) {
        setSelectedEventId(String(list[0].id));
      }
    });
  }, []);

  const handleVerifyToken = async (token) => {
    if (!token || !selectedEventId) {
      toast.error('Please select an event and provide a token.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await ticketsApi.scanTicket({
        qrToken: token.trim(),
        eventId: Number(selectedEventId),
      });

      const result = {
        valid: true,
        message: res.message || 'Access Granted. Valid Entry.',
        attendee: res.data?.student_name || res.data?.name || 'Attendee',
        timestamp: new Date(),
        token,
      };

      setScanResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
      toast.success('Ticket Verified!');
    } catch (err) {
      const reason = err?.errors?.[0]?.message || err?.message || 'INVALID_TICKET';
      const result = {
        valid: false,
        reason: reason,
        message: err?.message || 'Verification Failed',
        timestamp: new Date(),
        token,
      };

      setScanResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Event Selector */}
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

        <div className="w-full sm:w-72">
          <Select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setScanResult(null);
            }}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

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
                <div className="mt-4 p-3 bg-surface rounded-md border border-line text-ink text-xs font-medium text-left">
                  <span className="text-muted block">Attendee:</span>
                  <span className="font-bold text-sm">{scanResult.attendee}</span>
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

          {/* Recent Scans Feed */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted mb-2 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Recent Scan History</span>
            </div>

            <div className="space-y-2">
              {recentScans.length > 0 ? (
                recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded-md border border-line flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {scan.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-ink">
                          {scan.valid ? scan.attendee : scan.reason || 'Invalid'}
                        </span>
                        <span className="block text-[10px] font-mono text-muted break-all">
                          {scan.token}
                        </span>
                      </div>
                    </div>
                    <Badge status={scan.valid ? 'CONFIRMED' : 'REJECTED'} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted italic">No scans recorded yet this session.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateScanner;
