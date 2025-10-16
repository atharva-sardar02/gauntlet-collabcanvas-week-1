import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ShortcutToastProps {
  message: ToastMessage | null;
  duration?: number;
  onClose: () => void;
}

/**
 * Toast notification component for keyboard shortcut feedback
 */
const ShortcutToast = ({ message, duration = 2000, onClose }: ShortcutToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeStyles = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-blue-600/90 border-blue-500',
  };

  const style = typeStyles[message.type || 'info'];

  return (
    <div
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className={`${style} text-white px-6 py-3 rounded-lg shadow-2xl border backdrop-blur-sm flex items-center gap-3`}
      >
        {message.type === 'success' && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {message.type === 'error' && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="font-medium">{message.message}</span>
      </div>
    </div>
  );
};

export default ShortcutToast;

