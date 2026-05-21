import React, { useState } from 'react';
import { generateNewKey, loginWithPrivateKey } from '../utils/nostr';

function Login({ onLogin }) {
  const [loginMethod, setLoginMethod] = useState('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const newUser = await generateNewKey();
      if (newUser && newUser.privateKey) {
        alert(`🔑 YOUR PRIVATE KEY\n\nnsec: ${newUser.nsec}\n\nSave this key!`);
        onLogin(newUser);
      } else {
        setError('Failed to generate key');
      }
    } catch (err) {
      setError('Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const user = await loginWithPrivateKey(privateKey.trim());
      if (user && user.publicKey) {
        onLogin(user);
      } else {
        setError('Invalid private key');
      }
    } catch (err) {
      setError('Error importing key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🍃</div>
          <h1 className="text-5xl font-bold mb-2 text-[#00BA7C]">Leaf</h1>
          <p className="text-[#71767B]">Nostr on Bitcoin Cash</p>
        </div>

        <div className="bg-white/5 rounded-2xl p-8">
          <div className="flex gap-2 mb-6 border-b border-[#2F3336]">
            <button
              className={`pb-3 px-4 font-semibold ${
                loginMethod === 'generate' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B]'
              }`}
              onClick={() => setLoginMethod('generate')}
            >
              Create Account
            </button>
            <button
              className={`pb-3 px-4 font-semibold ${
                loginMethod === 'import' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B]'
              }`}
              onClick={() => setLoginMethod('import')}
            >
              Import Key
            </button>
          </div>

          {loginMethod === 'generate' ? (
            <div className="space-y-4">
              <p className="text-[#71767B] text-center text-sm">
                Create a new Nostr identity.
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#00BA7C] disabled:opacity-50 text-white font-bold py-3 rounded-full"
              >
                {loading ? 'Generating...' : '🍃 Generate New Account'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter nsec1... or hex private key"
                  className="w-full bg-black border border-[#2F3336] rounded-lg p-3 text-white font-mono text-sm"
                  rows="3"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-[#71767B]"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleImport}
                disabled={loading || !privateKey.trim()}
                className="w-full bg-[#00BA7C] disabled:opacity-50 text-white font-bold py-3 rounded-full"
              >
                {loading ? 'Importing...' : '🔑 Import Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;