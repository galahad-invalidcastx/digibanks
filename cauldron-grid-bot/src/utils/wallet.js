import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import * as libauth from '@bitauth/libauth'
import { encryptData, decryptData } from './encryption'

const STORAGE_KEY = "cauldron_wallet_12word"
const BCH_DERIVATION_PATH = "m/44'/145'/0'/0/0"

export async function generateWallet(existingMnemonic = null) {
  try {
    const mnemonic = existingMnemonic || bip39.generateMnemonic(128)
    
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid BIP39 mnemonic")
    }
    
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed)
    const child = root.derivePath(BCH_DERIVATION_PATH)
    const pubkey = child.publicKey
    
    // Convert to CashAddress using libauth
    const ecPair = libauth.ECPair.fromPublicKey(pubkey)
    const publicKeyHash = libauth.crypto.hash160(pubkey)
    const cashAddressResult = libauth.encodeCashAddress(
      libauth.CashAddressNetworkPrefix.Mainnet,
      libauth.encodeP2pkhOutput(publicKeyHash)
    )
    
    const cashAddress = cashAddressResult.cashAddress
    
    const fingerprint = child.fingerprint?.toString("hex") || "00000000"
    
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
  } catch(err) {
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
  } catch(err) {
    addLog(`Restore failed: ${err.message}`, true)
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function shortAddr(addr) {
  return addr ? addr.slice(0, 14) + "..." + addr.slice(-10) : ""
}