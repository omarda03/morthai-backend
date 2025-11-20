import { Reservation } from '../models/Reservation.js';

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.getAll();
    res.json(reservations);
  } catch (error) {
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
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.update(id, req.body);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
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

