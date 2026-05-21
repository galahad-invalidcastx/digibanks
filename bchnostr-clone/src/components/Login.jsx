import React, { useState } from 'react';
import { generateNewKey, loginWithPrivateKey } from '../utils/nostr';
import DebugPanel from './DebugPanel';

function Login({ onLogin }) {
  const [loginMethod, setLoginMethod] = useState('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, { message, type, timestamp }]);
    setDebugLogs(prev => prev.slice(-50));
  };

const handleGenerate = async () => {
  setLoading(true);
  setError('');
  addDebugLog('Generating new account...', 'info');
  
  try {
    const newUser = await generateNewKey();
    if (newUser && newUser.privateKey) {
      addDebugLog(`✅ Account generated successfully!`, 'success');
      addDebugLog(`Public key: ${newUser.publicKey.substring(0, 16)}...`, 'info');
      
      alert(`🔑 YOUR PRIVATE KEY - SAVE THIS!\n\n${newUser.nsec}\n\n⚠️ This key cannot be recovered if lost!\n\nClick OK to continue.`);
      onLogin(newUser);
    } else {
      addDebugLog('❌ Failed to generate key', 'error');
      setError('Failed to generate key');
    }
  } catch (err) {
    addDebugLog(`❌ Generation error: ${err.message}`, 'error');
    setError('Failed to generate key. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleImport = async () => {
  if (!privateKey.trim()) {
    setError('Please enter your private key');
    addDebugLog('❌ Import failed: No key entered', 'error');
    return;
  }
  
  setLoading(true);
  setError('');
  const trimmedKey = privateKey.trim();
  
  addDebugLog(`🔑 Attempting to import key...`, 'info');
  addDebugLog(`Key length: ${trimmedKey.length} characters`, 'info');
  addDebugLog(`Key prefix: ${trimmedKey.substring(0, 8)}...`, 'info');
  addDebugLog(`Full key (first 20 chars): ${trimmedKey.substring(0, 20)}...`, 'info');
  
  try {
    // Call the login function and capture any errors
    let user;
    let errorMessage = null;
    
    try {
      user = await loginWithPrivateKey(trimmedKey);
    } catch (decodeErr) {
      errorMessage = decodeErr.message;
      addDebugLog(`❌ Decode exception: ${errorMessage}`, 'error');
    }
    
    if (user && user.publicKey && user.publicKey !== 'error') {
      addDebugLog(`✅ Login successful!`, 'success');
      addDebugLog(`Public key: ${user.publicKey.substring(0, 16)}...`, 'success');
      onLogin(user);
    } else {
      addDebugLog(`❌ Failed to decode key`, 'error');
      if (errorMessage) {
        addDebugLog(`Error details: ${errorMessage}`, 'error');
      }
      addDebugLog(`💡 This nsec key works on bchnostr.com but not here`, 'info');
      addDebugLog(`💡 The key length is ${trimmedKey.length} chars`, 'info');
      setError('Failed to decode key. The format might be different from what nostr-tools expects.');
    }
  } catch (err) {
    addDebugLog(`❌ Import error: ${err.message}`, 'error');
    setError('Error importing key: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-pulse">🍃</div>
          <h1 className="text-5xl font-bold mb-2 text-[#00BA7C]">Leaf</h1>
          <p className="text-[#71767B]">Nostr on Bitcoin Cash</p>
          <p className="text-[#71767B] text-sm mt-2">Freedom to Connect. Power to Reward.</p>
        </div>

        <div className="bg-white/5 rounded-2xl p-8 backdrop-blur">
          <div className="flex gap-2 mb-6 border-b border-[#2F3336]">
            <button
              className={`pb-3 px-4 font-semibold transition ${
                loginMethod === 'generate' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B] hover:text-white'
              }`}
              onClick={() => {
                setLoginMethod('generate');
                setError('');
                setPrivateKey('');
                addDebugLog('Switched to Create Account mode', 'info');
              }}
            >
              Create Account
            </button>
            <button
              className={`pb-3 px-4 font-semibold transition ${
                loginMethod === 'import' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B] hover:text-white'
              }`}
              onClick={() => {
                setLoginMethod('import');
                setError('');
                addDebugLog('Switched to Import Key mode', 'info');
              }}
            >
              Import Key
            </button>
          </div>

          {loginMethod === 'generate' ? (
            <div className="space-y-4">
              <p className="text-[#71767B] text-center text-sm">
                Create a new Nostr identity. Your private key will be shown once.
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#00BA7C] hover:bg-[#00a06a] disabled:opacity-50 text-white font-bold py-3 rounded-full transition"
              >
                {loading ? 'Generating...' : '🍃 Generate New Account'}
              </button>
              <p className="text-xs text-[#71767B] text-center">
                ⚠️ You will be shown your private key. Save it immediately!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter nsec1... or hex private key"
                  className="w-full bg-black border border-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition font-mono text-sm"
                  rows="3"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-[#71767B] text-sm"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </div>
              )}
              
              <button
                onClick={handleImport}
                disabled={loading || !privateKey.trim()}
                className="w-full bg-[#00BA7C] hover:bg-[#00a06a] disabled:opacity-50 text-white font-bold py-3 rounded-full transition"
              >
                {loading ? 'Importing...' : '🔑 Import Account'}
              </button>
              
              <div className="text-xs text-[#71767B] space-y-1">
                <p>📝 Enter your key in one of these formats:</p>
                <p className="font-mono">• nsec1xxxxxxxx... (starts with nsec1)</p>
                <p className="font-mono">• 64-character hex string</p>
                <p className="text-[#00BA7C] mt-2">💡 Tip: The nsec key should be 63+ characters long</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[#71767B] text-xs mt-8">
          🍃 Leaf — Your gateway to the decentralized social web
        </p>
      </div>

      <DebugPanel logs={debugLogs} />
    </div>
  );
}

export default Login;