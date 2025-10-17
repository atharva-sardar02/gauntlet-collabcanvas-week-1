import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  // Layer operations
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  // Other operations
  onDuplicate?: () => void;
  onDelete?: () => void;
  // Disabled states
  disabledOperations?: {
    bringToFront?: boolean;
    bringForward?: boolean;
    sendBackward?: boolean;
    sendToBack?: boolean;
  };
}

const ContextMenu = ({
  x,
  y,
  onClose,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onDuplicate,
  onDelete,
  disabledOperations = {},
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = rect.width;
      const menuHeight = rect.height;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontally
      if (x + menuWidth > windowWidth) {
        adjustedX = windowWidth - menuWidth - 10;
      }

      // Adjust vertically
      if (y + menuHeight > windowHeight) {
        adjustedY = windowHeight - menuHeight - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1 z-[10000] min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {/* Layer Management Section */}
      {(onBringToFront || onBringForward || onSendBackward || onSendToBack) && (
        <>
          <div className="px-3 py-1 text-xs text-gray-500 font-semibold">
            LAYER
          </div>
          
          {onBringToFront && (
            <button
              onClick={() => handleAction(onBringToFront)}
              disabled={disabledOperations.bringToFront}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                ${
                  disabledOperations.bringToFront
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span>Bring to Front</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘⇧]
              </kbd>
            </button>
          )}

          {onBringForward && (
            <button
              onClick={() => handleAction(onBringForward)}
              disabled={disabledOperations.bringForward}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                ${
                  disabledOperations.bringForward
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span>Bring Forward</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘]
              </kbd>
            </button>
          )}

          {onSendBackward && (
            <button
              onClick={() => handleAction(onSendBackward)}
              disabled={disabledOperations.sendBackward}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                ${
                  disabledOperations.sendBackward
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span>Send Backward</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘[
              </kbd>
            </button>
          )}

          {onSendToBack && (
            <button
              onClick={() => handleAction(onSendToBack)}
              disabled={disabledOperations.sendToBack}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                ${
                  disabledOperations.sendToBack
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span>Send to Back</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘⇧[
              </kbd>
            </button>
          )}

          <div className="border-t border-gray-700 my-1" />
        </>
      )}

      {/* Edit Section */}
      {(onDuplicate || onDelete) && (
        <>
          <div className="px-3 py-1 text-xs text-gray-500 font-semibold">
            EDIT
          </div>

          {onDuplicate && (
            <button
              onClick={() => handleAction(onDuplicate)}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
            >
              <span>Duplicate</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                ⌘D
              </kbd>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center justify-between"
            >
              <span>Delete</span>
              <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                Del
              </kbd>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ContextMenu;

