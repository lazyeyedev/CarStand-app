const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  timeout: 20000,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
  },
});

const initializePayment = async ({ email, amount, metadata, callbackUrl }) => {
  const response = await paystackClient.post('/transaction/initialize', {
    email,
    amount: Math.round(amount * 100), // GHS to pesewas
    metadata,
    callback_url: callbackUrl,
    currency: 'GHS',
  });

  const { authorization_url, reference } = response.data.data;
  return { authorization_url, reference };
};

const verifyPayment = async (reference) => {
  const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  const transaction = response.data.data;

  if (transaction.status !== 'success') {
    throw new Error(`Payment not successful. Status: ${transaction.status}`);
  }

  return transaction;
};

module.exports = { initializePayment, verifyPayment };
