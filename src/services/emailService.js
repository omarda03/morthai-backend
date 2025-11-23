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
 * Generate HTML email template
 */
function generateEmailHTML({
  bannerText,
  bannerColor,
  messageContent,
  reservationData,
  language = 'fr',
  customMessage = null
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

    default:
      return { success: false, error: 'Invalid email type' };
  }

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
    customMessage: customMessage && customMessage.trim() ? customMessage : null
  });

  // Generate plain text version
  const textContent = customMessage && customMessage.trim()
    ? customMessage
    : (language === 'fr'
      ? `Cher client,\n\n${bannerText}\n\nDétails de la réservation:\n- Service: ${serviceName}\n- Date: ${formattedReservationDate}\n- Heure: ${formattedReservationTime}\n- Total: ${prixtotal} MAD\n\nCordialement,\nMor Thai Spa`
      : `Dear client,\n\n${bannerText}\n\nReservation details:\n- Service: ${serviceName}\n- Date: ${formattedReservationDate}\n- Time: ${formattedReservationTime}\n- Total: ${prixtotal} MAD\n\nBest regards,\nMor Thai Spa`);

  return await sendEmail(email, subject, textContent, htmlContent);
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

    default:
      return { success: false, error: 'Invalid email type' };
  }

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
    customMessage: customMessage && customMessage.trim() ? customMessage : null
  });

  return { success: true, html: htmlContent };
}

