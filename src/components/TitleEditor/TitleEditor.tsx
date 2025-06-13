import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div 
        className="bg-white border-2 border-black max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
          <FileText className="w-5 h-5" />
          <span className="font-bold text-lg tracking-wider">TITLE_EDITOR.EXE</span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Text Input */}
          <div>
            <label className="block text-black font-bold text-sm mb-3 tracking-wider">
              TITLE TEXT:
            </label>
            <input
              type="text"
              value={titleText}
              onChange={handleTextChange}
              placeholder="ENTER YOUR TITLE..."
              className="w-full px-4 py-3 border-2 border-black bg-white text-black placeholder-gray-400 font-mono text-lg tracking-wider uppercase focus:outline-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-black font-bold text-sm mb-3 tracking-wider">
              SIZE:
            </label>
            <div className="space-y-2">
              {titleSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`w-full p-4 border-2 border-black text-left flex justify-between items-center transition-none ${
                    selectedSize === size.id
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-black hover:text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="font-bold tracking-wider text-sm">
                    {size.label}
                  </span>
                  <span 
                    className={`font-bold tracking-wider ${
                      selectedSize === size.id && size.isHighlight 
                        ? 'text-purple-400' 
                        : selectedSize === size.id 
                          ? 'text-purple-600'
                          : 'text-purple-500'
                    }`}
                    style={{ 
                      fontSize: size.id === 'small' ? '0.875rem' : 
                               size.id === 'medium' ? '1rem' :
                               size.id === 'large' ? '1.125rem' :
                               size.id === 'extra-large' ? '1.25rem' : '1.375rem'
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
              className="flex-1 bg-purple-500 text-white font-bold py-3 px-6 border-2 border-black tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ADD TITLE
            </button>
            <button
              onClick={handleCancel}
              className="bg-white text-black font-bold py-3 px-6 border-2 border-black tracking-wider hover:bg-gray-100 transition-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              CANCEL
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black text-white px-6 py-3 flex justify-between items-center text-sm font-bold tracking-wider">
          <span>CHARS: {charCount}/{maxChars}</span>
          <span>SIZE: {titleSizes.find(s => s.id === selectedSize)?.label || 'LARGE'}</span>
        </div>
      </div>
    </div>
  );
}