import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface TitleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTitle: (text: string, size: string) => void;
  initialTitle?: string;
  initialSize?: string;
}

const titleSizes = [
  { id: 'small', label: 'SMALL TITLE', sample: 'SAMPLE TEXT' },
  { id: 'medium', label: 'MEDIUM TITLE', sample: 'SAMPLE TEXT' },
  { id: 'large', label: 'LARGE TITLE', sample: 'SAMPLE TEXT', isHighlight: true },
  { id: 'extra-large', label: 'EXTRA LARGE', sample: 'SAMPLE TEXT' },
  { id: 'huge', label: 'HUGE TITLE', sample: 'SAMPLE TEXT' }
];

export default function TitleEditor({ isOpen, onClose, onAddTitle, initialTitle = '', initialSize = 'large' }: TitleEditorProps) {
  const [titleText, setTitleText] = useState(initialTitle);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [charCount, setCharCount] = useState(initialTitle.length);
  const maxChars = 100;
  
  // Determine if we're editing an existing title
  const isUpdating = initialTitle.length > 0;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setTitleText(text);
      setCharCount(text.length);
    }
  };

  const handleAddTitle = () => {
    if (titleText.trim()) {
      onAddTitle(titleText.trim(), selectedSize);
      setTitleText('');
      setCharCount(0);
      setSelectedSize('large');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitleText('');
    setCharCount(0);
    setSelectedSize('large');
    onClose();
  };

  // Update state when props change (for editing existing titles)
  useEffect(() => {
    if (isOpen) {
      setTitleText(initialTitle);
      setSelectedSize(initialSize);
      setCharCount(initialTitle.length);
    }
  }, [isOpen, initialTitle, initialSize]);

  // Handle ESC and Enter keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        handleCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTitle();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, titleText, selectedSize]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => {
        // Only close if clicking directly on the overlay, not when dragging or selecting text
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div 
        className="modal-content max-w-2xl w-full mx-4"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wider">TITLE_EDITOR.EXE</span>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body p-6 space-y-6">
          {/* Title Text Input */}
          <div>
            <label className="block font-bold text-sm mb-3 tracking-wider matrix-text">
              TITLE TEXT:
            </label>
            <input
              type="text"
              value={titleText}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTitle();
                }
              }}
              placeholder="ENTER YOUR TITLE..."
              className="w-full px-4 py-3 border-2 font-mono text-lg tracking-wider uppercase focus:outline-none"
              style={{ 
                fontFamily: 'var(--font-mono)',
                borderColor: 'var(--panel-border)',
                background: 'var(--panel-bg)',
                color: 'var(--foreground)'
              }}
              autoFocus
            />
          </div>

          {/* Size Selection */}
          <div>
            <label className="block font-bold text-sm mb-3 tracking-wider matrix-text">
              SIZE:
            </label>
            <div className="space-y-2">
              {titleSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className="w-full p-4 border-2 text-left flex justify-between items-center transition-none hover:opacity-80"
                  style={{ 
                    fontFamily: 'var(--font-mono)',
                    borderColor: 'var(--panel-border)',
                    background: selectedSize === size.id ? 'var(--video-header-bg)' : 'var(--panel-bg)',
                    color: selectedSize === size.id ? 'var(--video-header-text)' : 'var(--foreground)'
                  }}
                >
                  <span className="font-bold tracking-wider text-sm">
                    {size.label}
                  </span>
                  <span 
                    className="font-bold tracking-wider"
                    style={{ 
                      fontSize: size.id === 'small' ? '0.875rem' : 
                               size.id === 'medium' ? '1rem' :
                               size.id === 'large' ? '1.125rem' :
                               size.id === 'extra-large' ? '1.25rem' : '1.375rem',
                      color: selectedSize === size.id ? 'var(--video-header-text)' : 'var(--accent)'
                    }}
                  >
                    {size.sample}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleAddTitle}
              disabled={!titleText.trim()}
              className="flex-1 font-bold py-3 px-6 border-2 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-none hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-mono)',
                borderColor: 'var(--panel-border)',
                backgroundColor: isUpdating ? 'var(--accent)' : '#8b5cf6',
                color: 'var(--panel-bg)'
              }}
            >
              {isUpdating ? 'UPDATE TITLE' : 'ADD TITLE'}
            </button>
            <button
              onClick={handleCancel}
              className="font-bold py-3 px-6 border-2 tracking-wider hover:opacity-80 transition-none"
              style={{ 
                fontFamily: 'var(--font-mono)',
                borderColor: 'var(--panel-border)',
                background: 'var(--panel-bg)',
                color: 'var(--foreground)'
              }}
            >
              CANCEL
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer justify-between">
          <span>CHARS: {charCount}/{maxChars}</span>
          <span>SIZE: {titleSizes.find(s => s.id === selectedSize)?.label || 'LARGE'}</span>
        </div>
      </div>
    </div>
  );
}