// Initialize the Midnight client with your configuration
const client = new MidnightWallet({
    apiKey: "a6e2307aea0273a658ff5c38e7c7a5f1dd2befab59eed7e89c3467ffb22e4818|0300ebe1375421cc43c228700d525bd54b3342587cbeb42f1c877028ad633d7670f2667d69bf57d600d6f56ca18b2690956ea44c2c250f147503",
    baseURL: "http://localhost:6300",
    network: "testnet-02"  // Ensure this matches your Docker configuration
  });
  
  // ------------------------------
  // Authentication & Access Control
  // ------------------------------
  async function authenticateWithMidnight() {
    try {
      // The SDK handles wallet connection and authentication internally.
      await client.authenticate();
      const account = client.getAccount(); // Replace with the actual method to get the connected account
      console.log("User authenticated:", account);
      alert("Authentication successful! Account: " + account);
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Authentication failed. See console for details.");
    }
  }
  
  document.getElementById("loginButton").addEventListener("click", async () => {
    await authenticateWithMidnight();
  });
  
  // ------------------------------
  // File Upload & Registration
  // ------------------------------
  document.getElementById("uploadFileButton").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) {
      alert("Please select a file to upload.");
      return;
    }
    const file = fileInput.files[0];
    try {
      // Upload the file with encryption enabled.
      const cid = await client.storage.uploadFile(file, { encrypt: true });
      console.log("File uploaded with CID:", cid);
      document.getElementById("uploadStatus").innerText = "File uploaded! CID: " + cid;
      // Optionally, store the CID for later use.
      window.lastCID = cid;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. See console for details.");
    }
  });
  
  // ------------------------------
  // File Retrieval & Decryption
  // ------------------------------
  document.getElementById("fetchFileButton").addEventListener("click", async () => {
    const cid = document.getElementById("cidInput").value.trim();
    if (!cid) {
      alert("Please enter a valid CID.");
      return;
    }
    try {
      // Retrieve and decrypt the file using Midnight's SDK.
      const fileBlob = await client.storage.retrieveFile(cid, { decrypt: true });
      console.log("File retrieved and decrypted successfully.");
      document.getElementById("fetchStatus").innerText = "File retrieved and decrypted successfully!";
      
      // Create a temporary download link for the retrieved file.
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "retrieved_file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error retrieving file:", error);
      alert("Failed to retrieve/decrypt file. Check console for details.");
    }
  });
  