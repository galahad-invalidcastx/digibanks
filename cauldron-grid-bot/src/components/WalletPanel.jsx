import React, { useState } from 'react'
import QRCode from 'qrcode.react'
import { generateWallet, saveWallet, shortAddr } from '../utils/wallet'

export default function WalletPanel({ wallet, setWallet, addLog }) {
  const [showSeed, setShowSeed] = useState(false)
  const [seedContent, setSeedContent] = useState('')

  const handleGenerate = async () => {
    try {
      addLog("✨ Generating 12-word BIP39 wallet...")
      const generated = await generateWallet()
      await saveWallet(generated, setWallet, addLog)
      setSeedContent(generated.mnemonic)
      setShowSeed(true)
      addLog("✅ Wallet created: " + shortAddr(generated.cashAddress))
    } catch(err) {
      addLog(err.message, true)
    }
  }

  const handleImport = async () => {
    const mnemonic = prompt("Enter 12-word BIP39 seed phrase:")
    if (!mnemonic) return
    try {
      const cleaned = mnemonic.trim().toLowerCase().replace(/\s+/g, " ")
      const imported = await generateWallet(cleaned)
      await saveWallet(imported, setWallet, addLog)
      setSeedContent(imported.mnemonic)
      setShowSeed(true)
      addLog("🔑 Wallet imported: " + shortAddr(imported.cashAddress))
    } catch(err) {
      addLog("Import failed: " + err.message, true)
    }
  }

  const handleClear = () => {
    if (confirm("Delete wallet permanently?")) {
      localStorage.removeItem("cauldron_wallet_12word")
      setWallet(null)
      setShowSeed(false)
      addLog("🧹 Wallet cleared")
    }
  }

  const handleCopy = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.cashAddress)
      addLog("📋 Address copied")
    }
  }

  const handleShowSeed = () => {
    if (!wallet) {
      addLog("No wallet", true)
      return
    }
    setShowSeed(!showSeed)
    if (!showSeed) {
      setSeedContent(wallet.mnemonic)
    }
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-xl">
      <h2 className="text-xl font-semibold">👛 BCH CashToken Wallet</h2>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={handleGenerate} className="btn bg-green-800 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
          ✨ Generate 12-Word
        </button>
        <button onClick={handleImport} className="btn bg-stone-800 hover:bg-stone-700 px-4 py-2 rounded-lg text-sm">
          🔑 Import Seed
        </button>
        <button onClick={handleClear} className="btn bg-red-900 hover:bg-red-800 px-4 py-2 rounded-lg text-sm">
          🗑 Clear
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <span className="text-gray-400 text-sm">Status:</span>
          <span className={`text-sm ml-2 ${wallet ? 'text-green-300' : 'text-yellow-300'}`}>
            {wallet ? "✅ BCH Mainnet (12-Word BIP39)" : "No wallet"}
          </span>
        </div>
        
        {showSeed && (
          <div className="seed-box">
            <b>🔐 12-Word Seed Phrase (Cashonize Compatible)</b>
            <br />
            <span className="text-xs break-all">{seedContent}</span>
          </div>
        )}
        
        <div className="text-sm text-gray-400">BCH CashAddress (P2PKH)</div>
        <div className="address-box text-green-300">{wallet?.cashAddress || "—"}</div>
        
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleCopy} className="btn bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-xs">
            📋 Copy
          </button>
          <button onClick={handleShowSeed} className="btn bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-xs">
            👁 Show Seed
          </button>
        </div>
        
        {wallet && (
          <div className="flex justify-center mt-2">
            <QRCode value={wallet.cashAddress} size={130} bgColor="#111827" fgColor="#2ecc71" />
          </div>
        )}
        
        <div className="text-[11px] text-amber-400">
          🔒 Standard BIP39 12-word seed • Compatible with Cashonize.com
        </div>
      </div>
    </div>
  )
}