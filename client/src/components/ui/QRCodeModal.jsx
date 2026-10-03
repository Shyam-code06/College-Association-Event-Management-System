import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Download, CheckCircle2 } from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose, ticketData }) => {
  if (!ticketData) return null;

  const handleDownload = () => {
    if (!ticketData.qr_code_data_url) return;
    const link = document.createElement('a');
    link.href = ticketData.qr_code_data_url;
    link.download = `ticket-${ticketData.registration_id || 'qr'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Gate Pass" maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div>
          <h4 className="text-base font-bold text-ink">{ticketData.event_name}</h4>
          <p className="text-xs text-muted mt-0.5">
            {ticketData.event_date} • {ticketData.location}
          </p>
        </div>

        <div className="p-3 bg-surface border-2 border-primary/20 rounded-lg shadow-sm">
          {ticketData.qr_code_data_url ? (
            <img
              src={ticketData.qr_code_data_url}
              alt="Gate QR Pass"
              className="h-56 w-56 object-contain"
            />
          ) : (
            <div className="h-56 w-56 bg-canvas flex items-center justify-center text-xs text-muted">
              Loading QR Pass...
            </div>
          )}
        </div>

        <div className="w-full bg-canvas rounded-md p-2.5 text-xs text-muted flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Present this QR code at the check-in gate</span>
        </div>

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
