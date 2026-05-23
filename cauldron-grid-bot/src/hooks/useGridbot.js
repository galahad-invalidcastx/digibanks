import { useState, useRef, useEffect } from 'react'

export function useGridBot(wallet, addLog) {
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
  const [pnl, setPnl] = useState(0)
  
  const botIntervalRef = useRef(null)
  const gridLevelsRef = useRef(5)
  const rangePctRef = useRef(20)
  const stopLossRef = useRef(15)
  const takeProfitRef = useRef(30)
  const budgetUsdRef = useRef(20)
  const bchUsdRef = useRef(380)

  const initGrid = () => {
    const levels = gridLevelsRef.current
    const rangePct = rangePctRef.current
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

  const precheck = async () => {
    if (!wallet) {
      addLog("❌ Wallet required", true)
      return false
    }
    const usd = budgetUsdRef.current
    const bchUsd = bchUsdRef.current
    if (isNaN(usd) || isNaN(bchUsd) || bchUsd <= 0) {
      addLog("Invalid fiat values", true)
      return false
    }
    const budget = usd / bchUsd
    setBudgetBCH(budget)
    addLog(`💰 Budget: ${budget.toFixed(6)} BCH`)
    return true
  }

  const updatePnl = () => {
    const equity = currentTokenQty * tokenPriceBCH
    const newPnl = equity - totalBCHInvested
    setPnl(newPnl)
  }

  const gridTick = async () => {
    if (!botActive || botPaused) return
    
    const volatility = 0.025
    const newPrice = Math.max(tokenPriceBCH * (1 + (Math.random() - 0.5) * volatility), 0.00001)
    setTokenPriceBCH(newPrice)
    
    const stopLossPct = stopLossRef.current
    const takeProfitPct = takeProfitRef.current
    
    if (currentTokenQty > 0 && totalBCHInvested > 0) {
      const avgEntry = totalBCHInvested / currentTokenQty
      const currentReturn = (newPrice - avgEntry) / avgEntry * 100
      
      if (!stopLossTrigger && currentReturn <= -stopLossPct) {
        setStopLossTrigger(true)
        addLog(`🛑 STOP LOSS @ ${currentReturn.toFixed(2)}%`, false)
        setCurrentTokenQty(0)
        setTotalBCHInvested(0)
        updatePnl()
        return
      }
      if (!takeProfitTrigger && currentReturn >= takeProfitPct) {
        setTakeProfitTrigger(true)
        addLog(`🎯 TAKE PROFIT @ ${currentReturn.toFixed(2)}%`, false)
        setCurrentTokenQty(0)
        setTotalBCHInvested(0)
        updatePnl()
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
          updatePnl()
          break
        }
      }
    }
    
    if (!executed) {
      for (let i = 0; i < gridSellPrices.length && !executed; i++) {
        if (newPrice >= gridSellPrices[i] && currentTokenQty > 0) {
          const sellQty = Math.min(currentTokenQty, orderSizeBCH / newPrice)
          if (sellQty > 1e-8) {
            setCurrentTokenQty(prev => {
              const newQty = prev - sellQty
              if (newQty <= 0) {
                setTotalBCHInvested(0)
                return 0
              }
              return newQty
            })
            addLog(`🔴 SELL ${sellQty.toFixed(6)} @ ${newPrice.toFixed(8)}`, false)
            executed = true
            updatePnl()
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
    if (botIntervalRef.current) {
      clearInterval(botIntervalRef.current)
      botIntervalRef.current = null
    }
    setBotActive(false)
    setBotPaused(false)
    addLog("⏹ Bot stopped")
  }

  const startBot = async () => {
    if (!wallet) {
      addLog("❌ Wallet required", true)
      return false
    }
    const ok = await precheck()
    if (!ok) return false
    
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
    return true
  }

  const pauseBot = () => {
    if (!botActive) return
    setBotPaused(!botPaused)
    addLog(botPaused ? "▶ Resumed" : "⏸ Paused")
  }

  useEffect(() => {
    updatePnl()
  }, [currentTokenQty, tokenPriceBCH, totalBCHInvested])

  useEffect(() => {
    return () => {
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current)
      }
    }
  }, [])

  return {
    // State
    budgetBCH,
    tokenPriceBCH,
    currentTokenQty,
    totalBCHInvested,
    botActive,
    botPaused,
    pnl,
    
    // Refs for settings
    gridLevelsRef,
    rangePctRef,
    stopLossRef,
    takeProfitRef,
    budgetUsdRef,
    bchUsdRef,
    
    // Methods
    precheck,
    startBot,
    stopBot,
    pauseBot,
    initGrid
  }
}