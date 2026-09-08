import Analytics from '../models/Analytics.js';
import Message from '../models/Message.js';

export const recordVisit = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const record = await Analytics.findOneAndUpdate(
      { date: today },
      { $inc: { visits: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const dailyVisits = await Analytics.find().sort({ date: -1 });

    const totalVisits = dailyVisits.reduce((acc, curr) => acc + curr.visits, 0);
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        dailyVisits,
        totalMessages,
        unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const allRecords = await Analytics.find();
    const totalVisits = allRecords.reduce((acc, curr) => acc + curr.visits, 0);

    const todayRecord = allRecords.find((rec) => rec.date === today);
    const todayVisits = todayRecord ? todayRecord.visits : 0;

    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        todayVisits,
        totalMessages,
        unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
