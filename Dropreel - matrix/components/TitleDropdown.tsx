import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileText, Type } from 'lucide-react';

interface TitleDropdownProps {
  onAddTitle: (title: string, size: string) => void;
}

export function TitleDropdown({ onAddTitle }: TitleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [selectedSize, setSelectedSize] = useState('LARGE');

  const titleSizes = [
    { value: 'SMALL', label: 'SMALL TITLE', class: 'text-sm' },
    { value: 'MEDIUM', label: 'MEDIUM TITLE', class: 'text-base' },
    { value: 'LARGE', label: 'LARGE TITLE', class: 'text-lg' },
    { value: 'XLARGE', label: 'EXTRA LARGE', class: 'text-xl' },
    { value: 'HUGE', label: 'HUGE TITLE', class: 'text-2xl' }
  ];

  const handleAddTitle = () => {
    if (titleText.trim()) {
      onAddTitle(titleText, selectedSize);
      setTitleText('');
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="brutal-button px-4 py-3 flex items-center gap-2 w-full">
          <FileText className="w-4 h-4" />
          <span>ADD_TITLE</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background border-2 border-archive-primary" align="start">
        {/* Header */}
        <div className="bg-archive-primary text-background px-4 py-2 flex items-center gap-2">
          <Type className="w-4 h-4" />
          <span className="text-sm font-mono">TITLE_EDITOR.EXE</span>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label className="text-archive-primary text-xs">TITLE TEXT:</Label>
            <Input
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="ENTER YOUR TITLE..."
              className="bg-input-background border-2 border-archive-primary text-archive-primary placeholder:text-archive-dark-gray font-mono text-sm"
            />
          </div>
          
          {/* Size Selection */}
          <div className="space-y-2">
            <Label className="text-archive-primary text-xs">SIZE:</Label>
            <div className="space-y-1">
              {titleSizes.map((size) => (
                <div
                  key={size.value}
                  className={`p-2 border border-archive-primary cursor-pointer transition-colors font-mono text-xs ${
                    selectedSize === size.value 
                      ? 'bg-archive-primary text-background' 
                      : 'bg-background text-archive-primary hover:bg-archive-primary hover:text-background'
                  }`}
                  onClick={() => setSelectedSize(size.value)}
                >
                  <div className="flex items-center justify-between">
                    <span>{size.label}</span>
                    <span className={`${size.class} text-archive-secondary`}>
                      {titleText || 'SAMPLE TEXT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preview */}
          {titleText && (
            <div className="border-t border-archive-primary pt-4">
              <Label className="text-archive-primary text-xs">PREVIEW:</Label>
              <div className="bg-archive-light-gray p-3 mt-2 border border-archive-primary">
                <div className={`text-archive-primary ${titleSizes.find(s => s.value === selectedSize)?.class} font-mono`}>
                  {titleText.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddTitle}
              disabled={!titleText.trim()}
              className={`flex-1 brutal-button-accent px-3 py-2 text-xs ${
                !titleText.trim() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              ADD TITLE
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="brutal-button px-3 py-2 text-xs"
            >
              CANCEL
            </button>
          </div>
        </div>
        
        {/* Status bar */}
        <div className="bg-archive-primary text-background px-4 py-1 text-xs font-mono border-t border-archive-primary">
          <div className="flex justify-between items-center">
            <span>CHARS: {titleText.length}/100</span>
            <span>SIZE: {selectedSize}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}