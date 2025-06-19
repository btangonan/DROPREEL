import { Sun, Moon, LogIn } from 'lucide-react';

interface ReelMakerHeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function ReelMakerHeader({ isDarkMode, onThemeToggle }: ReelMakerHeaderProps) {
  return (
    <div className="matrix-header pt-4 md:pt-6 pr-3 md:pr-6 pl-3 md:pl-6 pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <img 
            src="/images/reeldrop_logos-trans.png" 
            alt="ReelDrop Logo" 
            className="h-8 md:h-10 w-auto"
          />
          <div>
            <div className="text-xs text-muted-foreground">
              DROP IT. SEND IT. BOOK IT.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={onThemeToggle}
            className="control-button flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center"
          >
            {isDarkMode ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> : <Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="text-xs sm:text-sm">{isDarkMode ? 'LIGHT' : 'DARK'}</span>
          </button>
          <button className="control-button flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center">
            <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">LOGIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}