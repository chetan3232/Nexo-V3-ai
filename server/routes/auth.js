import express from 'express';
import { supabase } from '../database/db.js';

const router = express.Router();

// Email OTP Request
router.post('/otp/request', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: req.headers.origin || 'http://localhost:3000',
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ success: true, message: 'OTP sent to your email', data });
});

// Email OTP Verification
router.post('/otp/verify', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    return res.status(400).json({ error: 'Email and token are required' });
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Create user profile in users table if needed
  if (data?.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || email.split('@')[0],
      avatar_url: data.user.user_metadata?.avatar_url || '',
    }).select(); // select() to ignore error on duplicate
  }

  return res.json({ success: true, session: data.session, user: data.user });
});

// OAuth Redirect Mock (Client handles actual OAuth redirect, server provides helpers)
router.get('/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  // Mock Redirect URL back to app home
  const redirectUrl = req.headers.origin || 'http://localhost:3000';
  return res.json({
    url: `${redirectUrl}/auth/callback?provider=${provider}&access_token=mock-token`,
  });
});

export default router;
