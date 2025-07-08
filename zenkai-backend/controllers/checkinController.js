const Checkin = require('../models/Checkin');

exports.checkin = async (req, res) => {
  const { energy, clarity, emotion, note } = req.body;

  try {
    const newCheckin = await Checkin.create({
      userId: req.userId,
      energy,
      clarity,
      emotion,
      note,
    });

    res.status(201).json({
      success: true,
      data: newCheckin,
    });
  } catch (err) {
    res.status(500).json({ error: 'Check-in failed' });
  }
};

exports.history = async (req, res) => {
  try {
    const history = await Checkin.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
