const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const nodemailer        = require('nodemailer');
const { supabaseAdmin } = require('../config/supabase');

// ── Helper: sign JWT ────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: nodemailer transporter ─────────────────────
const getMailTransporter = () => {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

// ── Helper: send OTP email via nodemailer ───────────────
const sendOtpEmail = async (email, code) => {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"ShopKart" <noreply@shopkart.com>',
    to: email,
    subject: 'Your ShopKart Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#F0522B,#ff8c66);padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.03em;">ShopKart</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your verification code</p>
        </div>
        <div style="padding:40px;">
          <p style="color:#374151;font-size:15px;margin:0 0 24px;">Use the code below to sign in. It expires in <strong>${expiryMins} minutes</strong>.</p>
          <div style="background:#fff7f5;border:2px dashed #F0522B;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#F0522B;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:13px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} ShopKart. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Your ShopKart verification code is: ${code}\n\nIt expires in ${expiryMins} minutes.\n\nIf you didn't request this, ignore this email.`,
  });

  return true;
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Sends OTP via Supabase email (primary) or nodemailer / console (fallback)
// ─────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    // Check whether user exists so frontend can show the right UI
    const { data: existingUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    const isNewUser = !existingUsers?.length;

    // ── 1. Try nodemailer / SMTP first if configured ───
    const transporter = getMailTransporter();
    if (transporter) {
      const code    = String(Math.floor(100000 + Math.random() * 900000));
      const expMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
      const expires = new Date(Date.now() + expMins * 60 * 1000).toISOString();

      // Invalidate old unused codes for this email first
      await supabaseAdmin
        .from('otp_codes')
        .update({ used: 1 })
        .eq('phone', email)
        .eq('used', 0);

      // Insert new code
      await supabaseAdmin.from('otp_codes').insert({
        phone:      email,
        code,
        purpose:    req.body.purpose || 'login',
        expires_at: expires,
      });

      try {
        const emailSent = await sendOtpEmail(email, code);
        if (emailSent) {
          console.log(`📧 OTP email sent via nodemailer to ${email}`);
          return res.json({
            success: true,
            message: 'Verification code sent to your email.',
            isNewUser,
            provider: 'smtp',
          });
        }
      } catch (smtpErr) {
        console.error('SMTP sending failed, falling back to Supabase/Console:', smtpErr);
      }
    }

    // ── 2. Try Supabase built-in email OTP ─────────────
    // shouldCreateUser: true — Supabase needs an auth.users record to send OTP.
    // We manage our own user_profiles table; the Supabase auth record is just
    // a mail-sending vehicle and doesn't affect our app's user management.
    const { error: supabaseOtpError } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (!supabaseOtpError) {
      console.log(`📧 Supabase OTP email sent to ${email}`);
      return res.json({
        success: true,
        message: 'Verification code sent to your email.',
        isNewUser,
        provider: 'supabase',
      });
    }

    const isRateLimited =
      supabaseOtpError.status === 429 ||
      supabaseOtpError.message?.includes('rate') ||
      supabaseOtpError.message?.includes('email_rate_limit');

    console.warn('Supabase signInWithOtp failed:', supabaseOtpError.message);

    // ── 3. Console fallback (dev only) ──────────────────
    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const expMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expires = new Date(Date.now() + expMins * 60 * 1000).toISOString();

    // Invalidate old unused codes for this email first
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: 1 })
      .eq('phone', email)
      .eq('used', 0);

    // Insert new code
    await supabaseAdmin.from('otp_codes').insert({
      phone:      email,
      code,
      purpose:    req.body.purpose || 'login',
      expires_at: expires,
    });

    console.log(`
=====================================================
📧 [DEV CONSOLE OTP — no SMTP configured]
To:      ${email}
Code:    ${code}
Expiry:  ${expMins} minutes
=====================================================
    `);

    return res.json({
      success: true,
      message: process.env.NODE_ENV === 'production'
        ? 'Verification code sent to your email.'
        : `Dev mode: OTP is ${code} (check server console)`,
      isNewUser,
      provider: 'console',
      // Only expose code in development to aid testing
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    });

  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Verifies OTP from local table first, then Supabase Auth
// ─────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code, name } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
    }

    let isVerified = false;

    // ── 1. Check local otp_codes table ─────────────────
    const now = new Date().toISOString();
    const { data: localOtpRows } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .eq('phone', email)
      .eq('code', code)
      .eq('used', 0)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (localOtpRows?.length) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ used: 1 })
        .eq('id', localOtpRows[0].id);
      isVerified = true;
      console.log(`✅ Verified via local OTP table for ${email}`);
    } else {
      // ── 2. Verify via Supabase Auth (for codes sent by Supabase) ──
      const { error: authError } = await supabaseAdmin.auth.verifyOtp({
        email,
        token: code,
        type:  'email',
      });

      if (authError) {
        console.warn('Supabase verifyOtp failed:', authError.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code.',
        });
      }
      isVerified = true;
      console.log(`✅ Verified via Supabase Auth OTP for ${email}`);
    }

    // ── Upsert user in user_profiles ───────────────────
    const { data: existingUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .limit(1);

    let user  = existingUsers?.[0];
    let isNew = false;

    if (!user) {
      isNew = true;
      const displayName = (name?.trim()) || email.split('@')[0];
      const { data: newUser, error: insertErr } = await supabaseAdmin
        .from('user_profiles')
        .insert({ name: displayName, email, is_verified: 1, is_active: 1 })
        .select()
        .single();
      if (insertErr) throw insertErr;
      user = newUser;
    } else {
      // Mark as verified if not already
      if (!user.is_verified) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ is_verified: 1 })
          .eq('id', user.id);
      }
    }

    const token = signToken(user.id, user.role);

    return res.json({
      success: true,
      message: isNew ? 'Account created successfully!' : 'Login successful!',
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        avatar_url: user.avatar_url,
      },
      isNew,
    });

  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/auth/login  (email + password — admin only)
// ─────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', 1)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user.id, user.role);
    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, email, phone, role, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ name, phone: phone || null })
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
};
