import { Sun, Moon, LogIn } from 'lucide-react';

interface ReelMakerHeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function ReelMakerHeader({ isDarkMode, onThemeToggle }: ReelMakerHeaderProps) {
  return (
    <div className="matrix-header pt-6 pr-6 pl-6 pb-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-terminal">REELDROP</h1>
          <div className="text-xs text-muted-foreground mt-1">
            DROP IT. SEND IT. BOOK IT.
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onThemeToggle}
            className="control-button flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
          </button>
          <button className="control-button flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span>LOGIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}