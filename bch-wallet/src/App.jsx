import { useState } from 'react'
import WalletManager from './components/WalletManager'
import TokenList from './components/TokenList'
import './App.css'

function App() {
  const [wallet, setWallet] = useState(null)
  const [tokens, setTokens] = useState([])
  const [tokensLoading, setTokensLoading] = useState(false)

  const handleWalletLoaded = (walletInstance) => {
    setWallet(walletInstance)
  }

  const handleTokensLoaded = (tokenList) => {
    setTokens(tokenList)
    setTokensLoading(false)
  }

  return (
    <div className="app">
      <header>
        <h1>BCH Cashtoken Wallet</h1>
        <p>Supports BCH and Cashtokens (CAT tokens)</p>
      </header>

      <main>
        <WalletManager 
          onWalletLoaded={handleWalletLoaded}
          onTokensLoaded={handleTokensLoaded}
        />

        {wallet && (
          <TokenList tokens={tokens} loading={tokensLoading} />
        )}
      </main>

      <footer>
        <p>Secure wallet for Bitcoin Cash with Cashtoken support</p>
      </footer>
    </div>
  )
}

export default App