const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

exports.signup = async (req, res, next) => {
  // ✅ 1. Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // ✅ 2. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already in use' });

    // ✅ 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // ✅ 4. Save new user
    const newUser = await User.create({ email, passwordHash });

    // ✅ 5. Create JWT
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  console.log("✅ Login route hit");
  console.log("🔍 req.body:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ Login validation failed:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log("🔍 Found user:", user);

    if (!user) {
      console.log("❌ No user found with that email");
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    console.log("🔐 Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log("✅ Token created:", token);
    res.status(200).json({ token, user: { id: user._id, email: user.email } });

  } catch (err) {
    next(err);
  }
};


exports.verify = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('email');
    if (!user) return res.status(401).json({ valid: false });
    res.json({ valid: true, user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
};
