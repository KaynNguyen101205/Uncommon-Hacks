// server/index.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { ethers } = require('ethers');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for nonces (for demo purposes)
const nonces = {};

// Endpoint to generate and send a unique nonce
app.get('/api/getNonce', (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  
  // Generate a random nonce as a hex string
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Store the nonce using the lowercase wallet address as key
  nonces[address.toLowerCase()] = nonce;
  console.log(`Generated nonce for ${address}: ${nonce}`);
  
  res.json({ nonce });
});

// Endpoint to verify the user's signature
app.post('/api/verify', (req, res) => {
  const { address, nonce, signature } = req.body;
  if (!address || !nonce || !signature) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  
  // Retrieve the stored nonce for this address
  const storedNonce = nonces[address.toLowerCase()];
  if (!storedNonce || storedNonce !== nonce) {
    return res.status(400).json({ success: false, error: 'Invalid nonce' });
  }
  
  try {
    // Recover the address from the signature and the nonce
    const recoveredAddress = ethers.utils.verifyMessage(nonce, signature);
    console.log('Recovered address:', recoveredAddress);
    console.log('Provided address:', address);
    
    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      // Optionally, delete the nonce after successful verification to prevent reuse
      delete nonces[address.toLowerCase()];
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: 'Signature verification failed' });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
