// src/utils/wallet.js
import * as bip39 from 'bip39'

// Libauth is loaded globally from CDN (see index.html)
const libauth = window.libauth || window.Libauth
if (!libauth) {
  throw new Error('Libauth not loaded. Please refresh the page.')
}

const {
  mnemonicToSeed,
  deriveHdPrivateKey,
  deriveHdPath,
  derivePublicKeyFromPrivateKey,
  secp256k1,
  cashAddressToLockingBytecode,
  lockingBytecodeToCashAddress
} = libauth

const STORAGE_KEY = "cauldron_wallet_12word"
const BCH_DERIVATION_PATH = "m/44'/145'/0'/0/0"

// ---------- Wallet Generation ----------
export async function generateWallet(existingMnemonic = null) {
  try {
    const mnemonic = existingMnemonic || bip39.generateMnemonic(128) // 12 words
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid BIP39 mnemonic")
    }

    const seed = await mnemonicToSeed(mnemonic, "")
    const masterNode = await deriveHdPrivateKey({ seed })
    const hdPathResult = await deriveHdPath(masterNode, BCH_DERIVATION_PATH)

    if (typeof hdPathResult === 'string') {
      throw new Error(`Derivation error: ${hdPathResult}`)
    }

    const publicKey = derivePublicKeyFromPrivateKey(secp256k1, hdPathResult.privateKey)

    const lockingBytecode = cashAddressToLockingBytecode({
      type: 'p2pkh',
      payload: publicKey
    })
    const cashAddress = lockingBytecodeToCashAddress({
      lockingBytecode: lockingBytecode.bytecode,
      prefix: 'bitcoincash'
    })

    const fingerprint = Array.from(publicKey)
      .slice(0, 4)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return {
      mnemonic,
      cashAddress,
      fingerprint,
      path: BCH_DERIVATION_PATH,
      created: Date.now()
    }
  } catch (error) {
    console.error("Wallet generation error:", error)
    throw new Error(`Wallet generation failed: ${error.message}`)
  }
}

// ---------- Encryption (AES-GCM) ----------
let encryptionKey = null

async function initEncryption() {
  if (!encryptionKey) {
    let savedKey = localStorage.getItem("cauldron_enc_key_v2")
    if (savedKey) {
      const keyData = JSON.parse(savedKey)
      encryptionKey = await crypto.subtle.importKey(
        "jwk", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
      )
    } else {
      encryptionKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
      )
      const exported = await crypto.subtle.exportKey("jwk", encryptionKey)
      localStorage.setItem("cauldron_enc_key_v2", JSON.stringify(exported))
    }
  }
  return encryptionKey
}

async function encryptData(data) {
  const key = await initEncryption()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function decryptData(encryptedB64) {
  try {
    const key = await initEncryption()
    const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch (e) {
    console.error("Decrypt error:", e)
    return null
  }
}

// ---------- Save / Load Wallet ----------
export async function saveWallet(walletData, setWallet, addLog) {
  try {
    const encrypted = await encryptData({
      mnemonic: walletData.mnemonic,
      fingerprint: walletData.fingerprint,
      cashAddress: walletData.cashAddress
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      encryptedData: encrypted,
      cashAddress: walletData.cashAddress,
      fingerprint: walletData.fingerprint,
      created: walletData.created
    }))
    setWallet(walletData)
    addLog(`✅ Wallet saved | ${shortAddr(walletData.cashAddress)}`)
  } catch (err) {
    addLog(`Save failed: ${err.message}`, true)
  }
}

export async function loadWallet(setWallet, addLog) {
  const savedRaw = localStorage.getItem(STORAGE_KEY)
  if (!savedRaw) return
  try {
    const stored = JSON.parse(savedRaw)
    const decrypted = await decryptData(stored.encryptedData)
    if (!decrypted?.mnemonic) throw new Error("Decryption failed")
    const regenerated = await generateWallet(decrypted.mnemonic)
    if (regenerated.cashAddress !== stored.cashAddress) {
      throw new Error("Integrity check failed")
    }
    setWallet(regenerated)
    addLog("🔐 Wallet restored")
  } catch (err) {
    addLog(`Restore failed: ${err.message}`, true)
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ---------- Helper ----------
export function shortAddr(addr) {
  return addr ? addr.slice(0, 14) + "..." + addr.slice(-10) : ""
}