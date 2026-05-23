import React, { useState, useRef, useEffect } from 'react'
import { shortAddr } from '../utils/wallet'

export default function GridControls({ wallet, selectedToken, addLog }) {
  const [budgetBCH, setBudgetBCH] = useState(0)
  const [tokenPriceBCH, setTokenPriceBCH] = useState(0.0025)
  const [currentTokenQty, setCurrentTokenQty] = useState(0)
  const [totalBCHInvested, setTotalBCHInvested] = useState(0)
  const [botActive, setBotActive] = useState(false)
  const [botPaused, setBotPaused] = useState(false)
  const [stopLossTrigger, setStopLossTrigger] = useState(false)
  const [takeProfitTrigger, setTakeProfitTrigger] = useState(false)
  const [gridBuyPrices, setGridBuyPrices] = useState([])
  const [gridSellPrices, setGridSellPrices] = useState([])
  
  const botIntervalRef = useRef(null)
  
  const budgetUsdRef = useRef()
  const bchUsdRef = useRef()
  const gridLevelsRef = useRef()
  const rangePctRef = useRef()
  const stopLossRef = useRef()
  const takeProfitRef = useRef()

  const initGrid = () => {
    const levels = parseInt(gridLevelsRef.current?.value) || 5
    const rangePct = parseFloat(rangePctRef.current?.value) || 20
    const currentPrice = tokenPriceBCH
    const lower = currentPrice * (1 - rangePct / 100)
    const upper = currentPrice * (1 + rangePct / 100)
    const step = (upper - lower) / (levels - 1)
    
    const buys = []
    const sells = []
    for (let i = 0; i < levels; i++) {
      const price = lower + i * step
      buys.push(price)
      sells.push(price * 1.002)
    }
    setGridBuyPrices(buys)
    setGridSellPrices(sells)
    addLog(`📐 Grid rebuilt: ${levels} levels`)
  }

  const updatePnlUI = () => {
    // UI update handled by state
  }

  const precheck = async () => {
    if (!wallet) {
      addLog("❌ Wallet required", true)
      return false
    }
    const usd = parseFloat(budgetUsdRef.current?.value)
    const bchUsd = parseFloat(bchUsdRef.current?.value)
    if (isNaN(usd) || isNaN(bchUsd) || bchUsd <= 0) {
      addLog("Invalid fiat values", true)
      return false
    }
    const budget = usd / bchUsd
    setBudgetBCH(budget)
    addLog(`💰 Budget: ${budget.toFixed(6)} BCH`)
    return true
  }

  const gridTick = async () => {
    if (!botActive || botPaused) return
    
    const volatility = 0.025
    const newPrice = Math.max(tokenPriceBCH * (1 + (Math.random() - 0.5) * volatility), 0.00001)
    setTokenPriceBCH(newPrice)
    
    const stopLossPct = parseFloat(stopLossRef.current?.value) || 15
    const takeProfitPct = parseFloat(takeProfitRef.current?.value) || 30
    
    if (currentTokenQty > 0 && totalBCHInvested > 0) {
      const avgEntry = totalBCHInvested / currentTokenQty
      const currentReturn = (newPrice - avgEntry) / avgEntry * 100
      
      if (!stopLossTrigger && currentReturn <= -stopLossPct) {
        setStopLossTrigger(true)
        addLog(`🛑 STOP LOSS @ ${currentReturn.toFixed(2)}%`, false)
        setCurrentTokenQty(0)
        setTotalBCHInvested(0)
        return
      }
      if (!takeProfitTrigger && currentReturn >= takeProfitPct) {
        setTakeProfitTrigger(true)
        addLog(`🎯 TAKE PROFIT @ ${currentReturn.toFixed(2)}%`, false)
        setCurrentTokenQty(0)
        setTotalBCHInvested(0)
        return
      }
    }
    
    if (gridBuyPrices.length === 0) initGrid()
    const orderSizeBCH = budgetBCH / (gridBuyPrices.length || 1)
    let executed = false
    
    for (let i = 0; i < gridBuyPrices.length && !executed; i++) {
      if (newPrice <= gridBuyPrices[i] && totalBCHInvested < budgetBCH) {
        const available = budgetBCH - totalBCHInvested
        const buyQty = Math.min(orderSizeBCH / newPrice, available / newPrice)
        if (buyQty > 1e-8) {
          setCurrentTokenQty(prev => prev + buyQty)
          setTotalBCHInvested(prev => prev + buyQty * newPrice)
          addLog(`🟢 BUY ${buyQty.toFixed(6)} @ ${newPrice.toFixed(8)}`, false)
          executed = true
          break
        }
      }
    }
    
    if (!executed) {
      for (let i = 0; i < gridSellPrices.length && !executed; i++) {
        if (newPrice >= gridSellPrices[i] && currentTokenQty > 0) {
          const sellQty = Math.min(currentTokenQty, orderSizeBCH / newPrice)
          if (sellQty > 1e-8) {
            setCurrentTokenQty(prev => prev - sellQty)
            if (currentTokenQty - sellQty <= 0) {
              setCurrentTokenQty(0)
              setTotalBCHInvested(0)
            }
            addLog(`🔴 SELL ${sellQty.toFixed(6)} @ ${newPrice.toFixed(8)}`, false)
            executed = true
            break
          }
        }
      }
    }
    
    if (currentTokenQty === 0) {
      setStopLossTrigger(false)
      setTakeProfitTrigger(false)
    }
  }

  const stopBot = () => {
    if (botIntervalRef.current) clearInterval(botIntervalRef.current)
    setBotActive(false)
    setBotPaused(false)
    addLog("⏹ Bot stopped")
  }

  const startBot = async () => {
    if (!wallet) {
      addLog("❌ Wallet required", true)
      return
    }
    const ok = await precheck()
    if (!ok) return
    
    if (botActive) stopBot()
    
    setCurrentTokenQty(0)
    setTotalBCHInvested(0)
    setStopLossTrigger(false)
    setTakeProfitTrigger(false)
    setTokenPriceBCH(0.0025)
    initGrid()
    
    setBotActive(true)
    setBotPaused(false)
    
    if (botIntervalRef.current) clearInterval(botIntervalRef.current)
    botIntervalRef.current = setInterval(gridTick, 4000)
    addLog("🤖 Grid Bot STARTED")
  }

  const pauseBot = () => {
    if (!botActive) return
    setBotPaused(!botPaused)
    addLog(botPaused ? "▶ Resumed" : "⏸ Paused")
  }

  useEffect(() => {
    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current)
    }
  }, [])

  const equity = currentTokenQty * tokenPriceBCH
  const pnl = equity - totalBCHInvested

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-xl font-semibold">⚙️ Grid Settings</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs text-gray-400">Budget USD</label>
            <input ref={budgetUsdRef} id="budgetUsd" type="number" defaultValue="20" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
          <div>
            <label className="text-xs text-gray-400">BCH/USD</label>
            <input ref={bchUsdRef} id="bchUsd" type="number" defaultValue="380" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Grid Levels</label>
            <input ref={gridLevelsRef} id="gridLevels" type="number" defaultValue="5" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Range %</label>
            <input ref={rangePctRef} id="rangePct" type="number" defaultValue="20" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Stop Loss %</label>
            <input ref={stopLossRef} id="stopLoss" type="number" defaultValue="15" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Take Profit %</label>
            <input ref={takeProfitRef} id="takeProfit" type="number" defaultValue="30" className="w-full bg-black/50 rounded-lg p-2 border border-gray-700" />
          </div>
        </div>
        <button onClick={precheck} className="w-full mt-4 bg-blue-900 hover:bg-blue-800 py-2 rounded-lg">
          💡 Balance Check
        </button>
        <div id="precheckResult" className="mt-3 text-xs bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto">
          {wallet && `📍 ${shortAddr(wallet.cashAddress)}`}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap gap-3">
          <button onClick={startBot} className="btn bg-green-800 hover:bg-green-700 px-5 py-2 rounded-lg font-bold">
            ▶ START
          </button>
          <button onClick={pauseBot} className="btn bg-yellow-700 hover:bg-yellow-600 px-5 py-2 rounded-lg">
            ⏸ Pause
          </button>
          <button onClick={stopBot} className="btn bg-red-800 hover:bg-red-700 px-5 py-2 rounded-lg">
            ⏹ Stop
          </button>
        </div>
        <div className="bg-black/35 rounded-xl p-4 mt-4 text-sm space-y-2">
          <div className="flex justify-between"><span>Bot State</span><span className="font-bold text-green-300">{botActive ? (botPaused ? "PAUSED" : "RUNNING") : "IDLE"}</span></div>
          <div className="flex justify-between"><span>Token Price (BCH)</span><span className="font-mono">{tokenPriceBCH.toFixed(8)}</span></div>
          <div className="flex justify-between"><span>Position Qty</span><span className="font-mono">{currentTokenQty.toFixed(8)}</span></div>
          <div className="flex justify-between"><span>P&L (BCH)</span><span className="font-mono">{pnl.toFixed(8)}</span></div>
          <div className="flex justify-between"><span>Invested BCH</span><span className="font-mono">{totalBCHInvested.toFixed(8)}</span></div>
        </div>
        <div className="mt-3 text-xs"><span className="status-dot"></span> Grid simulation • Standard BIP39 wallet</div>
      </div>
    </div>
  )
}