/**
 * Email Service using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';

const SMTP_EMAIL = process.env.SMTP_EMAIL || 'omardaou57@gmail.com';
// Remove spaces from Google App Password if present
const SMTP_PASSWORD = (process.env.SMTP_PASSWORD || 'vxty bbdy qqfb oegv').replace(/\s/g, '');

const BASE_URL = process.env.BASE_URL || 'https://morthai-marrakech.com';

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

/**
 * Generate Google Calendar link for reservation
 * @param {Object} reservationData - Reservation data with date, time, service info
 * @param {string} language - Language (fr or en)
 * @returns {string} Google Calendar URL
 */
function generateGoogleCalendarLink(reservationData, language = 'fr') {
  const {
    dateres,
    heureres,
    NomService,
    NomServiceFr,
    NomServiceEn,
    duree,
    reference
  } = reservationData;

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  // Create start date/time
  const reservationDate = new Date(dateres);
  let startDateTime = new Date(reservationDate);
  
  if (heureres) {
    const [hours, minutes] = heureres.split(':').map(Number);
    startDateTime.setHours(hours, minutes || 0, 0, 0);
  } else {
    // Default to 10:00 AM if no time specified
    startDateTime.setHours(10, 0, 0, 0);
  }

  // Calculate end date/time (default duration is 1 hour)
  let durationMinutes = 60; // Default 1 hour
  if (duree) {
    durationMinutes = parseInt(duree) || 60;
  }
  
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  // Format dates for Google Calendar (format: YYYYMMDDTHHMMSS)
  // Using local time (Marrakech timezone) for better accuracy
  const formatGoogleDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const startDateFormatted = formatGoogleDate(startDateTime);
  const endDateFormatted = formatGoogleDate(endDateTime);

  // Encode URL parameters
  const eventTitle = encodeURIComponent(
    language === 'fr' 
      ? `Réservation Mor Thai SPA - ${serviceName}`
      : `Mor Thai SPA Reservation - ${serviceName}`
  );

  const reservationRef = reference || '';
  const details = encodeURIComponent(
    language === 'fr'
      ? `Réservation: ${serviceName}${reservationRef ? '\nRéférence: ' + reservationRef : ''}\n\nMor Thai SPA\nN° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech.\n\nTéléphone: +212 524 207 055\nEmail: contact@morthai-marrakech.com`
      : `Reservation: ${serviceName}${reservationRef ? '\nReference: ' + reservationRef : ''}\n\nMor Thai SPA\nN° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech.\n\nPhone: +212 524 207 055\nEmail: contact@morthai-marrakech.com`
  );

  const location = encodeURIComponent(
    'N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech, Morocco'
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDateFormatted}/${endDateFormatted}&details=${details}&location=${location}`;
}

/**
 * Generate HTML email template
 */
function generateEmailHTML({
  bannerText,
  bannerColor,
  messageContent,
  reservationData,
  language = 'fr',
  customMessage = null,
  showCalendarLink = true
}) {
  const {
    reference,
    nomclient,
    dateres,
    heureres,
    NomService,
    NomServiceFr,
    NomServiceEn,
    prixtotal,
    nbrpersonne = 1,
    modepaiement,
    created_at
  } = reservationData;

  // Format dates
  const reservationDateObj = new Date(dateres);
  const createdDateObj = new Date(created_at || Date.now());
  
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: true }
  ) : '';
  
  const formattedCreatedDate = createdDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
  const formattedCreatedTime = createdDateObj.toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  );

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  const reservationRef = reference || `MOR-${createdDateObj.getTime().toString().substring(0, 10)}`;

  // Determine duration from reservation data
  // Duration might be in reservation.duree or from service_offers
  let duration = '1h'; // Default
  if (reservationData.duree) {
    const minutes = parseInt(reservationData.duree);
    if (minutes >= 60) {
      duration = `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? minutes % 60 : ''}`;
    } else {
      duration = `${minutes}min`;
    }
  }

  // Payment method translation
  let paymentMethod = modepaiement || '';
  if (language === 'fr') {
    if (paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('espèce')) {
      paymentMethod = 'En espèce';
    } else if (paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('carte')) {
      paymentMethod = 'Par carte';
    } else if (paymentMethod.toLowerCase().includes('ligne') || paymentMethod.toLowerCase().includes('online')) {
      paymentMethod = 'En ligne';
    }
  }

  const helpText = language === 'fr' 
    ? 'Besoin d\'aide'
    : 'Need Help';
  const helpDescription = language === 'fr'
    ? 'Appelez le 0524207055 ou contactez-nous en ligne pour l\'assistance.'
    : 'Call 0524207055 or contact us online for assistance.';

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bannerText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 30px 20px 20px;">
              <img src="${BASE_URL}/logo.svg" alt="Mor Thai Logo" style="max-width: 120px; height: auto;" />
            </td>
          </tr>
          
          <!-- Banner -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: ${bannerColor}; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                      ${bannerText}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message Content -->
          <tr>
            <td style="padding: 30px 20px;">
              ${messageContent || ''}
            </td>
          </tr>
          
          <!-- Reservation Details -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <div style="background-color: #25D366; color: #ffffff; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; font-weight: bold;">
                [${language === 'fr' ? 'RÉSERVATION' : 'RESERVATION'} ${reservationRef}] ${language === 'fr' ? 'LE' : 'ON'} ${formattedCreatedDate} À ${formattedCreatedTime}
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">${language === 'fr' ? 'Soin' : 'Treatment'}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">${language === 'fr' ? 'Nombre de personnes' : 'Number of people'}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">x${nbrpersonne}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">${language === 'fr' ? 'Prix' : 'Price'}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">${(prixtotal / nbrpersonne).toFixed(0)} MAD</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">${language === 'fr' ? 'La durée souhaitée' : 'Desired duration'}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">${duration}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">${language === 'fr' ? 'Mode de paiement' : 'Payment method'}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; font-weight: bold; color: #333; font-size: 16px;">${language === 'fr' ? 'Total' : 'Total'}</td>
                  <td style="padding: 12px; font-weight: bold; color: #333; text-align: right; font-size: 16px;">${prixtotal.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MAD</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px;">
                <p style="margin: 0 0 8px; color: #333; font-weight: bold; font-size: 14px;">${language === 'fr' ? 'Date et heure de réservation:' : 'Reservation date and time:'}</p>
                <p style="margin: 0; color: #666; font-size: 14px;">${formattedReservationDate}</p>
                ${formattedReservationTime ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">${formattedReservationTime}</p>` : ''}
              </div>
              
              ${showCalendarLink ? `
              <!-- Google Calendar Link -->
              <div style="margin-top: 25px; text-align: center;">
                <a href="${generateGoogleCalendarLink(reservationData, language)}" 
                   target="_blank" 
                   style="display: inline-block; background-color: #8B4513; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; transition: background-color 0.3s;">
                  ${language === 'fr' ? 'Ajouter à Google Calendar' : 'Add to Google Calendar'}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding: 0 20px 30px;">
              <p style="margin: 20px 0 0; color: #333; font-size: 16px; line-height: 1.6;">
                ${language === 'fr' ? 'Bien à vous,<br><strong>Equipe Mor Thai SPA</strong>' : 'Best regards,<br><strong>Mor Thai SPA Team</strong>'}
              </p>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 20px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
              <h3 style="margin: 0 0 10px; color: #333; font-size: 16px; font-weight: bold;">${helpText}</h3>
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${helpDescription}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #8B4513; padding: 30px 20px; color: #ffffff;">
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6;">
                N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech.<br>
                (à l'arrière Le Centre Américain).
              </p>
              <p style="margin: 10px 0; font-size: 14px;">
                <strong>${language === 'fr' ? 'Téléphone:' : 'Phone:'}</strong> +212 524 207 055
              </p>
              <p style="margin: 10px 0 20px; font-size: 14px;">
                <strong>${language === 'fr' ? 'Email:' : 'Email:'}</strong> contact@morthai-marrakech.com
              </p>
              <div style="margin-top: 20px;">
                <a href="https://www.facebook.com" target="_blank" style="display: inline-block; margin-right: 10px;">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" style="width: 24px; height: 24px; filter: brightness(0) invert(1);" />
                </a>
                <a href="https://www.instagram.com" target="_blank" style="display: inline-block;">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style="width: 24px; height: 24px; filter: brightness(0) invert(1);" />
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send email via SMTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email text content
 * @param {string} html - Email HTML content (optional)
 * @returns {Promise<Object>} API response
 */
export async function sendEmail(to, subject, text, html = null) {
  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping email.');
    return { success: false, error: 'SMTP credentials not configured' };
  }

  if (!to || !subject || !text) {
    console.warn('Missing email parameters. Skipping email.');
    return { success: false, error: 'Missing required email parameters' };
  }

  try {
    const mailOptions = {
      from: `Mor Thai Spa <${SMTP_EMAIL}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message,
      errorDetails: error 
    };
  }
}

/**
 * Send reservation email based on type
 * @param {Object} reservation - Reservation object with client and service details
 * @param {string} emailType - Type of email (confirm, reminder, cancel, change)
 * @param {string} customMessage - Custom message to include (optional)
 * @param {string} language - Language for the email (fr or en)
 * @returns {Promise<Object>} API response
 */
export async function sendReservationEmail(reservation, emailType, customMessage = null, language = 'fr') {
  if (!reservation || !reservation.email) {
    return { success: false, error: 'Reservation data and email are required' };
  }

  const {
    nomclient,
    email,
    dateres,
    heureres,
    NomService,
    NomServiceFr,
    NomServiceEn,
    prixtotal,
    nbrpersonne = 1,
    modepaiement,
    reference,
    created_at
  } = reservation;

  // Format dates
  const reservationDateObj = new Date(dateres);
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: true }
  ) : '';

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  let subject = '';
  let bannerText = '';
  let bannerColor = '#8B4513';
  let messageContent = '';

  // Define email content based on type
  switch (emailType) {
    case 'confirm':
      subject = language === 'fr' 
        ? 'Confirmation de votre réservation - Mor Thai Spa'
        : 'Reservation Confirmation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RÉSERVATION CONFIRMÉE' : 'RESERVATION CONFIRMED';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim() 
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous sommes ravis que vous ayez choisi le Mor Thaï SPA.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que la date et l'heure de votre demande de réservation ont été confirmées.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous serons honorés de vous accueillir dans nos locaux pour votre séance de détente.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Si vous avez des exigences particulières ou des préférences spécifiques, n'hésitez pas à nous communiquer.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We are delighted that you have chosen Mor Thai SPA.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that the date and time of your reservation request have been confirmed.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We will be honored to welcome you to our premises for your relaxation session.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">If you have any particular requirements or specific preferences, please do not hesitate to communicate them to us.</p>`);
      break;

    case 'reminder':
      subject = language === 'fr'
        ? 'Rappel : Votre réservation - Mor Thai Spa'
        : 'Reminder: Your Reservation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RAPPEL DE RÉSERVATION' : 'RESERVATION REMINDER';
      bannerColor = '#25D366';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Ceci est un rappel que votre réservation pour ${serviceName} est prévue le ${formattedReservationDate} à ${formattedReservationTime}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous vous attendons avec impatience !</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">This is a reminder that your reservation for ${serviceName} is scheduled on ${formattedReservationDate} at ${formattedReservationTime}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We look forward to seeing you!</p>`);
      break;

    case 'cancel':
      subject = language === 'fr'
        ? 'Annulation de votre réservation - Mor Thai Spa'
        : 'Reservation Cancellation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RÉSERVATION ANNULÉE' : 'RESERVATION CANCELLED';
      bannerColor = '#dc3545';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que votre réservation pour ${serviceName} prévue le ${formattedReservationDate} à ${formattedReservationTime} a été annulée.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous sommes désolés pour cet inconvénient. N'hésitez pas à nous contacter pour toute question.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that your reservation for ${serviceName} scheduled on ${formattedReservationDate} at ${formattedReservationTime} has been cancelled.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We apologize for any inconvenience. Please do not hesitate to contact us if you have any questions.</p>`);
      break;

    case 'change':
      subject = language === 'fr'
        ? 'Modification de votre réservation - Mor Thai Spa'
        : 'Reservation Change - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RÉSERVATION MODIFIÉE' : 'RESERVATION CHANGED';
      bannerColor = '#ffc107';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que votre réservation a été modifiée.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Vous trouverez les nouveaux détails ci-dessous.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that your reservation has been changed.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">You will find the new details below.</p>`);
      break;

    case 'unavailability':
      subject = language === 'fr'
        ? 'Non-disponibilité de créneaux - Mor Thai Spa'
        : 'Slot Unavailability - Mor Thai Spa';
      bannerText = language === 'fr' ? 'CRÉNEAU NON DISPONIBLE' : 'SLOT UNAVAILABLE';
      bannerColor = '#ff9800';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous sommes désolés de vous informer que le créneau demandé pour votre réservation (${formattedReservationDate} à ${formattedReservationTime}) n'est malheureusement pas disponible.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous vous proposons de choisir une autre date et heure. N'hésitez pas à nous contacter pour trouver une alternative qui vous convient.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We're sorry to inform you that the requested time slot for your reservation (${formattedReservationDate} at ${formattedReservationTime}) is unfortunately not available.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We suggest choosing another date and time. Please don't hesitate to contact us to find an alternative that suits you.</p>`);
      break;

    case 'refund_request':
      subject = language === 'fr'
        ? 'Demande de remboursement - Mor Thai Spa'
        : 'Refund Request - Mor Thai Spa';
      bannerText = language === 'fr' ? 'DEMANDE DE REMBOURSEMENT' : 'REFUND REQUEST';
      bannerColor = '#9c27b0';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous avons bien reçu votre demande de remboursement pour votre réservation du ${formattedReservationDate}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez une confirmation par email une fois le remboursement effectué.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We have received your refund request for your reservation on ${formattedReservationDate}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Our team will process your request as soon as possible. You will receive a confirmation email once the refund has been processed.</p>`);
      break;

    case 'down_payment':
      subject = language === 'fr'
        ? 'Paiement d\'acompte - Mor Thai Spa'
        : 'Down Payment - Mor Thai Spa';
      bannerText = language === 'fr' ? 'PAIEMENT D\'ACOMPTE' : 'DOWN PAYMENT';
      bannerColor = '#2196F3';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Concernant votre réservation du ${formattedReservationDate}, nous vous rappelons que nous acceptons un paiement d'acompte pour confirmer votre réservation.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Merci de nous contacter pour procéder au paiement d'acompte.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Regarding your reservation on ${formattedReservationDate}, we would like to remind you that we accept a down payment to confirm your reservation.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Please contact us to proceed with the down payment.</p>`);
      break;

    case 'tripadvisor_review':
      subject = language === 'fr'
        ? 'Demande d\'avis Tripadvisor - Mor Thai Spa'
        : 'Tripadvisor Review Request - Mor Thai Spa';
      bannerText = language === 'fr' ? 'PARTAGEZ VOTRE AVIS' : 'SHARE YOUR REVIEW';
      bannerColor = '#00af87';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous espérons que vous avez passé un excellent moment lors de votre visite au Mor Thai Spa !</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Votre avis nous tient à cœur. Si vous avez quelques minutes, nous serions ravis si vous pouviez partager votre expérience sur Tripadvisor.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We hope you had a wonderful time during your visit to Mor Thai Spa!</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Your feedback is important to us. If you have a few minutes, we would be delighted if you could share your experience on Tripadvisor.</p>`);
      break;

    case 'custom':
      subject = language === 'fr' ? 'Message - Mor Thai Spa' : 'Message - Mor Thai Spa';
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Merci de votre confiance.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Thank you for your trust.</p>`);
      break;

    default:
      // For unknown types, use custom message if provided, otherwise return error
      if (!customMessage || !customMessage.trim()) {
        return { success: false, error: 'Invalid email type' };
      }
      subject = language === 'fr' ? 'Réservation - Mor Thai Spa' : 'Reservation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>`;
  }

  // Show calendar link only for confirm and reminder emails, not for cancel
  const showCalendarLink = emailType === 'confirm' || emailType === 'reminder';

  // Generate HTML email
  const htmlContent = generateEmailHTML({
    bannerText,
    bannerColor,
    messageContent,
    reservationData: {
      ...reservation,
      reference,
      nomclient,
      dateres,
      heureres,
      NomService,
      NomServiceFr,
      NomServiceEn,
      prixtotal,
      nbrpersonne,
      modepaiement,
      created_at
    },
    language,
    customMessage: customMessage && customMessage.trim() ? customMessage : null,
    showCalendarLink
  });

  // Generate plain text version
  const textContent = customMessage && customMessage.trim()
    ? customMessage
    : (language === 'fr'
      ? `Cher client,\n\n${bannerText}\n\nDétails de la réservation:\n- Service: ${serviceName}\n- Date: ${formattedReservationDate}\n- Heure: ${formattedReservationTime}\n- Total: ${prixtotal} MAD\n\nCordialement,\nMor Thai Spa`
      : `Dear client,\n\n${bannerText}\n\nReservation details:\n- Service: ${serviceName}\n- Date: ${formattedReservationDate}\n- Time: ${formattedReservationTime}\n- Total: ${prixtotal} MAD\n\nBest regards,\nMor Thai Spa`);

  const result = await sendEmail(email, subject, textContent, htmlContent);
  
  // Return result with email details for storage
  return {
    ...result,
    subject,
    htmlContent,
    textContent
  };
}

/**
 * Generate email HTML preview without sending
 * @param {Object} reservation - Reservation object with client and service details
 * @param {string} emailType - Type of email (confirm, reminder, cancel, change)
 * @param {string} customMessage - Custom message to include (optional)
 * @param {string} language - Language for the email (fr or en)
 * @returns {Promise<Object>} HTML content
 */
export async function generateEmailPreview(reservation, emailType, customMessage = null, language = 'fr') {
  if (!reservation || !reservation.email) {
    return { success: false, error: 'Reservation data and email are required' };
  }

  const {
    nomclient,
    email,
    dateres,
    heureres,
    NomService,
    NomServiceFr,
    NomServiceEn,
    prixtotal,
    nbrpersonne = 1,
    modepaiement,
    reference,
    created_at
  } = reservation;

  // Format dates
  const reservationDateObj = new Date(dateres);
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: true }
  ) : '';

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  let bannerText = '';
  let bannerColor = '#8B4513';
  let messageContent = '';

  // Helper function to escape HTML to prevent XSS and duplication
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Check if customMessage is already complete HTML email (contains DOCTYPE)
  // If so, return it directly without regenerating the template
  if (customMessage && typeof customMessage === 'string' && customMessage.includes('<!DOCTYPE html>')) {
    return { success: true, html: customMessage };
  }

  // Check if customMessage is HTML content (contains HTML tags but not full document)
  const isHtmlContent = customMessage && /<[^>]+>/.test(customMessage);
  
  // Define email content based on type
  switch (emailType) {
    case 'confirm':
      bannerText = language === 'fr' ? 'RÉSERVATION CONFIRMÉE' : 'RESERVATION CONFIRMED';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim() 
        ? (isHtmlContent 
          ? '' // If it's HTML, don't add it here - it will be handled separately
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous sommes ravis que vous ayez choisi le Mor Thaï SPA.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que la date et l'heure de votre demande de réservation ont été confirmées.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous serons honorés de vous accueillir dans nos locaux pour votre séance de détente.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Si vous avez des exigences particulières ou des préférences spécifiques, n'hésitez pas à nous communiquer.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We are delighted that you have chosen Mor Thai SPA.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that the date and time of your reservation request have been confirmed.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We will be honored to welcome you to our premises for your relaxation session.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">If you have any particular requirements or specific preferences, please do not hesitate to communicate them to us.</p>`);
      break;

    case 'reminder':
      bannerText = language === 'fr' ? 'RAPPEL DE RÉSERVATION' : 'RESERVATION REMINDER';
      bannerColor = '#25D366';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Ceci est un rappel que votre réservation pour ${serviceName} est prévue le ${formattedReservationDate} à ${formattedReservationTime}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous vous attendons avec impatience !</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">This is a reminder that your reservation for ${serviceName} is scheduled on ${formattedReservationDate} at ${formattedReservationTime}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We look forward to seeing you!</p>`);
      break;

    case 'cancel':
      bannerText = language === 'fr' ? 'RÉSERVATION ANNULÉE' : 'RESERVATION CANCELLED';
      bannerColor = '#dc3545';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que votre réservation pour ${serviceName} prévue le ${formattedReservationDate} à ${formattedReservationTime} a été annulée.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous sommes désolés pour cet inconvénient. N'hésitez pas à nous contacter pour toute question.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that your reservation for ${serviceName} scheduled on ${formattedReservationDate} at ${formattedReservationTime} has been cancelled.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We apologize for any inconvenience. Please do not hesitate to contact us if you have any questions.</p>`);
      break;

    case 'change':
      bannerText = language === 'fr' ? 'RÉSERVATION MODIFIÉE' : 'RESERVATION CHANGED';
      bannerColor = '#ffc107';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que votre réservation a été modifiée.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Vous trouverez les nouveaux détails ci-dessous.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We inform you that your reservation has been changed.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">You will find the new details below.</p>`);
      break;

    case 'unavailability':
      bannerText = language === 'fr' ? 'CRÉNEAU NON DISPONIBLE' : 'SLOT UNAVAILABLE';
      bannerColor = '#ff9800';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous sommes désolés de vous informer que le créneau demandé pour votre réservation (${formattedReservationDate} à ${formattedReservationTime}) n'est malheureusement pas disponible.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Nous vous proposons de choisir une autre date et heure. N'hésitez pas à nous contacter pour trouver une alternative qui vous convient.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We're sorry to inform you that the requested time slot for your reservation (${formattedReservationDate} at ${formattedReservationTime}) is unfortunately not available.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We suggest choosing another date and time. Please don't hesitate to contact us to find an alternative that suits you.</p>`);
      break;

    case 'refund_request':
      bannerText = language === 'fr' ? 'DEMANDE DE REMBOURSEMENT' : 'REFUND REQUEST';
      bannerColor = '#9c27b0';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous avons bien reçu votre demande de remboursement pour votre réservation du ${formattedReservationDate}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez une confirmation par email une fois le remboursement effectué.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We have received your refund request for your reservation on ${formattedReservationDate}.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Our team will process your request as soon as possible. You will receive a confirmation email once the refund has been processed.</p>`);
      break;

    case 'down_payment':
      bannerText = language === 'fr' ? 'PAIEMENT D\'ACOMPTE' : 'DOWN PAYMENT';
      bannerColor = '#2196F3';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Concernant votre réservation du ${formattedReservationDate}, nous vous rappelons que nous acceptons un paiement d'acompte pour confirmer votre réservation.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Merci de nous contacter pour procéder au paiement d'acompte.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Regarding your reservation on ${formattedReservationDate}, we would like to remind you that we accept a down payment to confirm your reservation.</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Please contact us to proceed with the down payment.</p>`);
      break;

    case 'tripadvisor_review':
      bannerText = language === 'fr' ? 'PARTAGEZ VOTRE AVIS' : 'SHARE YOUR REVIEW';
      bannerColor = '#00af87';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous espérons que vous avez passé un excellent moment lors de votre visite au Mor Thai Spa !</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Votre avis nous tient à cœur. Si vous avez quelques minutes, nous serions ravis si vous pouviez partager votre expérience sur Tripadvisor.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">We hope you had a wonderful time during your visit to Mor Thai Spa!</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Your feedback is important to us. If you have a few minutes, we would be delighted if you could share your experience on Tripadvisor.</p>`);
      break;

    case 'custom':
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Merci de votre confiance.</p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Dear client,</p>
             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Thank you for your trust.</p>`);
      break;

    default:
      // For unknown types, use custom message if provided, otherwise return error
      if (!customMessage || !customMessage.trim()) {
        return { success: false, error: 'Invalid email type' };
      }
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = isHtmlContent 
        ? ''
        : `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`;
  }

  // Show calendar link only for confirm and reminder emails, not for cancel
  const showCalendarLink = emailType === 'confirm' || emailType === 'reminder';

  // Generate HTML email
  const htmlContent = generateEmailHTML({
    bannerText,
    bannerColor,
    messageContent,
    reservationData: {
      ...reservation,
      reference,
      nomclient,
      dateres,
      heureres,
      NomService,
      NomServiceFr,
      NomServiceEn,
      prixtotal,
      nbrpersonne,
      modepaiement,
      created_at
    },
    language,
    customMessage: customMessage && customMessage.trim() ? customMessage : null,
    showCalendarLink
  });

  return { success: true, html: htmlContent };
}

