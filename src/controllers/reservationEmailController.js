import { ReservationEmail } from '../models/ReservationEmail.js';
import { Reservation } from '../models/Reservation.js';

// Get all emails (conversation) for a reservation
export const getReservationEmails = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify reservation exists
    const reservation = await Reservation.getById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const emails = await ReservationEmail.getByReservationId(id);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching reservation emails:', error);
    res.status(500).json({ error: error.message });
  }
};

// Sync emails from Gmail API (to be implemented)
export const syncGmailEmails = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify reservation exists
    const reservation = await Reservation.getById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // TODO: Implement Gmail API integration to fetch replies
    // This will require OAuth2 setup and googleapis library
    
    res.json({ 
      message: 'Gmail sync not yet implemented',
      note: 'This will be implemented with Gmail API OAuth2 integration'
    });
  } catch (error) {
    console.error('Error syncing Gmail emails:', error);
    res.status(500).json({ error: error.message });
  }
};

