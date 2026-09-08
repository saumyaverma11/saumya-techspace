import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    startYear: {
      type: String,
      default: '',
      trim: true
    },
    endYear: {
      type: String,
      default: '',
      trim: true
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    grade: {
      type: String,
      default: '',
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Education = mongoose.model('Education', educationSchema);

export default Education;
