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
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">BCHNostr Clone</h1>
        <p className="text-gray-400 mb-8">
          A modern Nostr client with X + Threads UI
        </p>

        <div className="space-y-6">
          <div className="flex gap-2 border-b border-gray-700">
            <button
              className={`pb-2 px-4 ${loginMethod === 'generate' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
              onClick={() => setLoginMethod('generate')}
            >
              Generate New
            </button>
            <button
              className={`pb-2 px-4 ${loginMethod === 'import' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
              onClick={() => setLoginMethod('import')}
            >
              Import Key
            </button>
          </div>

          {loginMethod === 'generate' ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Create a new Nostr identity. Your private key will be saved locally.
              </p>
              <button
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Generate New Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your private key (nsec or hex)"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleImport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Import Account
              </button>
            </div>
          )}

          <div className="pt-4 text-center text-gray-500 text-sm">
            <p>Your keys never leave your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;