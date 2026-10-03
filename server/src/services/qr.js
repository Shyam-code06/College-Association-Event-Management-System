const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generates an unguessable crypto-secure random token for ticket verification.
 *
 * @returns {string}
 */
const generateTicketToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generates a Base64 Data URL for a QR code string.
 *
 * @param {string} token
 * @returns {Promise<string>}
 */
const generateQrDataUrl = async (token) => {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 8,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  });
};

module.exports = {
  generateTicketToken,
  generateQrDataUrl
};
