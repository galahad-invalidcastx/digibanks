const TokenList = ({ tokens, loading }) => {
  if (loading) {
    return <div className="loading">Loading tokens...</div>
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="token-list">
        <h3>Token Assets</h3>
        <p className="no-tokens">No token assets found in this wallet.</p>
      </div>
    )
  }

  return (
    <div className="token-list">
      <h3>Token Assets ({tokens.length})</h3>
      <table className="token-table">
        <thead>
          <tr>
            <th>Token Name</th>
            <th>Symbol</th>
            <th>Balance</th>
            <th>Token ID (first 8 chars)</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, idx) => (
            <tr key={idx}>
              <td>{token.name}</td>
              <td>{token.symbol}</td>
              <td>{token.amount.toFixed(token.decimals || 8)}</td>
              <td className="token-id">{token.tokenId.slice(0, 8)}...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TokenList