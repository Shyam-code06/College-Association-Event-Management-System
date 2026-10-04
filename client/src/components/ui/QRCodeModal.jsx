import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Download, CheckCircle2, Copy, Check, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QRCodeModal = ({ isOpen, onClose, ticketData }) => {
  const [copied, setCopied] = useState(false);

  if (!ticketData) return null;

  const handleDownload = () => {
    if (!ticketData.qr_code_data_url) return;
    const link = document.createElement('a');
    link.href = ticketData.qr_code_data_url;
    link.download = `ticket-pass-${ticketData.registration_id || 'qr'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = () => {
    const textToCopy = ticketData.qr_token || `#${ticketData.registration_id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Check-in code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Gate Pass" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-3.5">
        {/* Header Details */}
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono mb-1.5">
            <Hash className="h-3.5 w-3.5" />
            Pass ID: {ticketData.registration_id}
          </div>
          <h4 className="text-base font-bold text-ink">{ticketData.event_name}</h4>
          <p className="text-xs text-muted mt-0.5">
            {ticketData.event_date} • {ticketData.location}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-3 bg-surface border-2 border-primary/20 rounded-lg shadow-sm">
          {ticketData.qr_code_data_url ? (
            <img
              src={ticketData.qr_code_data_url}
              alt="Gate QR Pass"
              className="h-52 w-52 object-contain"
            />
          ) : (
            <div className="h-52 w-52 bg-canvas flex items-center justify-center text-xs text-muted">
              Loading QR Pass...
            </div>
          )}
        </div>

        {/* Normal Scanner Instruction */}
        <div className="w-full bg-canvas rounded-md p-2 text-xs text-muted flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Present this QR code to the gate camera scanner</span>
        </div>

        {/* Fallback: Scanner Not Available / Manual Verification */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 uppercase tracking-wide">
              <AlertCircle className="h-3.5 w-3.5" />
              Scanner Not Available?
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-surface/80 rounded px-2 py-1 text-xs font-mono text-ink border border-line flex items-center justify-between">
            <span className="text-muted font-sans text-[11px]">Pass ID:</span>
            <span className="font-bold text-primary">{ticketData.registration_id}</span>
          </div>

          {ticketData.qr_token && (
            <div className="bg-surface/80 rounded px-2.5 py-1.5 text-xs border border-line text-left space-y-1">
              <span className="font-sans text-[11px] text-muted font-medium block">
                Full Check-in Token:
              </span>
              <span className="font-mono text-xs font-semibold text-ink break-all select-all block bg-canvas/70 p-1.5 rounded border border-line/60">
                {ticketData.qr_token}
              </span>
            </div>
          )}

          <p className="text-[10px] text-muted leading-tight">
            Give your <strong>Pass ID ({ticketData.registration_id})</strong> or <strong>Token</strong> to the organizer for manual check-in.
          </p>
        </div>

        {/* Download Button */}
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={handleDownload}
          icon={Download}
        >
          Download Pass Image
        </Button>
      </div>
    </Modal>
  );
};
