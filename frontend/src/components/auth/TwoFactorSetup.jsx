import React, { useState, useEffect } from 'react';
import { generate2FA, verify2FA, disable2FA, get2FAStatus } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const TwoFactorSetup = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await get2FAStatus();
      setEnabled(response.data.enabled);
      setVerified(response.data.verified);
    } catch (error) {
      setError('Failed to get 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await generate2FA();
      setQrCode(response.data.qrCode);
      setSecret(response.data.tempSecret);
    } catch (error) {
      setError('Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await verify2FA(token);
      setSuccess('2FA enabled successfully');
      setEnabled(true);
      setVerified(true);
      setQrCode('');
      setSecret('');
      setToken('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await disable2FA(token);
      setSuccess('2FA disabled successfully');
      setEnabled(false);
      setVerified(false);
      setToken('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">
          {success}
        </div>
      )}

      {!enabled && (
        <div>
          {!qrCode ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? <LoadingSpinner fullScreen={false} /> : 'Setup 2FA'}
            </button>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <img src={qrCode} alt="QR Code" className="mx-auto" />
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2">1. Scan the QR code with your authenticator app</p>
                <p className="mb-2">2. Or manually enter this secret:</p>
                <code className="block p-2 bg-gray-100 rounded">{secret}</code>
                <p className="mt-2">3. Enter the code from your authenticator app to verify:</p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {loading ? <LoadingSpinner fullScreen={false} /> : 'Verify and Enable'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {enabled && (
        <div className="space-y-6">
          <div className="p-4 bg-green-100 text-green-700 rounded-md">
            Two-factor authentication is enabled
          </div>
          <form onSubmit={handleDisable} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter 6-digit code to disable"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {loading ? <LoadingSpinner fullScreen={false} /> : 'Disable 2FA'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
