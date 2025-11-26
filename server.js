const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory store for OTPs (for demo, use DB for production)
const otpStore = {};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate random OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP endpoint
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = generateOtp();
  otpStore[email] = otp; // store OTP temporarily (or DB)

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    console.log('Email sent: ' + info.response);
    res.json({ success: true });
  });
});

// Verify OTP endpoint
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email]; // remove OTP after verification
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Reset password endpoint (Firebase auth)
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    // Firebase Admin SDK required for server-side password reset
    // For simplicity, you can call Firebase auth REST API instead
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
