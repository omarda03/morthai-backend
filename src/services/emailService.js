/**
 * Email Service using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';
import { ServiceOffer } from '../models/ServiceOffer.js';

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
 * Get service duration from service_offers based on service_uuid and price
 * @param {string} serviceUuid - Service UUID
 * @param {number} priceTotal - Total price paid
 * @returns {Promise<number|null>} Duration in minutes or null if not found
 */
async function getServiceDurationFromOffers(serviceUuid, priceTotal) {
  try {
    if (!serviceUuid) return null;
    
    // Get all offers for this service
    const offers = await ServiceOffer.getByService(serviceUuid);
    
    if (!offers || offers.length === 0) return null;
    
    // Find the offer that matches the price (with a small tolerance for rounding)
    const matchingOffer = offers.find(offer => {
      const offerPrice = parseFloat(offer.prix_mad);
      const priceDiff = Math.abs(offerPrice - priceTotal);
      // Allow 1 MAD difference for rounding
      return priceDiff <= 1;
    });
    
    if (matchingOffer) {
      return matchingOffer.durée;
    }
    
    // If no exact match, return the first offer's duration as fallback
    return offers[0]?.durée || null;
  } catch (error) {
    console.error('Error getting service duration from offers:', error);
    return null;
  }
}

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
 * Generate HTML email template for reservation request (not confirmed)
 */
async function generateRequestEmailHTML({
  reservationData,
  language = 'fr'
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
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: false }
  ).replace(':', 'h') : '';

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  // Determine duration from reservation data
  let duration = null;
  if (reservationData.duree) {
    const minutes = parseInt(reservationData.duree);
    duration = minutes;
  } else if (reservationData.service_uuid && reservationData.prixtotal) {
    // Try to get duration from service offers
    duration = await getServiceDurationFromOffers(reservationData.service_uuid, parseFloat(reservationData.prixtotal));
  }
  
  // Format duration text
  let durationText = 'Non spécifiée';
  if (duration) {
    const minutes = parseInt(duration);
    if (minutes === 60) {
      durationText = language === 'fr' ? '1 heure' : '1 hour';
    } else if (minutes === 90) {
      durationText = language === 'fr' ? '1h30' : '1h30';
    } else if (minutes === 120) {
      durationText = language === 'fr' ? '2 heures' : '2 hours';
    } else if (minutes === 75) {
      durationText = language === 'fr' ? '1h15' : '1h15';
    } else {
      durationText = language === 'fr' ? `${minutes} minutes` : `${minutes} minutes`;
    }
  }

  // Payment method translation
  let paymentMethod = modepaiement || '';
  if (language === 'fr') {
    if (paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('espèce')) {
      paymentMethod = 'Espèces';
    } else if (paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('carte')) {
      paymentMethod = 'Carte';
    } else if (paymentMethod.toLowerCase().includes('ligne') || paymentMethod.toLowerCase().includes('online')) {
      paymentMethod = 'En ligne';
    }
  }

  const whatsappNumber = '212600000000'; // Update with actual WhatsApp number
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>Mor Thai Spa – Demande reçue</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f1ec;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#faf7f2; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">
          <!-- Header Image -->
          <tr>
            <td>
              <img src="${BASE_URL}/homepage/${encodeURIComponent("Page d'accueil Nos massages.webp")}"
                   width="600"
                   alt="Mor Thai Spa"
                   style="display:block; width:100%; height:auto;">
            </td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:16px 0 8px;">
              <span style="font-size:24px; font-weight:600; color:#6b7b66;">
                Mor Thai
              </span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:8px 32px;">
              <h2 style="margin:0; font-size:20px; letter-spacing:1px; color:#6b7b66;">
                CECI N'EST PAS UNE CONFIRMATION
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 40px; font-size:14px; color:#333; line-height:1.6;">
              <p style="margin-top:0;">
                <strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong>
              </p>
              <p>
                Nous vous remercions d'avoir choisi <strong>Mor Thai Spa</strong>. Votre demande de réservation a bien été reçue et est actuellement en cours de validation par notre équipe.
              </p>
              <p>
                Notre réceptionniste vous contactera très prochainement, par appel téléphonique, <strong>WhatsApp</strong> ou email.
              </p>
              <p>
                Merci de vous assurer que votre <strong>téléphone reste joignable</strong>.
              </p>
              <p>
                En cas de demande urgente, vous pouvez également nous contacter directement par <strong>téléphone</strong> ou <strong>WhatsApp</strong>.
              </p>
              <p style="margin-top:16px;">
                Chaleureusement,<br>L'équipe Mor Thai Spa
              </p>
            </td>
          </tr>

          <!-- Recap box -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#f3f0eb; border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px; background-color:#e8e4dd; font-weight:bold; color:#6b7b66; border-radius:10px 10px 0 0;">
                    Récapitulatif de votre demande
                  </td>
                  <td align="right" style="padding:14px 16px; background-color:#e8e4dd; font-size:12px; color:#666; border-radius:10px 10px 0 0;">
                    Référence : ${reference || 'MOR THAI SPA'}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0 16px 16px; font-size:14px; color:#333;">
                    <p style="margin:12px 0;"><strong>Soin :</strong> ${serviceName}${durationText !== 'Non spécifiée' ? ` – ${durationText}` : ''}</p>
                    <p style="margin:12px 0;"><strong>Date & heure souhaitées :</strong> ${formattedReservationDate}${formattedReservationTime ? ` à ${formattedReservationTime}` : ''}</p>
                    <p style="margin:12px 0;"><strong>Montant :</strong> ${prixtotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD${paymentMethod ? ` – ${paymentMethod}` : ''}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td align="center" style="padding:0 40px 24px; font-size:12px; color:#777;">
              Veuillez noter que cet email ne constitue pas une confirmation définitive.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px; background-color:#f0ede8; font-size:12px; color:#666;">
              <!-- Contact Information -->
              <div style="margin-bottom:12px; line-height:1.8;">
                <p style="margin:4px 0;"><strong>Adresse :</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech')}" target="_blank" style="color:#6b7b66; text-decoration:underline;">N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech. (à l'arrière Le Centre Américain).</a></p>
                <p style="margin:4px 0;"><strong>Téléphone :</strong> <a href="tel:+212524207055" style="color:#6b7b66; text-decoration:underline;">+212 524 207 055</a></p>
                <p style="margin:4px 0;"><strong>WhatsApp :</strong> <a href="https://wa.me/212610200040" target="_blank" style="color:#6b7b66; text-decoration:underline;">+212 610 200 040</a></p>
                <p style="margin:4px 0;"><strong>Email :</strong> <a href="mailto:contact@morthai-marrakech.com" style="color:#6b7b66; text-decoration:underline;">contact@morthai-marrakech.com</a></p>
              </div>
              <!-- Social Media Icons -->
              <div style="margin-bottom:12px;">
                <a href="https://www.facebook.com/massagethailandaismarrakech.ma/" target="_blank" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/2175/2175193.png" alt="Facebook" style="width:20px; height:20px; display:block; border:0;">
                </a>
                <a href="https://www.instagram.com/morthai_spathailandais/" target="_blank" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <img src="https://pixsector.com/cache/200e7bcc/av16efeffeed4418c90c1.png" alt="Instagram" style="width:20px; height:20px; display:block; border:0;">
                </a>
              </div>
              © 2025 Mor Thai. All rights reserved.
            </td>
          </tr>
        </table>
        <!-- End container -->
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML email template (unified design for all email types)
 */
function generateEmailHTML({
  bannerText,
  bannerColor,
  messageContent,
  reservationData,
  language = 'fr',
  customMessage = null,
  showCalendarLink = true,
  showDisclaimer = false
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
    created_at,
    note
  } = reservationData;

  // Format dates
  const reservationDateObj = new Date(dateres);
  const createdDateObj = new Date(created_at || Date.now());
  
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: false }
  ).replace(':', 'h') : '';
  
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
  let duration = '1 heure'; // Default
  if (reservationData.duree) {
    const minutes = parseInt(reservationData.duree);
    if (minutes === 60) {
      duration = language === 'fr' ? '1 heure' : '1 hour';
    } else if (minutes === 90) {
      duration = language === 'fr' ? '1h30' : '1h30';
    } else if (minutes === 120) {
      duration = language === 'fr' ? '2 heures' : '2 hours';
    } else if (minutes === 75) {
      duration = language === 'fr' ? '1h15' : '1h15';
    } else {
      duration = language === 'fr' ? `${minutes} minutes` : `${minutes} minutes`;
    }
  }

  // Payment method translation
  let paymentMethod = modepaiement || '';
  if (language === 'fr') {
    if (paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('espèce')) {
      paymentMethod = 'Espèces';
    } else if (paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('carte')) {
      paymentMethod = 'Carte';
    } else if (paymentMethod.toLowerCase().includes('ligne') || paymentMethod.toLowerCase().includes('online')) {
      paymentMethod = 'En ligne';
    }
  }

  const whatsappNumber = '212600000000'; // Update with actual WhatsApp number
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  // Parse additional services from note
  const additionalServices = [];
  if (note) {
    // Match everything after "| Additional services: " 
    const match = note.match(/\|\s*Additional services:\s*(.+?)(?:\s*$)/);
    if (match) {
      const servicesString = match[1].trim();
      
      // Improved parsing: split by " - Price MAD" pattern (with optional comma)
      // This handles services with "|" and "-" in their names by looking for the price pattern
      // Pattern: " - " followed by digits, then " MAD" optionally followed by comma
      const pricePattern = /\s+-\s+(\d+(?:\.\d+)?)\s*MAD(?:,\s*|$)/g;
      
      // Find all price positions
      const priceMatches = [];
      let priceMatch;
      while ((priceMatch = pricePattern.exec(servicesString)) !== null) {
        priceMatches.push({
          priceIndex: priceMatch.index,
          price: parseFloat(priceMatch[1]),
          fullMatch: priceMatch[0]
        });
      }
      
      // Extract service names and prices
      for (let i = 0; i < priceMatches.length; i++) {
        const startIndex = i === 0 ? 0 : priceMatches[i - 1].priceIndex + priceMatches[i - 1].fullMatch.length;
        const endIndex = priceMatches[i].priceIndex;
        let name = servicesString.substring(startIndex, endIndex).trim();
        
        // Remove any trailing " - " that might be left
        name = name.replace(/\s+-\s*$/, '').trim();
        const price = priceMatches[i].price;
        
        if (name && !isNaN(price) && price > 0) {
          additionalServices.push({ name, price });
        }
      }
    }
  }

  // Calculate base service price dynamically
  let baseServicePrice = 0;
  if (additionalServices.length > 0) {
    const additionalServicesTotal = additionalServices.reduce((sum, service) => sum + (service.price * nbrpersonne), 0);
    baseServicePrice = (prixtotal - additionalServicesTotal) / nbrpersonne;
  } else {
    baseServicePrice = prixtotal / nbrpersonne;
  }

  // Build services list HTML dynamically
  let servicesListHTML = '';
  
  // Always show main service (simplified format)
  servicesListHTML += `<p style="margin:12px 0;"><strong>${language === 'fr' ? 'Soin' : 'Treatment'} :</strong> ${serviceName}</p>`;
  
  // Show additional services if any
  if (additionalServices.length > 0) {
    additionalServices.forEach((service) => {
      const totalPrice = service.price * nbrpersonne;
      servicesListHTML += `<p style="margin:12px 0; padding-left:20px; color:#666;">
        <strong>+ ${service.name}</strong> x${nbrpersonne} - <strong>${totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD</strong>
      </p>`;
    });
  }

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${bannerText}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f1ec;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#faf7f2; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">
          <!-- Header Image -->
          <tr>
            <td>
              <img src="${BASE_URL}/homepage/${encodeURIComponent("Page d'accueil Nos massages.webp")}"
                   width="600"
                   alt="Mor Thai Spa"
                   style="display:block; width:100%; height:auto;">
            </td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:16px 0 8px;">
              <span style="font-size:24px; font-weight:600; color:#6b7b66;">
                Mor Thai
              </span>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td align="center" style="padding:8px 32px;">
              <h2 style="margin:0; font-size:20px; letter-spacing:1px; color:#6b7b66;">
                      ${bannerText}
              </h2>
            </td>
          </tr>
          
          <!-- Message Content -->
          <tr>
            <td style="padding:24px 40px; font-size:14px; color:#333; line-height:1.6;">
              ${messageContent || ''}
            </td>
          </tr>
          
          <!-- Recap box -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#f3f0eb; border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px; background-color:#e8e4dd; font-weight:bold; color:#6b7b66; border-radius:10px 10px 0 0;">
                    ${language === 'fr' ? 'Détails de votre réservation' : 'Reservation Details'}
                  </td>
                  <td align="right" style="padding:14px 16px; background-color:#e8e4dd; font-size:12px; color:#666; border-radius:10px 10px 0 0;">
                    ${language === 'fr' ? 'Référence' : 'Reference'} : ${reservationRef}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0 16px 16px; font-size:14px; color:#333;">
                    ${servicesListHTML}
                    ${duration ? `<p style="margin:12px 0;"><strong>${language === 'fr' ? 'Durée' : 'Duration'} :</strong> ${duration}</p>` : ''}
                    <p style="margin:12px 0;"><strong>${language === 'fr' ? 'Nombre de personnes' : 'Number of people'} :</strong> ${nbrpersonne}</p>
                    ${paymentMethod ? `<p style="margin:12px 0;"><strong>${language === 'fr' ? 'Mode de paiement' : 'Payment method'} :</strong> ${paymentMethod}</p>` : ''}
                    <p style="margin:12px 0;"><strong>${language === 'fr' ? 'Montant total' : 'Total amount'} :</strong> ${prixtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
              
              ${showCalendarLink ? `
              <!-- Google Calendar Link -->
          <tr>
            <td align="center" style="padding:24px;">
                <a href="${generateGoogleCalendarLink(reservationData, language)}" 
                 style="background-color:#6b7b66; color:#ffffff; text-decoration:none;
                        padding:14px 28px; border-radius:8px; font-size:14px; display:inline-block;">
                  ${language === 'fr' ? 'Ajouter à Google Calendar' : 'Add to Google Calendar'}
                </a>
            </td>
          </tr>
          ` : ''}

          ${showDisclaimer ? `
          <!-- Disclaimer (only for request emails) -->
          <tr>
            <td align="center" style="padding:0 40px 24px; font-size:12px; color:#777;">
              ${language === 'fr' ? 'Veuillez noter que cet email ne constitue pas une confirmation définitive.' : 'Please note that this email does not constitute a definitive confirmation.'}
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px; background-color:#f0ede8; font-size:12px; color:#666;">
              <!-- Contact Information -->
              <div style="margin-bottom:12px; line-height:1.8;">
                <p style="margin:4px 0;"><strong>${language === 'fr' ? 'Adresse' : 'Address'} :</strong> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech')}" target="_blank" style="color:#6b7b66; text-decoration:underline;">${language === 'fr' ? 'N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech. (à l\'arrière Le Centre Américain).' : 'N° 52, 5th Floor, Le Noyer B Building, Rue Ibn Sina Atlassi, Gueliz, Marrakech. (behind the American Center).'}</a></p>
                <p style="margin:4px 0;"><strong>${language === 'fr' ? 'Téléphone' : 'Phone'} :</strong> <a href="tel:+212524207055" style="color:#6b7b66; text-decoration:underline;">+212 524 207 055</a></p>
                <p style="margin:4px 0;"><strong>WhatsApp :</strong> <a href="https://wa.me/212610200040" target="_blank" style="color:#6b7b66; text-decoration:underline;">+212 610 200 040</a></p>
                <p style="margin:4px 0;"><strong>Email :</strong> <a href="mailto:contact@morthai-marrakech.com" style="color:#6b7b66; text-decoration:underline;">contact@morthai-marrakech.com</a></p>
              </div>
              <!-- Social Media Icons -->
              <div style="margin-bottom:12px;">
                <a href="https://www.facebook.com/massagethailandaismarrakech.ma/" target="_blank" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/2175/2175193.png" alt="Facebook" style="width:20px; height:20px; display:block; border:0;">
                </a>
                <a href="https://www.instagram.com/morthai_spathailandais/" target="_blank" style="display:inline-block; margin:0 8px; text-decoration:none;">
                  <img src="https://pixsector.com/cache/200e7bcc/av16efeffeed4418c90c1.png" alt="Instagram" style="width:20px; height:20px; display:block; border:0;">
                </a>
              </div>
              © 2025 Mor Thai. All rights reserved.
            </td>
          </tr>
        </table>
        <!-- End container -->
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

  // Determine duration from reservation data
  let duration = '1 heure'; // Default
  if (reservation.duree) {
    const minutes = parseInt(reservation.duree);
    if (minutes === 60) {
      duration = language === 'fr' ? '1 heure' : '1 hour';
    } else if (minutes === 90) {
      duration = language === 'fr' ? '1h30' : '1h30';
    } else if (minutes === 120) {
      duration = language === 'fr' ? '2 heures' : '2 hours';
    } else if (minutes === 75) {
      duration = language === 'fr' ? '1h15' : '1h15';
    } else {
      duration = language === 'fr' ? `${minutes} minutes` : `${minutes} minutes`;
    }
  }

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
      bannerText = language === 'fr' ? 'Confirmation' : 'Confirmation';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim() 
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous remercions d'avoir choisi <strong>Mor Thai Spa</strong>.</p>
             <p>Nous avons le plaisir de vous confirmer votre rendez-vous pour</p>
             <p><strong>Date et heure :</strong> ${formattedReservationDate} à ${formattedReservationTime || '{{heure}}'} ${formattedReservationTime ? '(modifiable)' : ''}</p>
             <p>Si vous avez des préférences particulières ou des demandes spécifiques, n'hésitez pas à nous communiquer afin de personnaliser votre expérience.</p>
             <p>Notre équipe sera honorée de vous accueillir pour vous offrir un moment de détente et de bien-être d'exception.</p>
             <p style="margin-top:16px;">Nous vous remercions pour votre confiance et nous réjouissons de vous accueillir très prochainement.</p>
             <p style="margin-top:16px;">Bien cordialement,<br>L'équipe Mor Thai Spa</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We thank you for choosing <strong>Mor Thai Spa</strong>.</p>
             <p>We are pleased to confirm your appointment for</p>
             <p><strong>Date and time:</strong> ${formattedReservationDate} at ${formattedReservationTime || '{{time}}'} ${formattedReservationTime ? '(modifiable)' : ''}</p>
             <p>If you have any particular preferences or specific requests, please do not hesitate to contact us to personalize your experience.</p>
             <p>Our team will be honored to welcome you to offer you an exceptional moment of relaxation and well-being.</p>
             <p style="margin-top:16px;">We thank you for your trust and look forward to welcoming you very soon.</p>
             <p style="margin-top:16px;">Best regards,<br>The Mor Thai Spa Team</p>`);
      break;

    case 'reminder':
      subject = language === 'fr'
        ? 'Rappel : Votre réservation - Mor Thai Spa'
        : 'Reminder: Your Reservation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RAPPEL DE RÉSERVATION' : 'RESERVATION REMINDER';
      bannerColor = '#25D366';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Ceci est un rappel que votre réservation pour <strong>${serviceName}</strong> est prévue le <strong>${formattedReservationDate} à ${formattedReservationTime}</strong>.</p>
             <p>Nous vous attendons avec impatience !</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>This is a reminder that your reservation for <strong>${serviceName}</strong> is scheduled on <strong>${formattedReservationDate} at ${formattedReservationTime}</strong>.</p>
             <p>We look forward to seeing you!</p>`);
      break;

    case 'cancel':
      subject = language === 'fr'
        ? 'Annulation de votre réservation - Mor Thai Spa'
        : 'Reservation Cancellation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RÉSERVATION ANNULÉE' : 'RESERVATION CANCELLED';
      bannerColor = '#dc3545';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous informons que votre réservation pour <strong>${serviceName}</strong> prévue le <strong>${formattedReservationDate} à ${formattedReservationTime}</strong> a été annulée.</p>
             <p>Nous sommes désolés pour cet inconvénient. N'hésitez pas à nous contacter pour toute question.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We inform you that your reservation for <strong>${serviceName}</strong> scheduled on <strong>${formattedReservationDate} at ${formattedReservationTime}</strong> has been cancelled.</p>
             <p>We apologize for any inconvenience. Please do not hesitate to contact us if you have any questions.</p>`);
      break;

    case 'change':
      subject = language === 'fr'
        ? 'Modification de votre réservation - Mor Thai Spa'
        : 'Reservation Change - Mor Thai Spa';
      bannerText = language === 'fr' ? 'RÉSERVATION MODIFIÉE' : 'RESERVATION CHANGED';
      bannerColor = '#ffc107';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous informons que votre réservation a été <strong>modifiée</strong>.</p>
             <p>Vous trouverez les nouveaux détails ci-dessous.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We inform you that your reservation has been <strong>changed</strong>.</p>
             <p>You will find the new details below.</p>`);
      break;

    case 'unavailability':
      subject = language === 'fr'
        ? 'Non-disponibilité de créneaux - Mor Thai Spa'
        : 'Slot Unavailability - Mor Thai Spa';
      bannerText = language === 'fr' ? 'Non disponibilité' : 'Unavailability';
      bannerColor = '#ff9800';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous remercions d'avoir choisi <strong>Mor Thai Spa</strong> pour votre moment de relaxation.</p>
             <p>Nous regrettons de vous informer que les créneaux demandés ne sont plus disponibles.</p>
             <p>Toutefois, nous avons le plaisir de vous proposer la disponibilité suivante :</p>
             <p style="margin:12px 0; padding:12px; background-color:#f3f0eb; border-left:4px solid #6b7b66;">
               <strong>${formattedReservationDate} à ${formattedReservationTime || '{{heure}}'} ${formattedReservationTime ? '(modifiable)' : ''}</strong>
             </p>
             <p style="margin:12px 0;"><strong>Soin :</strong> ${serviceName}${duration ? ` – ${duration}` : ''}</p>
             <p>Nous vous remercions de bien vouloir nous confirmer si cet horaire vous convient, afin que nous puissions finaliser votre réservation.</p>
             <p>Nous vous remercions pour votre compréhension et restons à votre entière disposition.</p>
             <p style="margin-top:16px;">Cordialement,<br>L'équipe Mor Thai Spa</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We thank you for choosing <strong>Mor Thai Spa</strong> for your moment of relaxation.</p>
             <p>We regret to inform you that the requested time slots are no longer available.</p>
             <p>However, we are pleased to offer you the following availability:</p>
             <p style="margin:12px 0; padding:12px; background-color:#f3f0eb; border-left:4px solid #6b7b66;">
               <strong>${formattedReservationDate} at ${formattedReservationTime || '{{time}}'} ${formattedReservationTime ? '(modifiable)' : ''}</strong>
             </p>
             <p style="margin:12px 0;"><strong>Treatment:</strong> ${serviceName}${duration ? ` – ${duration}` : ''}</p>
             <p>We thank you for confirming if this schedule suits you, so that we can finalize your reservation.</p>
             <p>We thank you for your understanding and remain at your complete disposal.</p>
             <p style="margin-top:16px;">Best regards,<br>The Mor Thai Spa Team</p>`);
      break;

    case 'refund_request':
      subject = language === 'fr'
        ? 'Demande de remboursement - Mor Thai Spa'
        : 'Refund Request - Mor Thai Spa';
      bannerText = language === 'fr' ? 'DEMANDE DE REMBOURSEMENT' : 'REFUND REQUEST';
      bannerColor = '#9c27b0';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous avons bien reçu votre demande de remboursement pour votre réservation du <strong>${formattedReservationDate}</strong>.</p>
             <p>Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez une confirmation par email une fois le remboursement effectué.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We have received your refund request for your reservation on <strong>${formattedReservationDate}</strong>.</p>
             <p>Our team will process your request as soon as possible. You will receive a confirmation email once the refund has been processed.</p>`);
      break;

    case 'down_payment':
      subject = language === 'fr'
        ? 'Paiement d\'acompte - Mor Thai Spa'
        : 'Down Payment - Mor Thai Spa';
      bannerText = language === 'fr' ? 'PAIEMENT D\'ACOMPTE' : 'DOWN PAYMENT';
      bannerColor = '#2196F3';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Concernant votre réservation du <strong>${formattedReservationDate}</strong>, nous vous rappelons que nous acceptons un paiement d'acompte pour confirmer votre réservation.</p>
             <p>Merci de nous contacter pour procéder au paiement d'acompte.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>Regarding your reservation on <strong>${formattedReservationDate}</strong>, we would like to remind you that we accept a down payment to confirm your reservation.</p>
             <p>Please contact us to proceed with the down payment.</p>`);
      break;

    case 'tripadvisor_review':
      subject = language === 'fr'
        ? 'Demande d\'avis Tripadvisor - Mor Thai Spa'
        : 'Tripadvisor Review Request - Mor Thai Spa';
      bannerText = language === 'fr' ? 'PARTAGEZ VOTRE AVIS' : 'SHARE YOUR REVIEW';
      bannerColor = '#00af87';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous espérons que vous avez passé un excellent moment lors de votre visite au <strong>Mor Thai Spa</strong> !</p>
             <p>Votre avis nous tient à cœur. Si vous avez quelques minutes, nous serions ravis si vous pouviez partager votre expérience sur <strong>Tripadvisor</strong>.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We hope you had a wonderful time during your visit to <strong>Mor Thai Spa</strong>!</p>
             <p>Your feedback is important to us. If you have a few minutes, we would be delighted if you could share your experience on <strong>Tripadvisor</strong>.</p>`);
      break;

    case 'request':
      subject = language === 'fr' 
        ? 'Demande de réservation reçue - Mor Thai Spa'
        : 'Reservation Request Received - Mor Thai Spa';
      
      // Determine duration first
      let durationMinutes = null;
      if (reservation.duree) {
        durationMinutes = parseInt(reservation.duree);
      } else if (reservation.service_uuid && prixtotal) {
        durationMinutes = await getServiceDurationFromOffers(reservation.service_uuid, parseFloat(prixtotal));
      }
      const durationText = durationMinutes ? `${durationMinutes} minutes` : 'Non spécifiée';
      
      // Use the new request email template
      const htmlContentRequest = await generateRequestEmailHTML({
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
          created_at,
          duree: durationMinutes,
          service_uuid: reservation.service_uuid
        },
        language
      });
      
      // Generate plain text version
      const textContentRequest = language === 'fr'
        ? `Cher/ère Monsieur/Madame ${nomclient || 'Client'},\n\nNous vous remercions d'avoir choisi Mor Thai Spa. Votre demande de réservation a bien été reçue et est actuellement en cours de validation par notre équipe.\n\nNotre réceptionniste vous contactera très prochainement, par appel téléphonique, WhatsApp ou email.\n\nRécapitulatif de votre demande:\n- Soin: ${serviceName}\n- Durée: ${durationText}\n- Date & heure souhaitées: ${formattedReservationDate}${formattedReservationTime ? ` à ${formattedReservationTime}` : ''}\n- Montant: ${prixtotal} MAD\n\nCordialement,\nMor Thai Spa`
        : `Dear Sir/Madam ${nomclient || 'Client'},\n\nWe thank you for choosing Mor Thai Spa. Your reservation request has been received and is currently being validated by our team.\n\nOur receptionist will contact you very soon, by phone call, WhatsApp or email.\n\nSummary of your request:\n- Treatment: ${serviceName}\n- Duration: ${durationText}\n- Desired date & time: ${formattedReservationDate}${formattedReservationTime ? ` at ${formattedReservationTime}` : ''}\n- Amount: ${prixtotal} MAD\n\nBest regards,\nMor Thai Spa`;
      
      const resultRequest = await sendEmail(email, subject, textContentRequest, htmlContentRequest);
      
      return {
        ...resultRequest,
        subject,
        htmlContent: htmlContentRequest,
        textContent: textContentRequest
      };

    case 'custom':
      subject = language === 'fr' ? 'Message - Mor Thai Spa' : 'Message - Mor Thai Spa';
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim()
        ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Merci de votre confiance.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>Thank you for your trust.</p>`);
      break;

    default:
      // For unknown types, use custom message if provided, otherwise return error
      if (!customMessage || !customMessage.trim()) {
        return { success: false, error: 'Invalid email type' };
      }
      subject = language === 'fr' ? 'Réservation - Mor Thai Spa' : 'Reservation - Mor Thai Spa';
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
                       <p>${customMessage.replace(/\n/g, '<br>')}</p>`;
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
      created_at,
      duree: reservation.duree || null,
      note: reservation.note || null
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

  // Format dates (same format as generateEmailHTML)
  const reservationDateObj = new Date(dateres);
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    language === 'fr' ? 'fr-FR' : 'en-US',
    { hour: '2-digit', minute: '2-digit', hour12: false }
  ).replace(':', 'h') : '';

  const serviceName = language === 'fr' 
    ? (NomServiceFr || NomService || 'Service')
    : (NomServiceEn || NomService || 'Service');

  // Determine duration from reservation data
  let duration = '1 heure'; // Default
  if (reservation.duree) {
    const minutes = parseInt(reservation.duree);
    if (minutes === 60) {
      duration = language === 'fr' ? '1 heure' : '1 hour';
    } else if (minutes === 90) {
      duration = language === 'fr' ? '1h30' : '1h30';
    } else if (minutes === 120) {
      duration = language === 'fr' ? '2 heures' : '2 hours';
    } else if (minutes === 75) {
      duration = language === 'fr' ? '1h15' : '1h15';
    } else {
      duration = language === 'fr' ? `${minutes} minutes` : `${minutes} minutes`;
    }
  }

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
      bannerText = language === 'fr' ? 'Confirmation' : 'Confirmation';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim() 
        ? (isHtmlContent 
          ? '' // If it's HTML, don't add it here - it will be handled separately
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous remercions d'avoir choisi <strong>Mor Thai Spa</strong>.</p>
             <p>Nous avons le plaisir de vous confirmer votre rendez-vous pour</p>
             <p><strong>Date et heure :</strong> ${formattedReservationDate} à ${formattedReservationTime || '{{heure}}'} ${formattedReservationTime ? '(modifiable)' : ''}</p>
             <p>Si vous avez des préférences particulières ou des demandes spécifiques, n'hésitez pas à nous communiquer afin de personnaliser votre expérience.</p>
             <p>Notre équipe sera honorée de vous accueillir pour vous offrir un moment de détente et de bien-être d'exception.</p>
             <p style="margin-top:16px;">Nous vous remercions pour votre confiance et nous réjouissons de vous accueillir très prochainement.</p>
             <p style="margin-top:16px;">Bien cordialement,<br>L'équipe Mor Thai Spa</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We thank you for choosing <strong>Mor Thai Spa</strong>.</p>
             <p>We are pleased to confirm your appointment for</p>
             <p><strong>Date and time:</strong> ${formattedReservationDate} at ${formattedReservationTime || '{{time}}'} ${formattedReservationTime ? '(modifiable)' : ''}</p>
             <p>If you have any particular preferences or specific requests, please do not hesitate to contact us to personalize your experience.</p>
             <p>Our team will be honored to welcome you to offer you an exceptional moment of relaxation and well-being.</p>
             <p style="margin-top:16px;">We thank you for your trust and look forward to welcoming you very soon.</p>
             <p style="margin-top:16px;">Best regards,<br>The Mor Thai Spa Team</p>`);
      break;

    case 'reminder':
      bannerText = language === 'fr' ? 'RAPPEL DE RÉSERVATION' : 'RESERVATION REMINDER';
      bannerColor = '#25D366';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Ceci est un rappel que votre réservation pour <strong>${serviceName}</strong> est prévue le <strong>${formattedReservationDate} à ${formattedReservationTime}</strong>.</p>
             <p>Nous vous attendons avec impatience !</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>This is a reminder that your reservation for <strong>${serviceName}</strong> is scheduled on <strong>${formattedReservationDate} at ${formattedReservationTime}</strong>.</p>
             <p>We look forward to seeing you!</p>`);
      break;

    case 'cancel':
      bannerText = language === 'fr' ? 'RÉSERVATION ANNULÉE' : 'RESERVATION CANCELLED';
      bannerColor = '#dc3545';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous informons que votre réservation pour <strong>${serviceName}</strong> prévue le <strong>${formattedReservationDate} à ${formattedReservationTime}</strong> a été annulée.</p>
             <p>Nous sommes désolés pour cet inconvénient. N'hésitez pas à nous contacter pour toute question.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We inform you that your reservation for <strong>${serviceName}</strong> scheduled on <strong>${formattedReservationDate} at ${formattedReservationTime}</strong> has been cancelled.</p>
             <p>We apologize for any inconvenience. Please do not hesitate to contact us if you have any questions.</p>`);
      break;

    case 'change':
      bannerText = language === 'fr' ? 'RÉSERVATION MODIFIÉE' : 'RESERVATION CHANGED';
      bannerColor = '#ffc107';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous informons que votre réservation a été <strong>modifiée</strong>.</p>
             <p>Vous trouverez les nouveaux détails ci-dessous.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We inform you that your reservation has been <strong>changed</strong>.</p>
             <p>You will find the new details below.</p>`);
      break;

    case 'unavailability':
      bannerText = language === 'fr' ? 'Non disponibilité' : 'Unavailability';
      bannerColor = '#ff9800';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous vous remercions d'avoir choisi <strong>Mor Thai Spa</strong> pour votre moment de relaxation.</p>
             <p>Nous regrettons de vous informer que les créneaux demandés ne sont plus disponibles.</p>
             <p>Toutefois, nous avons le plaisir de vous proposer la disponibilité suivante :</p>
             <p style="margin:12px 0; padding:12px; background-color:#f3f0eb; border-left:4px solid #6b7b66;">
               <strong>${formattedReservationDate} à ${formattedReservationTime || '{{heure}}'} ${formattedReservationTime ? '(modifiable)' : ''}</strong>
             </p>
             <p style="margin:12px 0;"><strong>Soin :</strong> ${serviceName}${duration ? ` – ${duration}` : ''}</p>
             <p>Nous vous remercions de bien vouloir nous confirmer si cet horaire vous convient, afin que nous puissions finaliser votre réservation.</p>
             <p>Nous vous remercions pour votre compréhension et restons à votre entière disposition.</p>
             <p style="margin-top:16px;">Cordialement,<br>L'équipe Mor Thai Spa</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We thank you for choosing <strong>Mor Thai Spa</strong> for your moment of relaxation.</p>
             <p>We regret to inform you that the requested time slots are no longer available.</p>
             <p>However, we are pleased to offer you the following availability:</p>
             <p style="margin:12px 0; padding:12px; background-color:#f3f0eb; border-left:4px solid #6b7b66;">
               <strong>${formattedReservationDate} at ${formattedReservationTime || '{{time}}'} ${formattedReservationTime ? '(modifiable)' : ''}</strong>
             </p>
             <p style="margin:12px 0;"><strong>Treatment:</strong> ${serviceName}${duration ? ` – ${duration}` : ''}</p>
             <p>We thank you for confirming if this schedule suits you, so that we can finalize your reservation.</p>
             <p>We thank you for your understanding and remain at your complete disposal.</p>
             <p style="margin-top:16px;">Best regards,<br>The Mor Thai Spa Team</p>`);
      break;

    case 'refund_request':
      bannerText = language === 'fr' ? 'DEMANDE DE REMBOURSEMENT' : 'REFUND REQUEST';
      bannerColor = '#9c27b0';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous avons bien reçu votre demande de remboursement pour votre réservation du <strong>${formattedReservationDate}</strong>.</p>
             <p>Notre équipe va traiter votre demande dans les plus brefs délais. Vous recevrez une confirmation par email une fois le remboursement effectué.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We have received your refund request for your reservation on <strong>${formattedReservationDate}</strong>.</p>
             <p>Our team will process your request as soon as possible. You will receive a confirmation email once the refund has been processed.</p>`);
      break;

    case 'down_payment':
      bannerText = language === 'fr' ? 'PAIEMENT D\'ACOMPTE' : 'DOWN PAYMENT';
      bannerColor = '#2196F3';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Concernant votre réservation du <strong>${formattedReservationDate}</strong>, nous vous rappelons que nous acceptons un paiement d'acompte pour confirmer votre réservation.</p>
             <p>Merci de nous contacter pour procéder au paiement d'acompte.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>Regarding your reservation on <strong>${formattedReservationDate}</strong>, we would like to remind you that we accept a down payment to confirm your reservation.</p>
             <p>Please contact us to proceed with the down payment.</p>`);
      break;

    case 'tripadvisor_review':
      bannerText = language === 'fr' ? 'PARTAGEZ VOTRE AVIS' : 'SHARE YOUR REVIEW';
      bannerColor = '#00af87';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Nous espérons que vous avez passé un excellent moment lors de votre visite au <strong>Mor Thai Spa</strong> !</p>
             <p>Votre avis nous tient à cœur. Si vous avez quelques minutes, nous serions ravis si vous pouviez partager votre expérience sur <strong>Tripadvisor</strong>.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>We hope you had a wonderful time during your visit to <strong>Mor Thai Spa</strong>!</p>
             <p>Your feedback is important to us. If you have a few minutes, we would be delighted if you could share your experience on <strong>Tripadvisor</strong>.</p>`);
      break;

    case 'request':
      // Use the new request email template for preview
      const htmlContentRequestPreview = generateRequestEmailHTML({
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
          created_at,
          duree: reservation.duree || null
        },
        language
      });
      
      return { success: true, html: htmlContentRequestPreview };

    case 'custom':
      bannerText = language === 'fr' ? 'MESSAGE' : 'MESSAGE';
      bannerColor = '#8B4513';
      messageContent = customMessage && customMessage.trim()
        ? (isHtmlContent 
          ? ''
          : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`)
        : (language === 'fr'
          ? `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
             <p>Merci de votre confiance.</p>`
          : `<p style="margin-top:0;"><strong>Dear Sir/Madam ${nomclient || '{{Name}}'},</strong></p>
             <p>Thank you for your trust.</p>`);
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
        : `<p style="margin-top:0;"><strong>Cher/ère Monsieur/Madame ${nomclient || '{{Name}}'},</strong></p>
           <p>${escapeHtml(customMessage).replace(/\n/g, '<br>')}</p>`;
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
      created_at,
      duree: reservation.duree || null,
      note: reservation.note || null
    },
    language,
    customMessage: customMessage && customMessage.trim() ? customMessage : null,
    showCalendarLink
  });

  return { success: true, html: htmlContent };
}

/**
 * Generate HTML email template for team notification (new reservation)
 */
async function generateTeamNotificationEmailHTML(reservationData) {
  const {
    reference,
    nomclient,
    email,
    numerotelephone,
    dateres,
    heureres,
    NomService,
    NomServiceFr,
    NomServiceEn,
    prixtotal,
    nbrpersonne = 1,
    modepaiement,
    duree
  } = reservationData;

  // Format dates
  const reservationDateObj = new Date(dateres);
  const formattedReservationDate = reservationDateObj.toLocaleDateString(
    'fr-FR',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const formattedReservationTime = heureres ? new Date(`2000-01-01T${heureres}`).toLocaleTimeString(
    'fr-FR',
    { hour: '2-digit', minute: '2-digit', hour12: false }
  ) : '';

  const serviceName = NomServiceFr || NomServiceEn || NomService || 'Service';

  // Determine duration
  let durationMinutes = null;
  if (duree) {
    durationMinutes = parseInt(duree);
  } else if (reservationData.service_uuid && prixtotal) {
    // Try to get duration from service offers
    durationMinutes = await getServiceDurationFromOffers(reservationData.service_uuid, parseFloat(prixtotal));
  } else if (reservationData.note) {
    // Try to extract duration from note field (e.g., "1h", "90min", "1h30")
    const note = reservationData.note.toLowerCase();
    const hourMatch = note.match(/(\d+)h/);
    const minMatch = note.match(/(\d+)min/);
    if (hourMatch || minMatch) {
      let totalMinutes = 0;
      if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
      if (minMatch) totalMinutes += parseInt(minMatch[1]);
      if (totalMinutes > 0) {
        durationMinutes = totalMinutes;
      }
    }
  }
  
  const durationText = durationMinutes ? `${durationMinutes} minutes` : 'Non spécifiée';

  // Payment method translation
  let paymentMethod = modepaiement || 'Non spécifié';
  if (paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('espèce')) {
    paymentMethod = 'Espèces';
  } else if (paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('carte')) {
    paymentMethod = 'Carte';
  } else if (paymentMethod.toLowerCase().includes('ligne') || paymentMethod.toLowerCase().includes('online')) {
    paymentMethod = 'En ligne';
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle demande de réservation - Mor Thai Spa</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Container -->
        <table width="700" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; font-family:Arial, Helvetica, sans-serif; border:1px solid #e0e0e0;">
          <!-- Header -->
          <tr>
            <td style="padding:20px 30px; background-color:#ffffff;">
              <div style="color:#dc3545; font-size:18px; font-weight:bold; margin-bottom:8px;">
                Mail Réception
              </div>
              <div style="color:#000000; font-size:16px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
                NOUVELLE DEMANDE DE RÉSERVATION
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#000000; font-size:14px; line-height:1.6;">
              <p style="margin-top:0; color:#000000;">
                <strong>Bonjour,</strong>
              </p>
              <p style="color:#000000;">
                Une nouvelle demande de réservation vient d'être enregistrée sur le site <strong>Mor Thaï Spa</strong>.
              </p>
              <p style="color:#000000;">
                Merci de procéder à la <strong>vérification des disponibilités</strong> et de <strong>contacter le client</strong> dans les plus brefs délais afin de confirmer ou ajuster le rendez-vous.
              </p>
            </td>
          </tr>

          <!-- Reference -->
          <tr>
            <td align="center" style="padding:0 30px 20px;">
              <div style="color:#000000; font-size:16px; font-weight:bold;">
                Référence : ${reference || 'N/A'}
              </div>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style="padding:0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <!-- Left Column: Client Information -->
                  <td width="50%" style="padding:15px; background-color:#f5f5f5; border:1px solid #e0e0e0; vertical-align:top;">
                    <div style="color:#000000; font-size:14px; margin-bottom:12px; font-weight:bold;">
                      Informations Client
                    </div>
                    <div style="color:#000000; font-size:13px; line-height:1.8;">
                      <p style="margin:8px 0;"><strong>Nom du client :</strong><br>${nomclient || 'N/A'}</p>
                      <p style="margin:8px 0;"><strong>Téléphone :</strong><br>${numerotelephone || 'N/A'}</p>
                      <p style="margin:8px 0;"><strong>Email :</strong><br>${email || 'N/A'}</p>
                    </div>
                  </td>
                  <!-- Right Column: Service Information -->
                  <td width="50%" style="padding:15px; background-color:#f5f5f5; border:1px solid #e0e0e0; vertical-align:top;">
                    <div style="color:#000000; font-size:14px; margin-bottom:12px; font-weight:bold;">
                      Informations Service
                    </div>
                    <div style="color:#000000; font-size:13px; line-height:1.8;">
                      <p style="margin:8px 0;"><strong>Soin :</strong><br><strong>${serviceName}</strong></p>
                      <p style="margin:8px 0;"><strong>Nombre de personnes :</strong><br><strong>${nbrpersonne}</strong></p>
                      <p style="margin:8px 0;"><strong>Durée :</strong><br><strong>${durationText}</strong></p>
                      <p style="margin:8px 0;"><strong>Mode de paiement :</strong><br><strong>${paymentMethod}</strong></p>
                      <p style="margin:8px 0;"><strong>Montant Total :</strong><br><strong>${prixtotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD</strong></p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Date & Time -->
          <tr>
            <td align="center" style="padding:0 30px 30px;">
              <div style="color:#000000; font-size:14px; font-weight:bold;">
                Date & heure souhaitées : ${formattedReservationDate}${formattedReservationTime ? ` à ${formattedReservationTime}` : ''}
              </div>
            </td>
          </tr>
        </table>
        <!-- End container -->
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send team notification email when a new reservation is created
 * @param {Object} reservation - Reservation object with client and service details
 * @returns {Promise<Object>} Result object with success status
 */
export async function sendTeamNotificationEmail(reservation) {
  const TEAM_EMAIL = process.env.TEAM_EMAIL || 'omardaou38@gmail.com';
  
  if (!reservation) {
    return { success: false, error: 'Reservation data is required' };
  }

  const subject = `Nouvelle demande de réservation - ${reservation.reference || 'Mor Thai Spa'}`;
  
  // Get duration for text version
  let durationMinutes = null;
  if (reservation.duree) {
    durationMinutes = parseInt(reservation.duree);
  } else if (reservation.service_uuid && reservation.prixtotal) {
    durationMinutes = await getServiceDurationFromOffers(reservation.service_uuid, parseFloat(reservation.prixtotal));
  }
  const durationText = durationMinutes ? `${durationMinutes} minutes` : 'Non spécifiée';
  
  // Generate HTML content
  const htmlContent = await generateTeamNotificationEmailHTML(reservation);
  
  // Generate plain text version
  const textContent = `Nouvelle demande de réservation

Référence : ${reservation.reference || 'N/A'}

Informations Client:
- Nom : ${reservation.nomclient || 'N/A'}
- Téléphone : ${reservation.numerotelephone || 'N/A'}
- Email : ${reservation.email || 'N/A'}

Informations Service:
- Soin : ${reservation.NomServiceFr || reservation.NomServiceEn || reservation.NomService || 'N/A'}
- Nombre de personnes : ${reservation.nbrpersonne || 1}
- Durée : ${durationText}
- Mode de paiement : ${reservation.modepaiement || 'Non spécifié'}
- Montant Total : ${reservation.prixtotal || 0} MAD

Date & heure souhaitées : ${reservation.dateres}${reservation.heureres ? ` à ${reservation.heureres}` : ''}

Merci de procéder à la vérification des disponibilités et de contacter le client dans les plus brefs délais.`;

  try {
    const result = await sendEmail(TEAM_EMAIL, subject, textContent, htmlContent);
    return result;
  } catch (error) {
    console.error('Error sending team notification email:', error);
    return {
      success: false,
      error: error.message,
      errorDetails: error
    };
  }
}

