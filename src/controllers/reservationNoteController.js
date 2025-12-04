import { ReservationNote } from '../models/ReservationNote.js';
import { Reservation } from '../models/Reservation.js';

// Get all notes for a reservation
export const getReservationNotes = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify reservation exists
    const reservation = await Reservation.getById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const notes = await ReservationNote.getByReservationId(id);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching reservation notes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a new note to a reservation
export const addReservationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note is required' });
    }

    // Verify reservation exists
    const reservation = await Reservation.getById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Get username from JWT token (set by authMiddleware)
    const username = req.user?.username || 'Admin';

    // Create the note
    const newNote = await ReservationNote.create({
      reservation_uuid: id,
      note: note.trim(),
      created_by: username,
    });

    // Emit WebSocket event for new note
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new:reservation_note', newNote);
    }

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error adding reservation note:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a note
export const deleteReservationNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    // Verify reservation exists
    const reservation = await Reservation.getById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Delete the note
    const deletedNote = await ReservationNote.delete(noteId);
    
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Emit WebSocket event for deleted note
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('delete:reservation_note', { reservation_uuid: id, note_uuid: noteId });
    }

    res.json({ message: 'Note deleted successfully', note: deletedNote });
  } catch (error) {
    console.error('Error deleting reservation note:', error);
    res.status(500).json({ error: error.message });
  }
};

