// utils/mintNFT.js
import { ethers } from "ethers";
import contractABI from "../contractABI/contractABI.json";

export async function mintNFT(to, metadataURI) {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    // Connect to MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      contractABI,
      signer
    );

    // Trigger MetaMask popup
    const tx = await contract.mint(to, metadataURI);
    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Mint confirmed:", receipt);

    // Extract tokenId if Transfer event exists
    const iface = new ethers.Interface(contractABI);
    const logs = receipt.logs.map(log => {
      try {
        return iface.parseLog(log);
      } catch {
        return null;
      }
    }).filter(Boolean);

    let mintedTokenId = null;
    logs.forEach(log => {
      if (log.name === "Transfer") {
        mintedTokenId = log.args.tokenId.toString();
      }
    });

    return { txHash: receipt.hash, tokenId: mintedTokenId };

  } catch (err) {
    console.error("❌ Mint failed:", err);
    throw err;
  }
}
