import pool from '../config/database.js';
import { Reservation } from '../models/Reservation.js';

/**
 * Automatically mark confirmed reservations as "terminé" (completed)
 * if 3 hours have passed since the reservation end time
 */
export async function autoCompleteReservations() {
  try {
    console.log('🔄 Checking for reservations to auto-complete...');

    // Get current time
    const now = new Date();
    
    // Find all confirmed reservations
    const query = `
      SELECT reservation_uuid, reference, nomclient, dateres, heureres, statusres
      FROM reservation
      WHERE statusres = 'confirmed'
      ORDER BY dateres DESC, heureres DESC
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ No reservations to auto-complete');
      return { updated: 0, reservations: [] };
    }

    console.log(`📋 Found ${result.rows.length} reservation(s) to auto-complete`);

    const updatedReservations = [];

    // Update each reservation
    for (const reservation of result.rows) {
      try {
        // Calculate the reservation end time (date + time)
        const reservationDate = new Date(reservation.dateres);
        const [hours, minutes, seconds] = reservation.heureres.split(':');
        reservationDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);

        // Calculate when the reservation should be auto-completed (3 hours after end time)
        const autoCompleteTime = new Date(reservationDate.getTime() + (3 * 60 * 60 * 1000));

        // Only update if 3 hours have passed since the reservation end time
        if (now >= autoCompleteTime) {
          // Double-check status is still confirmed (in case it was manually changed)
          const currentReservation = await Reservation.getById(reservation.reservation_uuid);
          
          if (currentReservation && currentReservation.statusres === 'confirmed') {
            // Update to "terminé"
            await Reservation.update(reservation.reservation_uuid, {
              NomClient: currentReservation.nomclient,
              Email: currentReservation.email,
              NumeroTelephone: currentReservation.numerotelephone,
              DateRes: currentReservation.dateres,
              HeureRes: currentReservation.heureres,
              Service_UUID: currentReservation.service_uuid,
              ModePaiement: currentReservation.modepaiement,
              PrixTotal: currentReservation.prixtotal,
              NbrPersonne: currentReservation.nbrpersonne,
              StatusRes: 'completed',
              Note: currentReservation.note || '',
            }, null); // No admin email for auto-updates

            const reference = reservation.reference || `MOR-${reservation.reservation_uuid.substring(0, 4).toUpperCase()}`;
            console.log(`✅ Auto-completed reservation: ${reference} (${reservation.nomclient})`);
            
            updatedReservations.push({
              reference,
              nomclient: reservation.nomclient,
              reservation_uuid: reservation.reservation_uuid,
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error updating reservation ${reservation.reservation_uuid}:`, error);
      }
    }

    console.log(`✅ Auto-completed ${updatedReservations.length} reservation(s)`);
    
    return {
      updated: updatedReservations.length,
      reservations: updatedReservations,
    };
  } catch (error) {
    console.error('❌ Error in autoCompleteReservations:', error);
    return { updated: 0, reservations: [], error: error.message };
  }
}

