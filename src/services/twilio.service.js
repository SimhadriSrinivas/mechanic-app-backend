// src/services/twilio.service.js
const twilio = require('twilio');
const config = require('../config');
const { info, error } = require('../utils/logger');

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * sendSms
 * @param {string} to E.164 phone number, e.g. +919000258071
 * @param {string} body SMS text
 */
async function sendSms(to, body) {
  try {
    const msg = await client.messages.create({
      body,
      from: config.twilio.from,
      to
    });
    info('Twilio SID:', msg.sid);
    return msg;
  } catch (err) {
    error('Twilio sendSms error:', err.message || err);
    throw err;
  }
}

module.exports = { sendSms };
