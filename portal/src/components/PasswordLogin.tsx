import React, { useState } from 'react';

interface Props {
  onAuthenticated: (isAdmin: boolean, username: string) => void;
}

export function PasswordLogin({ onAuthenticated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate username
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    try {
      const normalPassword = import.meta.env.VITE_PORTAL_PASSWORD || '1234';
      const adminPassword = import.meta.env.VITE_PORTAL_ADMIN_PASSWORD;

      if (password === adminPassword && adminPassword) {
        // Admin login
        console.log('🔑 Admin authentication successful');
        onAuthenticated(true, username.trim());
      } else if (password === normalPassword) {
        // Regular user login
        console.log('🔑 User authentication successful');
        onAuthenticated(false, username.trim());
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🖼️</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            RoboDickV2 Portal
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter your credentials to access the image gallery
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="Enter your username"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Portal'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center space-y-1">
            <p>💡 Use regular password for viewing</p>
            <p>🔐 Use admin password for full access</p>
            <p>👤 Username will be used for uploads</p>
          </div>
        </div>
      </div>
    </div>
  );
} 