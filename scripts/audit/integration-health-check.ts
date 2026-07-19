/**
 * Integration Health Check
 * Actively pings third-party integrations to verify they are operational and correctly authenticated.
 */

import nodemailer from 'nodemailer';
import Groq from 'groq-sdk';
import Stripe from 'stripe';
import Pusher from 'pusher';

async function auditIntegrations() {
  console.log('--- Third-Party Integration Health Check ---\n');
  let hasErrors = false;

  // 1. SMTP / Nodemailer
  console.log('Testing SMTP connection...');
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // Usually false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });

    await transporter.verify();
    console.log('✅ SMTP Server is reachable and credentials are valid.');
  } catch (err: any) {
    console.error(`❌ CRITICAL: SMTP Connection failed. Emails will be silently dropped! Reason: ${err.message}`);
    hasErrors = true;
  }

  // 2. Groq AI
  console.log('\nTesting Groq AI Chatbot integration...');
  try {
    const groqKey = process.env.GROQ_API_KEY || 'BUILD_PLACEHOLDER';
    if (groqKey === 'BUILD_PLACEHOLDER') {
      throw new Error('Using BUILD_PLACEHOLDER as API key.');
    }

    const groq = new Groq({ apiKey: groqKey, timeout: 5000 });
    // Make a tiny, cheap request to verify auth
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1
    });
    console.log('✅ Groq API is reachable and credentials are valid.');
  } catch (err: any) {
    console.error(`❌ CRITICAL: Groq AI connection failed. Chatbot is broken. Reason: ${err.message}`);
    hasErrors = true;
  }

  // 3. Stripe
  console.log('\nTesting Stripe connection...');
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is missing');
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    await stripe.balance.retrieve();
    console.log('✅ Stripe API is reachable and credentials are valid.');
  } catch (err: any) {
    console.error(`❌ CRITICAL: Stripe connection failed. Payments will fail. Reason: ${err.message}`);
    hasErrors = true;
  }

  // 4. Pusher
  console.log('\nTesting Pusher Realtime connection...');
  try {
    const appId = process.env.PUSHER_APP_ID || '';
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
    const secret = process.env.PUSHER_SECRET || '';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (!appId || !key || !secret) {
      throw new Error('Missing Pusher credentials in environment.');
    }

    const pusher = new Pusher({ appId, key, secret, cluster });
    // Just trigger a test event on a test channel
    await pusher.trigger('health-check-channel', 'ping', { time: Date.now() });
    console.log('✅ Pusher API is reachable and credentials are valid.');
  } catch (err: any) {
    console.error(`❌ CRITICAL: Pusher connection failed. Realtime features and Webhooks will crash. Reason: ${err.message}`);
    hasErrors = true;
  }

  console.log('\n--- Health Check Complete ---');
  if (hasErrors) {
    process.exit(1);
  }
}

auditIntegrations().catch(console.error);
