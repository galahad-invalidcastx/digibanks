let encryptionKey = null

export async function initEncryption() {
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

export async function encryptData(data) {
  const key = await initEncryption()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptData(encryptedB64) {
  try {
    const key = await initEncryption()
    const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch(e) {
    console.error("Decrypt error:", e)
    return null
  }
}