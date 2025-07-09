const Checkin = require('../models/Checkin');

exports.checkin = async (req, res, next) => {
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
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const history = await Checkin.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
