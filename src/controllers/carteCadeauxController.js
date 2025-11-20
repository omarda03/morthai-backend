import { CarteCadeaux } from '../models/CarteCadeaux.js';

export const getAllCarteCadeaux = async (req, res) => {
  try {
    const cartes = await CarteCadeaux.getAll();
    res.json(cartes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCarteCadeauxById = async (req, res) => {
  try {
    const { id } = req.params;
    const carte = await CarteCadeaux.getById(id);
    
    if (!carte) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    res.json(carte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCarteCadeaux = async (req, res) => {
  try {
    const carte = await CarteCadeaux.create(req.body);
    res.status(201).json(carte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCarteCadeaux = async (req, res) => {
  try {
    const { id } = req.params;
    const carte = await CarteCadeaux.update(id, req.body);
    
    if (!carte) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    res.json(carte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCarteCadeaux = async (req, res) => {
  try {
    const { id } = req.params;
    const carte = await CarteCadeaux.delete(id);
    
    if (!carte) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    res.json({ message: 'Gift card deleted successfully', carte });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

