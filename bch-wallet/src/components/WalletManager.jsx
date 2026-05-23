import { useState, useEffect } from 'react'
import { Wallet, ElectrumNetworkProvider } from 'mainnet-js'
import * as bip39 from 'bip39'

const provider = new ElectrumNetworkProvider()

const WalletManager = ({ onWalletLoaded, onTokensLoaded }) => {
  const [seed, setSeed] = useState('')
  const [importSeed, setImportSeed] = useState('')
  const [walletInfo, setWalletInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate new wallet with 12-word seed
  const generateWallet = async () => {
    setLoading(true)
    setError('')
    try {
      // Generate random 12-word mnemonic
      const mnemonic = bip39.generateMnemonic(128)
      setSeed(mnemonic)
      
      // Create wallet from seed
      const wallet = await Wallet.fromSeed(mnemonic, provider)
      const address = await wallet.getDepositAddress()
      const balances = await wallet.getBalances()
      
      const walletData = {
        wallet,
        address,
        balance: balances.bch / 1e8, // convert satoshis to BCH
        seed: mnemonic
      }
      
      setWalletInfo(walletData)
      onWalletLoaded(wallet)
      
      // Fetch token assets
      await fetchTokens(wallet)
    } catch (err) {
      setError('Failed to generate wallet: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Import wallet from 12-word seed phrase
  const importWallet = async () => {
    if (!importSeed.trim()) {
      setError('Please enter a 12-word seed phrase')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(importSeed)) {
        throw new Error('Invalid seed phrase')
      }
      
      const wallet = await Wallet.fromSeed(importSeed, provider)
      const address = await wallet.getDepositAddress()
      const balances = await wallet.getBalances()
      
      const walletData = {
        wallet,
        address,
        balance: balances.bch / 1e8,
        seed: importSeed
      }
      
      setWalletInfo(walletData)
      setSeed(importSeed)
      onWalletLoaded(wallet)
      await fetchTokens(wallet)
    } catch (err) {
      setError('Failed to import wallet: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all tokens (Cashtokens and SLP tokens)
  const fetchTokens = async (wallet) => {
    try {
      const address = await wallet.getDepositAddress()
      
      // Get all UTXOs
      const utxos = await provider.getUtxos(address)
      
      // Filter token UTXOs and fetch token info
      const tokenPromises = utxos
        .filter(utxo => utxo.token && utxo.token !== '0x')
        .map(async (utxo) => {
          let tokenInfo = { tokenId: utxo.token, amount: utxo.tokenAmount / 1e8 }
          
          // Try to get token details if available
          try {
            const info = await provider.getTokenInfo(utxo.token)
            tokenInfo = {
              ...tokenInfo,
              name: info.name || 'Unknown Token',
              symbol: info.ticker || info.symbol || 'N/A',
              decimals: info.decimals || 8
            }
          } catch {
            tokenInfo.name = 'Token'
            tokenInfo.symbol = 'Token'
            tokenInfo.decimals = 8
          }
          
          return tokenInfo
        })
      
      const tokens = await Promise.all(tokenPromises)
      
      // Aggregate token amounts
      const tokenMap = new Map()
      tokens.forEach(token => {
        if (tokenMap.has(token.tokenId)) {
          tokenMap.get(token.tokenId).amount += token.amount
        } else {
          tokenMap.set(token.tokenId, token)
        }
      })
      
      const aggregatedTokens = Array.from(tokenMap.values())
      onTokensLoaded(aggregatedTokens)
    } catch (err) {
      console.error('Error fetching tokens:', err)
      onTokensLoaded([])
    }
  }

  return (
    <div className="wallet-manager">
      <div className="section">
        <h2>Generate New Wallet</h2>
        <button onClick={generateWallet} disabled={loading}>
          {loading ? 'Generating...' : 'Generate 12-Word Seed Wallet'}
        </button>
        {seed && (
          <div className="seed-box">
            <strong>Your 12-Word Seed Phrase (Save this securely!):</strong>
            <p className="seed">{seed}</p>
          </div>
        )}
      </div>

      <div className="divider">OR</div>

      <div className="section">
        <h2>Import Existing Wallet</h2>
        <textarea
          placeholder="Enter your 12-word seed phrase here..."
          value={importSeed}
          onChange={(e) => setImportSeed(e.target.value)}
          rows="3"
        />
        <button onClick={importWallet} disabled={loading}>
          {loading ? 'Importing...' : 'Import Wallet'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {walletInfo && (
        <div className="wallet-info">
          <h3>Wallet Details</h3>
          <p><strong>BCH Address:</strong> <span className="address">{walletInfo.address}</span></p>
          <p><strong>Balance:</strong> {walletInfo.balance} BCH</p>
          <p><strong>Seed Phrase (stored temporarily):</strong> {walletInfo.seed}</p>
        </div>
      )}
    </div>
  )
}

export default WalletManager