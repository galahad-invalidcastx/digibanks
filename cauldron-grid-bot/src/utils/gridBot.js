// Grid bot utility functions

export function calculateGridLevels(currentPrice, levels, rangePct) {
  const lower = currentPrice * (1 - rangePct / 100)
  const upper = currentPrice * (1 + rangePct / 100)
  const step = (upper - lower) / (levels - 1)
  
  const buyPrices = []
  const sellPrices = []
  
  for (let i = 0; i < levels; i++) {
    const price = lower + i * step
    buyPrices.push(price)
    sellPrices.push(price * 1.002)
  }
  
  return { buyPrices, sellPrices, lower, upper }
}

export function calculateOrderSize(budgetBCH, levels) {
  return budgetBCH / levels
}

export function calculatePositionPnL(currentQty, avgEntryPrice, currentPrice) {
  const currentValue = currentQty * currentPrice
  const costBasis = currentQty * avgEntryPrice
  return currentValue - costBasis
}

export function calculateReturnPercent(avgEntryPrice, currentPrice) {
  if (avgEntryPrice === 0) return 0
  return ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100
}

export function shouldTriggerStopLoss(returnPercent, stopLossPercent) {
  return returnPercent <= -stopLossPercent
}

export function shouldTriggerTakeProfit(returnPercent, takeProfitPercent) {
  return returnPercent >= takeProfitPercent
}

export function simulatePriceMovement(currentPrice, volatility = 0.025) {
  const change = (Math.random() - 0.5) * volatility
  return Math.max(currentPrice * (1 + change), 0.00001)
}

export function canBuy(currentPrice, buyPrice, totalInvested, budgetBCH) {
  return currentPrice <= buyPrice && totalInvested < budgetBCH
}

export function canSell(currentPrice, sellPrice, currentQty) {
  return currentPrice >= sellPrice && currentQty > 0
}

export function calculateBuyQuantity(availableFunds, orderSizeBCH, currentPrice) {
  const maxQtyByFunds = availableFunds / currentPrice
  const maxQtyByOrder = orderSizeBCH / currentPrice
  return Math.min(maxQtyByOrder, maxQtyByFunds)
}

export function calculateSellQuantity(currentQty, orderSizeBCH, currentPrice) {
  const maxQtyByOrder = orderSizeBCH / currentPrice
  return Math.min(currentQty, maxQtyByOrder)
}