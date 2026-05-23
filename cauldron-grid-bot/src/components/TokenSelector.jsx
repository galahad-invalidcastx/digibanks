import React from 'react'

const topTokens = ["PUSD", "EMBER", "FLEX", "FURU", "MIST", "BCHBULL"]

export default function TokenSelector({ selectedToken, setSelectedToken, addLog }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">📦 CashToken Selection</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {topTokens.map(token => (
          <div
            key={token}
            onClick={() => {
              setSelectedToken(token)
              addLog(`Selected token: ${token}`)
            }}
            className={`token-pill text-xs ${selectedToken === token ? 'bg-green-800' : ''}`}
          >
            {token}
          </div>
        ))}
      </div>
      <input
        className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm font-mono"
        placeholder="Token symbol"
        value={selectedToken}
        onChange={(e) => setSelectedToken(e.target.value)}
      />
      <div className="text-xs mt-2 text-gray-400">
        Selected: <span className="text-green-300">{selectedToken}</span>
      </div>
    </div>
  )
}