const ticketsService = require('../services/tickets');
const { sendSuccess } = require('../utils/response');

const ticketsController = {
  getQrCode: async (req, res) => {
    const result = await ticketsService.getTicketQrCode(
      req.params.registrationId,
      req.user.id,
      req.collegeId
    );
    return sendSuccess(res, 200, 'Ticket QR Code generated successfully', result);
  },

  scan: async (req, res) => {
    const result = await ticketsService.scanAndCheckIn(
      req.collegeId,
      req.user.id,
      req.body
    );
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  }
};

module.exports = ticketsController;
