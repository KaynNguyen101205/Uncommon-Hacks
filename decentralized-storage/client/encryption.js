// encryption.js

// Function to generate an AES-GCM key (256-bit)
async function generateAESKey() {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true, // extractable so we can export it later if needed
      ["encrypt", "decrypt"]
    );
    return key;
  }
  
  // Function to encrypt data using AES-GCM
  async function encryptData(data, key) {
    // Generate a random 12-byte initialization vector (IV)
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
  
  // Helper function: Convert ArrayBuffer to Hex String
  function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Listen for the Encrypt button click
  document.getElementById('encryptButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
      alert("Please select a file to encrypt.");
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(event) {
      const fileData = event.target.result; // ArrayBuffer
      console.log("Original file data:", fileData);
      
      // Generate AES key and encrypt the file
      const aesKey = await generateAESKey();
      console.log("AES Key generated. (Keep it secret! Copy it from the console for decryption.)");
      
      const { iv, encryptedData } = await encryptData(fileData, aesKey);
      console.log("File encrypted successfully.");
      console.log("IV (hex):", bufferToHex(iv));
      console.log("Encrypted Data (hex):", bufferToHex(encryptedData));
      
      // Export and log AES key for decryption (copy this value)
      const exportedKey = await crypto.subtle.exportKey("raw", aesKey);
      console.log("AES Key (hex):", bufferToHex(exportedKey));
      
      // Save encryption result as JSON (this is what you'll download or upload to Pinata)
      const result = {
        iv: bufferToHex(iv),
        encryptedData: bufferToHex(encryptedData)
      };
      
      // Save the JSON string globally
      window.encryptedFileJSON = JSON.stringify(result, null, 2);
      alert("File encrypted! Check the console for details.");
    };
    
    reader.onerror = function(error) {
      console.error("Error reading file:", error);
    };
    
    reader.readAsArrayBuffer(file);
  });
  