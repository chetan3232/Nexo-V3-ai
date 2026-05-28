import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());
const getVaultPath = () => path.join(getWorkspaceRoot(), '.nexo', 'vault.json');

// AES-256-CBC key derivation
const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.NEXO_VAULT_SECRET ?? 'nexo-default-vault-secret-key-32-chars-long';
const KEY = crypto.scryptSync(SECRET, 'nexo-salt', 32);
const IV = Buffer.alloc(16, 0); // static IV for file persistence

// Encryption helpers
function encrypt(text) {
  if (!text) return '';
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(text) {
  if (!text) return '';
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return '';
  }
}

// 1. Store Credentials
router.post('/store', async (req, res) => {
  const { openaiKey, anthropicKey, geminiKey, nvidiaKey } = req.body;
  const vaultPath = getVaultPath();

  try {
    let currentVault = {};
    try {
      const content = await fs.readFile(vaultPath, 'utf8');
      currentVault = JSON.parse(content);
    } catch (e) {
      // Create directories if missing
      await fs.mkdir(path.dirname(vaultPath), { recursive: true });
    }

    if (openaiKey !== undefined) currentVault.openaiKey = encrypt(openaiKey);
    if (anthropicKey !== undefined) currentVault.anthropicKey = encrypt(anthropicKey);
    if (geminiKey !== undefined) currentVault.geminiKey = encrypt(geminiKey);
    if (nvidiaKey !== undefined) currentVault.nvidiaKey = encrypt(nvidiaKey);

    await fs.writeFile(vaultPath, JSON.stringify(currentVault, null, 2), 'utf8');
    
    // Dynamically update environment variables for immediate process use
    if (openaiKey) process.env.OPENAI_API_KEY = openaiKey;
    if (anthropicKey) process.env.ANTHROPIC_API_KEY = anthropicKey;
    if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
    if (nvidiaKey) process.env.NVIDIA_API_KEY = nvidiaKey;

    res.json({ ok: true, message: 'API Credentials securely saved in vault.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to mask key
const maskKey = (keyText) => {
  if (!keyText) return '';
  const decrypted = decrypt(keyText);
  if (!decrypted) return '';
  if (decrypted.length < 8) return '********';
  return `${decrypted.substring(0, 4)}...${decrypted.substring(decrypted.length - 4)}`;
};

// 2. List Configured (Masked) Keys
router.get('/keys', async (req, res) => {
  const vaultPath = getVaultPath();
  try {
    let vault = {};
    try {
      const content = await fs.readFile(vaultPath, 'utf8');
      vault = JSON.parse(content);
    } catch (e) {}

    res.json({
      keys: {
        openaiKey: maskKey(vault.openaiKey),
        anthropicKey: maskKey(vault.anthropicKey),
        geminiKey: maskKey(vault.geminiKey),
        nvidiaKey: maskKey(vault.nvidiaKey),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
