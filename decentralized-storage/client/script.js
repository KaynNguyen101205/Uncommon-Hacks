import { ethers } from "https://cdn.jsdelivr.net/npm/ethers/dist/ethers.esm.min.js";

// ==============================
// Smart Contract Information (Midnight)
// ==============================
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed Midnight contract address
// Use the ABI from your MidnightAccessControlABI.json (only the "abi" array)
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "fileCID", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "FileRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "fileCID", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "AccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "fileCID", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "AccessRevoked",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "fileCID", "type": "string" }
    ],
    "name": "registerFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "fileCID", "type": "string" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "fileCID", "type": "string" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "fileCID", "type": "string" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "isAuthorized",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ==============================
// Authentication Code
// ==============================
async function checkWalletUnlocked() {
  if (typeof window.ethereum === 'undefined') {
    console.log('MetaMask is not installed.');
    return;
  }
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (accounts.length === 0) {
    console.log('Your wallet is locked.');
  } else {
    console.log('Your wallet is unlocked. Accounts:', accounts);
  }
}

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed. Please install MetaMask.');
    return null;
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

document.getElementById('loginButton').addEventListener('click', async () => {
  await checkWalletUnlocked();
  const account = await connectWallet();
  if (account) {
    console.log('Connected account:', account);
    alert('Wallet connected: ' + account);
  } else {
    console.log('Wallet connection failed or was cancelled.');
  }
});

checkWalletUnlocked();

// ==============================
// File Encryption Code
// ==============================
let encryptedFileJSON = "";

async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );
  return { iv, encryptedData };
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('encryptButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  if (fileInput.files.length === 0) {
    alert("Please select a file to encrypt.");
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(event) {
    const fileData = event.target.result;
    console.log("Original file data:", fileData);
    const aesKey = await generateAESKey();
    console.log("AES Key generated. (Keep it secret! Copy it from the console for decryption.)");
    const { iv, encryptedData } = await encryptData(fileData, aesKey);
    console.log("File encrypted successfully.");
    console.log("IV (hex):", bufferToHex(iv));
    console.log("Encrypted Data (hex):", bufferToHex(encryptedData));
    const exportedKey = await crypto.subtle.exportKey("raw", aesKey);
    console.log("AES Key (hex):", bufferToHex(exportedKey));
    const result = {
      iv: bufferToHex(iv),
      encryptedData: bufferToHex(encryptedData)
    };
    encryptedFileJSON = JSON.stringify(result, null, 2);
    alert("File encrypted! You can now download or upload it to Pinata.");
  };
  reader.onerror = function(error) {
    console.error("Error reading file:", error);
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('downloadEncryptedButton').addEventListener('click', () => {
  if (!encryptedFileJSON) {
    alert("No encrypted file available. Please encrypt a file first.");
    return;
  }
  downloadFile("encrypted_file.json", encryptedFileJSON);
});

// ==============================
// Pinata Storage Code
// ==============================
async function uploadToPinata(jsonContent) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replace with your actual Pinata API credentials
        'pinata_api_key': 'fc14de46b7ec27340af7',
        'pinata_secret_api_key': 'bdd01572d5d85cd0c75d5979d40166aeaf7fed34422291820b6b7f993481cd05'
      },
      body: jsonContent
    });
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }
    const result = await response.json();
    console.log("File uploaded to Pinata with CID:", result.IpfsHash);
    alert("File uploaded to Pinata. CID: " + result.IpfsHash);
    return result;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    alert("Error uploading file to Pinata. Check console for details.");
    throw error;
  }
}

document.getElementById('uploadPinataButton').addEventListener('click', async () => {
  if (!encryptedFileJSON) {
    alert("No encrypted file available. Please encrypt a file first.");
    return;
  }
  await uploadToPinata(encryptedFileJSON);
});

// ==============================
// File Decryption Code
// ==============================
function hexToBuffer(hex) {
  const typedArray = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return typedArray.buffer;
}

async function importAESKeyFromHex(hexKey) {
  const keyBuffer = hexToBuffer(hexKey);
  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );
}

async function decryptData(encryptedDataHex, ivHex, key) {
  const encryptedBuffer = hexToBuffer(encryptedDataHex);
  const ivBuffer = new Uint8Array(hexToBuffer(ivHex));
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );
    return decryptedBuffer;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

let uploadedEncryptedFileData = null;

document.getElementById('uploadDecryptButton').addEventListener('click', () => {
  const encryptedFileInput = document.getElementById('encryptedFileInput');
  if (encryptedFileInput.files.length === 0) {
    alert("Please select the encrypted JSON file.");
    return;
  }
  const file = encryptedFileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      uploadedEncryptedFileData = JSON.parse(event.target.result);
      console.log("Uploaded encrypted file data:", uploadedEncryptedFileData);
      alert("Encrypted file loaded successfully!");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Failed to parse the encrypted file. Ensure it's a valid JSON file.");
    }
  };
  reader.onerror = function(error) {
    console.error("Error reading file:", error);
    alert("Error reading the encrypted file.");
  };
  reader.readAsText(file);
});

document.getElementById('downloadDecryptedButton').addEventListener('click', async () => {
  if (!uploadedEncryptedFileData) {
    alert("Please upload an encrypted file first.");
    return;
  }
  const aesKeyHex = document.getElementById('aesKeyInput').value.trim();
  if (!aesKeyHex) {
    alert("Please enter the AES key (in hex) used during encryption.");
    return;
  }
  const aesKey = await importAESKeyFromHex(aesKeyHex);
  const decryptedBuffer = await decryptData(
    uploadedEncryptedFileData.encryptedData,
    uploadedEncryptedFileData.iv,
    aesKey
  );
  if (!decryptedBuffer) {
    alert("Decryption failed. Check the AES key and file.");
    return;
  }
  const blob = new Blob([decryptedBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "decrypted_file";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("Decryption successful! Decrypted file downloaded.");
});

// ==============================
// Smart Contract Interaction Code (Midnight)
// ==============================
async function connectWithEthers() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install MetaMask.");
    return;
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return { provider, signer };
}

async function getContract() {
  const { signer } = await connectWithEthers();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  return contract;
}

async function registerFile(fileCID) {
    try {
      const contract = await getContract();
      const tx = await contract.registerFile(fileCID);
      await tx.wait();
      console.log("File registered successfully with CID:", fileCID);
      alert("File registered successfully!");
    } catch (error) {
      console.error("Error registering file:", error);
      alert("Error registering file. Check console for details.");
    }
}

async function checkAccess(fileCID, userAddress) {
  try {
    const contract = await getContract();
    const authorized = await contract.isAuthorized(fileCID, userAddress);
    console.log("Access authorized:", authorized);
    alert("Access authorized: " + authorized);
  } catch (error) {
    console.error("Error checking access:", error);
    alert("Error checking access. Check console for details.");
  }
}

document.getElementById("registerFileButton").addEventListener("click", async () => {
  const cid = document.getElementById("fileCIDInput").value;
  if (!cid) {
    alert("Please enter a file CID.");
    return;
  }
  await registerFile(cid);
});

document.getElementById("checkAccessButton").addEventListener("click", async () => {
  const cid = document.getElementById("fileCIDInput").value;
  const user = document.getElementById("userAddressInput").value;
  if (!cid || !user) {
    alert("Please enter both file CID and user address.");
    return;
  }
  await checkAccess(cid, user);
});
