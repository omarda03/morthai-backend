import { Service } from '../models/Service.js';

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.getAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.getById(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const services = await Service.getByCategory(categoryId);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.update(id, req.body);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.delete(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully', service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

