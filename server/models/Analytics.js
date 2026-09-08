import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true
    },
    visits: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
