import React, { useState, useEffect } from 'react'
import WalletPanel from './components/WalletPanel'
import GridControls from './components/GridControls'
import LogPanel from './components/LogPanel'
import TokenSelector from './components/TokenSelector'
import { loadWallet } from './utils/wallet'

function App() {
  const [wallet, setWallet] = useState(null)
  const [selectedToken, setSelectedToken] = useState('PUSD')
  const [logs, setLogs] = useState([])

  const addLog = (msg, isError = false) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, msg, isError }])
    console.log(msg)
  }

  useEffect(() => {
    const init = async () => {
      try {
        await loadWallet(setWallet, addLog)
        addLog('⚗️ Cauldron Grid Bot - 12-Word BIP39 Version')
        addLog('✅ Compatible with Cashonize.com and standard BCH wallets')
      } catch (error) {
        addLog(`Initialization error: ${error.message}`, true)
      }
    }
    init()
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center border-b border-green-900/30 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-500 bg-clip-text text-transparent">
              ⚗️ Cauldron Grid Bot
            </h1>
            <div className="text-sm text-gray-400 mt-1">
              BCH Mainnet • CashTokens • 12-Word BIP39 Wallet (Cashonize Compatible)
            </div>
          </div>
          <div className="text-xs bg-black/30 px-3 py-2 rounded-lg text-amber-300">
            🛡️ Standard 12-Word Seed | AES-GCM Encrypted
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-5">
            <WalletPanel wallet={wallet} setWallet={setWallet} addLog={addLog} />
            <TokenSelector selectedToken={selectedToken} setSelectedToken={setSelectedToken} addLog={addLog} />
          </div>
          <GridControls wallet={wallet} selectedToken={selectedToken} addLog={addLog} />
          <LogPanel logs={logs} setLogs={setLogs} addLog={addLog} />
        </div>
      </div>
    </div>
  )
}

export default App