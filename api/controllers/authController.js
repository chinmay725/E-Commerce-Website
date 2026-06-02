const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool    = require('../config/db');

// ── Helper: generate JWT ────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: generate 6-digit OTP ────────────────────
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Helper: send OTP (Twilio / console fallback) ─────
const sendOTP = async (phone, code) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.NODE_ENV === 'production') {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: `Your ShopKart OTP is ${code}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   `+91${phone}`,
    });
  } else {
    // Development fallback – log OTP to console
    console.log(`\n📱 [DEV OTP] Phone: ${phone}  Code: ${code}\n`);
  }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/send-otp
// ─────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number required.' });
    }

    // Rate limit: max 3 OTPs per phone per 10 min
    const [recent] = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM otp_codes
       WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND used = 0`,
      [phone]
    );
    if (recent[0].cnt >= 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Wait 10 minutes.' });
    }

    // Invalidate previous unused OTPs
    await pool.execute('UPDATE otp_codes SET used = 1 WHERE phone = ? AND used = 0', [phone]);

    const code    = generateOTP();
    const expires = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);
    const purpose = req.body.purpose || 'login';

    await pool.execute(
      'INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES (?,?,?,?)',
      [phone, code, purpose, expires]
    );

    await sendOTP(phone, code);

    // Check if user exists
    const [users] = await pool.execute('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone]);

    res.json({
      success: true,
      message: 'OTP sent successfully.',
      isNewUser: users.length === 0,
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone and OTP code are required.' });
    }

    // Verify OTP
    const [otpRows] = await pool.execute(
      `SELECT id FROM otp_codes
       WHERE phone = ? AND code = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );
    if (!otpRows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // Mark OTP as used
    await pool.execute('UPDATE otp_codes SET used = 1 WHERE id = ?', [otpRows[0].id]);

    // Get or create user
    let [users] = await pool.execute('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);
    let user = users[0];
    let isNew = false;

    if (!user) {
      isNew = true;
      const displayName = name || `User${phone.slice(-4)}`;
      const [result] = await pool.execute(
        'INSERT INTO users (name, phone, is_verified) VALUES (?,?,1)',
        [displayName, phone]
      );
      const [newUsers] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId]);
      user = newUsers[0];
    } else {
      // Mark as verified
      await pool.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
    }

    const token = signToken(user.id, user.role);

    res.json({
      success: true,
      message: isNew ? 'Account created successfully!' : 'Login successful!',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
        avatar_url: user.avatar_url,
      },
      isNew,
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ─────────────────────────────────────────────────────
// POST /api/auth/login  (email+password for admin)
// ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user.id, user.role);
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// ─────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email || null, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};
