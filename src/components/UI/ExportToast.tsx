import { useEffect } from 'react';

export interface ExportToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  fileSize?: number;
}

interface ExportToastProps {
  message: ExportToastMessage | null;
  onClose: () => void;
}

const ExportToast = ({ message, onClose }: ExportToastProps) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-900/90',
      border: 'border-green-700',
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-700',
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-700',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const style = typeStyles[message.type];

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
      <div
        className={`${style.bg} ${style.border} border backdrop-blur-sm rounded-lg shadow-2xl px-4 py-3 min-w-80 max-w-md`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{message.message}</p>
            {message.fileSize && message.type === 'success' && (
              <p className="text-gray-400 text-xs mt-1">File size: {message.fileSize} KB</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportToast;

