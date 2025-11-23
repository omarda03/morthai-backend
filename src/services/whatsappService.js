/**
 * WhatsApp Service using UltraMsg API
 * Documentation: https://docs.ultramsg.com/
 */

const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRAMSG_API_URL = 'https://api.ultramsg.com';

/**
 * Format phone number to international format (e.g., +212612345678)
 * Removes spaces, dashes, and ensures it starts with +
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
      cleaned = '+212' + cleaned.substring(1);
    } else {
      // Assume Morocco country code if not present
      cleaned = '+212' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Send WhatsApp message via UltraMsg API
 * @param {string} to - Phone number in international format
 * @param {string} message - Message content
 * @returns {Promise<Object>} API response
 */
export async function sendWhatsAppMessage(to, message) {
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    console.warn('UltraMsg credentials not configured. Skipping WhatsApp message.');
    return { success: false, error: 'UltraMsg credentials not configured' };
  }

  if (!to || !message) {
    console.warn('Missing phone number or message. Skipping WhatsApp message.');
    return { success: false, error: 'Missing phone number or message' };
  }

  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    console.warn(`Invalid phone number: ${to}. Skipping WhatsApp message.`);
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const url = `${ULTRAMSG_API_URL}/${ULTRAMSG_INSTANCE_ID}/messages/chat`;
    
    const params = new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to: formattedPhone,
      body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract error message from different possible response formats
      const errorMessage = data.error || data.message || 'Failed to send WhatsApp message';
      
      // Log specific error types for easier debugging
      if (errorMessage.includes('Stopped') || errorMessage.includes('non-payment')) {
        console.error('UltraMsg instance is stopped - Payment required:', errorMessage);
      } else if (errorMessage.includes('not authorized')) {
        console.error('UltraMsg instance not authorized - Check your credentials');
      } else {
        console.error('UltraMsg API error:', data);
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorDetails: data 
      };
    }

    console.log(`WhatsApp message sent successfully to ${formattedPhone}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reservation confirmation message
 * @param {Object} reservation - Reservation object with client and service details
 * @returns {Promise<Object>} API response
 */
export async function sendReservationConfirmation(reservation) {
  if (!reservation) {
    return { success: false, error: 'Reservation data is required' };
  }

  const {
    nomclient,
    numerotelephone,
    dateres,
    heureres,
    NomService,
    prixtotal
  } = reservation;

  // Format date to readable format (French)
  const dateObj = new Date(dateres);
  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format time
  const formattedTime = heureres.slice(0, 5); // HH:MM format

  // Create message in French (as per user preference)
  const message = `Bonjour ${nomclient},

Votre réservation a été confirmée avec succès ! 🎉

📋 Détails de votre réservation :
• Service : ${NomService || 'Service'}
• Date : ${formattedDate}
• Heure : ${formattedTime}
• Prix total : ${prixtotal} MAD

Nous vous attendons avec impatience ! Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Mor Thai`;

  return await sendWhatsAppMessage(numerotelephone, message);
}

