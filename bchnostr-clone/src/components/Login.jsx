import React, { useState } from 'react';
import { generateNewKey, loginWithPrivateKey } from '../utils/nostr';

function Login({ onLogin }) {
  const [loginMethod, setLoginMethod] = useState('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    const newUser = generateNewKey();
    onLogin(newUser);
  };

  const handleImport = () => {
    const user = loginWithPrivateKey(privateKey);
    if (user) {
      onLogin(user);
      setError('');
    } else {
      setError('Invalid private key');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-pulse">🍃</div>
          <h1 className="text-5xl font-bold mb-2 text-[#00BA7C]">Leaf</h1>
          <p className="text-[#71767B]">Nostr on Bitcoin Cash</p>
          <p className="text-[#71767B] text-sm mt-2">Freedom to Connect. Power to Reward.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 rounded-2xl p-8 backdrop-blur">
          <div className="flex gap-2 mb-6 border-b border-[#2F3336]">
            <button
              className={`pb-3 px-4 font-semibold transition ${
                loginMethod === 'generate' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B] hover:text-white'
              }`}
              onClick={() => setLoginMethod('generate')}
            >
              Create Account
            </button>
            <button
              className={`pb-3 px-4 font-semibold transition ${
                loginMethod === 'import' 
                  ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                  : 'text-[#71767B] hover:text-white'
              }`}
              onClick={() => setLoginMethod('import')}
            >
              Import Key
            </button>
          </div>

          {loginMethod === 'generate' ? (
            <div className="space-y-4">
              <p className="text-[#71767B] text-center">
                Create a new Nostr identity. Your private key will be stored locally.
              </p>
              <button
                onClick={handleGenerate}
                className="w-full bg-[#00BA7C] hover:bg-[#00a06a] text-white font-bold py-3 rounded-full transition"
              >
                Generate New Account
              </button>
              <p className="text-xs text-[#71767B] text-center">
                🍃 Save your private key! It cannot be recovered if lost.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter nsec or hex private key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-black border border-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button
                onClick={handleImport}
                className="w-full bg-[#00BA7C] hover:bg-[#00a06a] text-white font-bold py-3 rounded-full transition"
              >
                Import Account
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[#71767B] text-xs mt-8">
          🍃 Leaf — Your gateway to the decentralized social web
        </p>
      </div>
    </div>
  );
}

export default Login;