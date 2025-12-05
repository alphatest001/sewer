import { CheckCircle, X, Copy } from 'lucide-react';
import { useState } from 'react';

interface UserCredentialsModalProps {
  isOpen: boolean;
  userId: string;
  password: string;
  onClose: () => void;
}

export default function UserCredentialsModal({
  isOpen,
  userId,
  password,
  onClose,
}: UserCredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<'userId' | 'password' | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: 'userId' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            User Account Created Successfully!
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            Please save these credentials. The password will only be shown once.
          </p>

          {/* Credentials */}
          <div className="space-y-4 mb-6">
            {/* User ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                User ID
              </label>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {userId}
                </code>
                <button
                  onClick={() => handleCopy(userId, 'userId')}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="Copy User ID"
                >
                  {copiedField === 'userId' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Password
              </label>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                  {password}
                </code>
                <button
                  onClick={() => handleCopy(password, 'password')}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> Make sure to save these credentials securely. The password cannot be recovered later.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            I've Saved the Credentials
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
