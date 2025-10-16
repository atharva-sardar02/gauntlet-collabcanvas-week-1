import { useState, useEffect, useRef } from 'react';
import type { Shape } from '../../contexts/CanvasContext';

interface TextEditorProps {
  shape: Shape;
  onSave: (text: string, fontStyle: string, textDecoration: string) => void;
  onClose: () => void;
  stagePosition: { x: number; y: number };
  stageScale: number;
}

const TextEditor = ({ shape, onSave, onClose, stagePosition, stageScale }: TextEditorProps) => {
  const [text, setText] = useState(shape.text || '');
  const [isBold, setIsBold] = useState(shape.fontStyle?.includes('bold') || false);
  const [isItalic, setIsItalic] = useState(shape.fontStyle?.includes('italic') || false);
  const [isUnderline, setIsUnderline] = useState(shape.textDecoration === 'underline');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate position on screen
  const screenX = shape.x * stageScale + stagePosition.x;
  const screenY = shape.y * stageScale + stagePosition.y;
  const screenWidth = shape.width * stageScale;
  const screenHeight = shape.height * stageScale;

  useEffect(() => {
    // Focus and select all text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  useEffect(() => {
    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, isBold, isItalic, isUnderline]);

  const handleSave = () => {
    let fontStyle = 'normal';
    if (isBold && isItalic) {
      fontStyle = 'bold italic';
    } else if (isBold) {
      fontStyle = 'bold';
    } else if (isItalic) {
      fontStyle = 'italic';
    }

    const textDecoration = isUnderline ? 'underline' : '';
    
    onSave(text || 'Text', fontStyle, textDecoration);
    onClose();
  };

  return (
    <>
      {/* Overlay to catch clicks outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleSave}
      />

      {/* Editor */}
      <div
        className="fixed z-50"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${Math.max(screenWidth, 200)}px`,
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`
            w-full bg-gray-800 text-white border-2 border-yellow-400 rounded-lg p-2
            resize-none focus:outline-none focus:border-yellow-300
            ${isBold ? 'font-bold' : ''}
            ${isItalic ? 'italic' : ''}
            ${isUnderline ? 'underline' : ''}
          `}
          style={{
            minHeight: `${Math.max(screenHeight, 60)}px`,
            fontSize: `${(shape.fontSize || 16) * stageScale}px`,
            fontFamily: shape.fontFamily || 'Arial',
          }}
          rows={3}
          onBlur={handleSave}
        />

        {/* Formatting toolbar */}
        <div className="mt-2 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBold(!isBold);
            }}
            className={`
              px-3 py-1.5 rounded font-bold text-sm transition-all
              ${isBold 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            title="Bold (B)"
          >
            B
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsItalic(!isItalic);
            }}
            className={`
              px-3 py-1.5 rounded italic text-sm transition-all
              ${isItalic 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            title="Italic (I)"
          >
            I
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUnderline(!isUnderline);
            }}
            className={`
              px-3 py-1.5 rounded underline text-sm transition-all
              ${isUnderline 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
            title="Underline (U)"
          >
            U
          </button>

          <div className="flex-1" />

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-all"
          >
            Done
          </button>
        </div>

        <div className="mt-1 text-xs text-gray-400 bg-gray-800/90 px-2 py-1 rounded">
          Press Enter to add line, Esc or click outside to save
        </div>
      </div>
    </>
  );
};

export default TextEditor;

