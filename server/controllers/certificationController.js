import mongoose from 'mongoose';
import Certification from '../models/Certification.js';

export const createCertification = async (req, res) => {
  try {
    const { name, issuer, issueDate, credentialId, credentialUrl, description, order } = req.body;

    if (!name || !issuer) {
      return res.status(400).json({
        success: false,
        message: 'Name and issuer are required'
      });
    }

    const certification = await Certification.create({
      name,
      issuer,
      issueDate,
      credentialId,
      credentialUrl,
      description,
      order
    });

    res.status(201).json({
      success: true,
      data: certification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: certifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCertificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certification ID format'
      });
    }

    const certification = await Certification.findById(id);

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: certification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certification ID format'
      });
    }

    const updatedCertification = await Certification.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedCertification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCertification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCertification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certification ID format'
      });
    }

    const deletedCertification = await Certification.findByIdAndDelete(id);

    if (!deletedCertification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
