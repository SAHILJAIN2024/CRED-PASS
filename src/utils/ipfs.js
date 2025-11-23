// utils/ipfs
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mime from "mime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

if (!process.env.PINATA_JWT) {
  throw new Error("❌ Missing PINATA_JWT in .env");
}

const PINATA_API = "https://api.pinata.cloud/pinning";

export async function uploadFileTOIPFS(filePath) {
  try {
    const content = await fs.promises.readFile(filePath);
    const fileName = path.basename(filePath);
    const type = mime.getType(filePath) || "application/octet-stream";

    const form = new FormData();
    const file = new File([content], fileName, { type });
    form.append("file", file, fileName);

    const res = await fetch(`${PINATA_API}/pinFileToIPFS`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: form,
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log("✅ File uploaded:", `ipfs://${data.IpfsHash}`);
    return `ipfs://${data.IpfsHash}`;
  } catch (err) {
    console.error("❌ File upload failed:", err.message);
    throw err;
  }
}

export async function uploadMetadataToIPFS(metadata) {
  try {
    if (!metadata || typeof metadata !== "object") {
      throw new Error("Metadata must be an object");
    }
    const res = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log("✅ Metadata uploaded:", `ipfs://${data.IpfsHash}`);
    return `ipfs://${data.IpfsHash}`;
  } catch (err) {
    console.error("❌ Metadata upload failed:", err.message);
    throw err;
  }
}

export const gatewayUrl = (cidOrUri) =>
  `https://gateway.pinata.cloud/ipfs/${String(cidOrUri).replace(/^ipfs:\/\//, "")}`;




