import { Offre } from '../models/Offre.js';

export const getAllOffres = async (req, res) => {
  try {
    const offres = await Offre.getAll();
    res.json(offres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOffreById = async (req, res) => {
  try {
    const { id } = req.params;
    const offre = await Offre.getById(id);
    
    if (!offre) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOffreByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const offre = await Offre.getByCode(code);
    
    if (!offre) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOffre = async (req, res) => {
  try {
    const offre = await Offre.create(req.body);
    res.status(201).json(offre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const offre = await Offre.update(id, req.body);
    
    if (!offre) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const offre = await Offre.delete(id);
    
    if (!offre) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json({ message: 'Offer deleted successfully', offre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

