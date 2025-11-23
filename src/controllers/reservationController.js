import { Reservation } from '../models/Reservation.js';
import { sendReservationConfirmation, sendWhatsAppMessage } from '../services/whatsappService.js';
import { sendReservationEmail, generateEmailPreview } from '../services/emailService.js';

export const getAllReservations = async (req, res) => {
  try {
    const filters = {
      search: req.query.search || null,
      status: req.query.status || 'all',
      payment: req.query.payment || 'all',
      date: req.query.date || null,
      dateStart: req.query.dateStart || null,
      dateEnd: req.query.dateEnd || null,
      type: req.query.type || 'all',
    };

    console.log('Reservation filters received:', filters);
    
    // Get all items (reservations and/or offers based on type filter)
    let results = [];
    
    if (filters.type === 'all') {
      // Get both reservations and offers
      const reservations = await Reservation.getAll({ ...filters, type: 'reservation' });
      const offers = await Reservation.getOffresAsReservations({ ...filters, type: 'offre' });
      results = [...reservations, ...offers].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Sort by created_at descending
      });
    } else {
      // Get only reservations or only offers based on type filter
      // getAll method will route to getOffresAsReservations if type === 'offre'
      results = await Reservation.getAll(filters);
    }
    
    console.log(`Found ${results.length} items`);
    res.json(results);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.getById(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReservationsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const reservations = await Reservation.getByDate(date);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReservationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const reservations = await Reservation.getByStatus(status);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createReservation = async (req, res) => {
  try {
    const reservation = await Reservation.create(req.body);
    
    // Emit WebSocket event for new reservation
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new:reservation', reservation);
      console.log('Emitted new:reservation event');
    }
    
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { StatusRes } = req.body;
    
    // Get current reservation status before update
    const currentReservation = await Reservation.getById(id);
    if (!currentReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const oldStatus = currentReservation.statusres;
    
    // Update the reservation
    const reservation = await Reservation.update(id, req.body);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Emit WebSocket event for reservation update
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('update:reservation', reservation);
      console.log('Emitted update:reservation event');
    }
    
    // Send WhatsApp notification if status changed to "confirmed"
    if (StatusRes === 'confirmed' && oldStatus !== 'confirmed') {
      // Send WhatsApp message asynchronously (don't block the response)
      sendReservationConfirmation(reservation)
        .then(result => {
          if (result.success) {
            console.log(`✅ WhatsApp confirmation sent successfully to ${reservation.numerotelephone}`);
          } else {
            // Check for specific error types and provide helpful messages
            if (result.error && result.error.includes('non-payment')) {
              console.error(`❌ WhatsApp not sent: UltraMsg instance is stopped due to non-payment.`);
              console.error(`   Please extend your UltraMsg subscription to activate the instance.`);
            } else if (result.error && result.error.includes('not authorized')) {
              console.error(`❌ WhatsApp not sent: UltraMsg instance not authorized.`);
              console.error(`   Please check your ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN in .env file.`);
            } else if (result.error && result.error.includes('credentials not configured')) {
              console.warn(`⚠️  WhatsApp not sent: UltraMsg credentials not configured.`);
              console.warn(`   Add ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN to your .env file.`);
            } else {
              console.error(`❌ Failed to send WhatsApp confirmation to ${reservation.numerotelephone}:`, result.error);
            }
          }
        })
        .catch(error => {
          console.error('❌ Error sending WhatsApp confirmation:', error.message || error);
        });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.delete(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json({ message: 'Reservation deleted successfully', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get reservation to get phone number
    const reservation = await Reservation.getById(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (!reservation.numerotelephone) {
      return res.status(400).json({ error: 'Reservation phone number not found' });
    }

    // Send WhatsApp message via UltraMsg
    const result = await sendWhatsAppMessage(reservation.numerotelephone, message);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'WhatsApp message sent successfully',
        data: result.data
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        errorDetails: result.errorDetails
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const previewEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailType, message, language } = req.body;

    if (!emailType) {
      return res.status(400).json({ error: 'Email type is required' });
    }

    // Get reservation details
    const reservation = await Reservation.getById(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Generate HTML preview
    const result = await generateEmailPreview(
      reservation, 
      emailType, 
      message || null, 
      language || 'fr'
    );

    if (result.success) {
      res.json({ 
        success: true, 
        html: result.html
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailType, message, language, html } = req.body;

    if (!emailType) {
      return res.status(400).json({ error: 'Email type is required' });
    }

    // Get reservation details
    const reservation = await Reservation.getById(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (!reservation.email) {
      return res.status(400).json({ error: 'Reservation email not found' });
    }

    // If HTML is provided directly, use it; otherwise generate from template
    if (html && html.trim()) {
      // Import sendEmail function
      const { sendEmail: sendEmailFunc } = await import('../services/emailService.js');
      
      // Get subject based on email type
      let subject = '';
      const lang = language || 'fr';
      switch (emailType) {
        case 'confirm':
          subject = lang === 'fr' 
            ? 'Confirmation de votre réservation - Mor Thai Spa'
            : 'Reservation Confirmation - Mor Thai Spa';
          break;
        case 'reminder':
          subject = lang === 'fr'
            ? 'Rappel : Votre réservation - Mor Thai Spa'
            : 'Reminder: Your Reservation - Mor Thai Spa';
          break;
        case 'cancel':
          subject = lang === 'fr'
            ? 'Annulation de votre réservation - Mor Thai Spa'
            : 'Reservation Cancellation - Mor Thai Spa';
          break;
        case 'change':
          subject = lang === 'fr'
            ? 'Modification de votre réservation - Mor Thai Spa'
            : 'Reservation Change - Mor Thai Spa';
          break;
        default:
          subject = lang === 'fr' ? 'Réservation - Mor Thai Spa' : 'Reservation - Mor Thai Spa';
      }

      // Extract plain text from HTML for text version
      const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      
      const result = await sendEmailFunc(
        reservation.email,
        subject,
        textContent,
        html
      );

      if (result.success) {
        return res.json({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: result.error,
          errorDetails: result.errorDetails
        });
      }
    }

    // Otherwise, use template
    const result = await sendReservationEmail(
      reservation, 
      emailType, 
      message || null, 
      language || 'fr'
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        errorDetails: result.errorDetails
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

