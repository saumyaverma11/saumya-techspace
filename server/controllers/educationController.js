import mongoose from 'mongoose';
import Education from '../models/Education.js';

export const createEducation = async (req, res) => {
  try {
    const { degree, institution, location, startYear, endYear, current, description, grade, order } = req.body;

    if (!degree || !institution) {
      return res.status(400).json({
        success: false,
        message: 'Degree and institution are required'
      });
    }

    const education = await Education.create({
      degree,
      institution,
      location,
      startYear,
      endYear,
      current,
      description,
      grade,
      order
    });

    res.status(201).json({
      success: true,
      data: education
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getEducations = async (req, res) => {
  try {
    const educations = await Education.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: educations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getEducationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid education ID format'
      });
    }

    const education = await Education.findById(id);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }

    res.status(200).json({
      success: true,
      data: education
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid education ID format'
      });
    }

    const updatedEducation = await Education.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedEducation) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedEducation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid education ID format'
      });
    }

    const deletedEducation = await Education.findByIdAndDelete(id);

    if (!deletedEducation) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Education deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
