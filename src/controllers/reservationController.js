import { Reservation } from '../models/Reservation.js';
import { ReservationEmail } from '../models/ReservationEmail.js';
import { generateEmailPreview, sendReservationEmail, sendTeamNotificationEmail } from '../services/emailService.js';
import { sendReservationConfirmation, sendWhatsAppMessage } from '../services/whatsappService.js';

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
    console.log('Fetching reservation by ID:', id);
    
    const reservation = await Reservation.getById(id);
    
    if (!reservation) {
      console.log('Reservation not found for ID:', id);
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Mark reservation as viewed when accessed
    // Get admin email from JWT token (set by authenticateToken middleware)
    const adminEmail = req.user?.email;
    
    console.log('Admin viewing reservation:', adminEmail);
    
    // Only track if we have a valid admin email and is_viewed column exists
    if (adminEmail && reservation.hasOwnProperty('is_viewed')) {
      try {
        if (!reservation.is_viewed) {
          await Reservation.markAsViewed(id, adminEmail);
          reservation.is_viewed = true;
          reservation.last_viewed_by = adminEmail;
          reservation.last_viewed_at = new Date();
        } else if (reservation.last_viewed_by !== adminEmail) {
          // Update viewed by current admin even if already viewed by someone else
          await Reservation.markAsViewed(id, adminEmail);
          reservation.last_viewed_by = adminEmail;
          reservation.last_viewed_at = new Date();
        }
      } catch (markError) {
        // If markAsViewed fails (column doesn't exist), just continue without tracking
        console.warn('⚠️ Could not mark reservation as viewed:', markError.message);
      }
    } else {
      if (!adminEmail) {
        console.warn('⚠️ No admin email found in JWT token - not tracking view');
      }
    }
    
    console.log('Reservation found:', reservation.reservation_uuid);
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation by ID:', error);
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
    console.log('Creating reservation with data:', req.body);
    
    // Validate required fields
    if (!req.body.Service_UUID) {
      console.error('Missing Service_UUID in reservation data');
      return res.status(400).json({ error: 'Service UUID is required' });
    }
    
    if (!req.body.NomClient || !req.body.Email || !req.body.NumeroTelephone) {
      console.error('Missing required fields:', {
        hasNomClient: !!req.body.NomClient,
        hasEmail: !!req.body.Email,
        hasNumeroTelephone: !!req.body.NumeroTelephone
      });
      return res.status(400).json({ error: 'Client name, email, and phone number are required' });
    }
    
    // If payment method is online, set status to pending_payment
    const reservationData = { ...req.body };
    if (reservationData.ModePaiement && 
        (reservationData.ModePaiement.toLowerCase().includes('online') || 
         reservationData.ModePaiement.toLowerCase().includes('ligne'))) {
      reservationData.StatusRes = 'pending_payment';
    }
    
    console.log('Calling Reservation.create with data:', reservationData);
    const reservation = await Reservation.create(reservationData);
    console.log('Reservation created successfully:', reservation.reservation_uuid);
    
    // Get full reservation with service details for email
    const fullReservation = await Reservation.getById(reservation.reservation_uuid);
    
    // Emit WebSocket event for new reservation
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new:reservation', fullReservation);
      console.log('Emitted new:reservation event');
    }
    
    // Automatically send "request" email to the client
    // Send email asynchronously to not block the response
    sendReservationEmail(fullReservation, 'request', null, 'fr')
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('✅ Request email sent successfully to:', fullReservation.email);
        } else {
          console.error('❌ Failed to send request email:', emailResult.error);
        }
      })
      .catch((emailError) => {
        console.error('❌ Error sending request email:', emailError);
        // Don't fail the reservation creation if email fails
      });
    
    // Automatically send team notification email
    // Send email asynchronously to not block the response
    sendTeamNotificationEmail(fullReservation)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('✅ Team notification email sent successfully');
        } else {
          console.error('❌ Failed to send team notification email:', emailResult.error);
        }
      })
      .catch((emailError) => {
        console.error('❌ Error sending team notification email:', emailError);
        // Don't fail the reservation creation if email fails
      });
    
    res.status(201).json(fullReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    console.error('Error stack:', error.stack);
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
    
    // Get admin email from JWT token - only track if valid
    const adminEmail = req.user?.email || null;
    
    console.log('Admin updating reservation:', adminEmail);
    
    // Update the reservation
    const reservation = await Reservation.update(id, req.body, adminEmail);
    
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

// Get notifications for reservations viewed but not modified by other admins
export const getViewedButNotModifiedNotifications = async (req, res) => {
  try {
    // Get current admin email from JWT token
    const adminEmail = req.user?.email || 'unknown';
    
    console.log('🔔 Getting notifications for admin:', adminEmail);
    
    const notifications = await Reservation.getViewedButNotModified(adminEmail);
    
    console.log('🔔 Found notifications:', notifications.length);
    
    res.json(notifications);
  } catch (error) {
    console.error('🔔 Error fetching viewed but not modified notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentAdminViewedButNotModified = async (req, res) => {
  try {
    // Get current admin email from JWT token
    const adminEmail = req.user?.email || 'unknown';
    
    if (adminEmail === 'unknown') {
      return res.status(401).json({ error: 'Admin email not found in token.' });
    }
    
    console.log('🔔 Getting current admin viewed but not modified reservations for:', adminEmail);
    
    const reservations = await Reservation.getCurrentAdminViewedButNotModified(adminEmail);
    
    console.log('🔔 Found reservations:', reservations.length);
    
    res.json(reservations);
  } catch (error) {
    console.error('🔔 Error fetching current admin viewed but not modified reservations:', error);
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
      // Auto-update status to 'confirmed' when confirmation message is sent via WhatsApp
      const { emailType } = req.body;
      if (emailType === 'confirm' && reservation.statusres !== 'confirmed') {
        try {
          await Reservation.update(reservation.reservation_uuid, {
            NomClient: reservation.nomclient,
            Email: reservation.email,
            NumeroTelephone: reservation.numerotelephone,
            DateRes: reservation.dateres,
            HeureRes: reservation.heureres,
            Service_UUID: reservation.service_uuid,
            ModePaiement: reservation.modepaiement,
            PrixTotal: reservation.prixtotal,
            NbrPersonne: reservation.nbrpersonne,
            StatusRes: 'confirmed',
            Note: reservation.note || '',
          });
          
          // Emit WebSocket event for reservation update
          const io = req.app.get('io');
          if (io) {
            const updatedReservation = await Reservation.getById(reservation.reservation_uuid);
            io.to('admin').emit('update:reservation', updatedReservation);
          }
        } catch (updateError) {
          console.error('Error auto-updating reservation status:', updateError);
          // Don't fail the WhatsApp send if status update fails
        }
      }
      
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
        case 'request':
          subject = lang === 'fr' 
            ? 'Demande de réservation reçue - Mor Thai Spa'
            : 'Reservation Request Received - Mor Thai Spa';
          break;
        case 'unavailability':
          subject = lang === 'fr'
            ? 'Non-disponibilité de créneaux - Mor Thai Spa'
            : 'Slot Unavailability - Mor Thai Spa';
          break;
        case 'refund_request':
          subject = lang === 'fr'
            ? 'Demande de remboursement - Mor Thai Spa'
            : 'Refund Request - Mor Thai Spa';
          break;
        case 'down_payment':
          subject = lang === 'fr'
            ? 'Paiement d\'acompte - Mor Thai Spa'
            : 'Down Payment - Mor Thai Spa';
          break;
        case 'tripadvisor_review':
          subject = lang === 'fr'
            ? 'Demande d\'avis Tripadvisor - Mor Thai Spa'
            : 'Tripadvisor Review Request - Mor Thai Spa';
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
        case 'custom':
          subject = lang === 'fr' ? 'Message - Mor Thai Spa' : 'Message - Mor Thai Spa';
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
        // Store email in database for conversation tracking
        try {
          const sentBy = req.user?.username || req.user?.nom || 'Admin';
          await ReservationEmail.create({
            reservation_uuid: id,
            email_type: emailType,
            subject: subject,
            from_email: process.env.SMTP_EMAIL || 'omardaou57@gmail.com',
            to_email: reservation.email,
            body_text: textContent,
            body_html: html,
            message_id: result.messageId,
            thread_id: null, // Will be set when Gmail API integration is added
            in_reply_to: null,
            direction: 'sent',
            sent_by: sentBy
          });
        } catch (emailStoreError) {
          console.error('Error storing email in database:', emailStoreError);
          // Don't fail the email send if storage fails
        }

        // Auto-update status to 'confirmed' when confirmation email is sent
        if (emailType === 'confirm' && reservation.statusres !== 'confirmed') {
          try {
            await Reservation.update(reservation.reservation_uuid, {
              NomClient: reservation.nomclient,
              Email: reservation.email,
              NumeroTelephone: reservation.numerotelephone,
              DateRes: reservation.dateres,
              HeureRes: reservation.heureres,
              Service_UUID: reservation.service_uuid,
              ModePaiement: reservation.modepaiement,
              PrixTotal: reservation.prixtotal,
              NbrPersonne: reservation.nbrpersonne,
              StatusRes: 'confirmed',
              Note: reservation.note || '',
            });
            
            // Emit WebSocket event for reservation update
            const io = req.app.get('io');
            if (io) {
              const updatedReservation = await Reservation.getById(reservation.reservation_uuid);
              io.to('admin').emit('update:reservation', updatedReservation);
            }
          } catch (updateError) {
            console.error('Error auto-updating reservation status:', updateError);
            // Don't fail the email send if status update fails
          }
        }
        
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
      // Store email in database for conversation tracking
      try {
        const sentBy = req.user?.username || req.user?.nom || 'Admin';
        await ReservationEmail.create({
          reservation_uuid: id,
          email_type: emailType,
          subject: result.subject,
          from_email: process.env.SMTP_EMAIL || 'omardaou57@gmail.com',
          to_email: reservation.email,
          body_text: result.textContent,
          body_html: result.htmlContent,
          message_id: result.messageId,
          thread_id: null, // Will be set when Gmail API integration is added
          in_reply_to: null,
          direction: 'sent',
          sent_by: sentBy
        });
      } catch (emailStoreError) {
        console.error('Error storing email in database:', emailStoreError);
        // Don't fail the email send if storage fails
      }

      // Auto-update status to 'confirmed' when confirmation email is sent
      if (emailType === 'confirm' && reservation.statusres !== 'confirmed') {
        try {
          await Reservation.update(reservation.reservation_uuid, {
            NomClient: reservation.nomclient,
            Email: reservation.email,
            NumeroTelephone: reservation.numerotelephone,
            DateRes: reservation.dateres,
            HeureRes: reservation.heureres,
            Service_UUID: reservation.service_uuid,
            ModePaiement: reservation.modepaiement,
            PrixTotal: reservation.prixtotal,
            NbrPersonne: reservation.nbrpersonne,
            StatusRes: 'confirmed',
            Note: reservation.note || '',
          });
          
          // Emit WebSocket event for reservation update
          const io = req.app.get('io');
          if (io) {
            const updatedReservation = await Reservation.getById(reservation.reservation_uuid);
            io.to('admin').emit('update:reservation', updatedReservation);
          }
        } catch (updateError) {
          console.error('Error auto-updating reservation status:', updateError);
          // Don't fail the email send if status update fails
        }
      }
      
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

