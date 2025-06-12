'use client';

import { useState, useEffect } from 'react';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';

interface FolderItem {
  name: string;
  path: string;
  type: string;
  isVideo: boolean;
}

interface FolderBrowserProps {
  onFolderSelect: (path: string) => void;
  onClose: () => void;
  initialPath?: string;
  onAuthError?: () => void;
}

export default function FolderBrowser({ onFolderSelect, onClose, initialPath = '', onAuthError }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([]);
  const [selectedPath, setSelectedPath] = useState('');

  // Load the folder contents on component mount and when path changes
  useEffect(() => {
    const fetchFolderContents = async (path: string) => {
      setIsLoading(true);
      setError('');
      
      try {
        // Convert the path if it's a URL
        const formattedPath = extractDropboxPath(path);
        console.log(`Browsing folder: "${formattedPath}"`);
        
        // Better URI encoding for paths with special characters
        const url = new URL('/api/dropbox', window.location.origin);
        url.searchParams.append('action', 'listFolders');
        url.searchParams.append('folderPath', formattedPath);
        
        // Call our API to list the folder contents
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401 || errorData.error === 'unauthorized') {
            setError('Your Dropbox session has expired or is invalid. Please reconnect.');
            if (onAuthError) onAuthError();
            setContents([]);
            setIsLoading(false);
            return;
          }
          throw new Error(errorData.error || `Failed to load folder contents (${response.status})`);
        }
        
        const data = await response.json();
        setContents(data.contents || []);
        setCurrentPath(data.path || '');
        
        // Update breadcrumbs based on the current path
        updateBreadcrumbs(data.path || '');
      } catch (err: any) {
        console.error('Error fetching folder contents:', err);
        setError(err.message || 'Error loading folder contents');
        setContents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Start with root or provided initial path
    fetchFolderContents(initialPath || '');
  }, [initialPath]);
  
  // Update breadcrumbs whenever the path changes
  const updateBreadcrumbs = (path: string) => {
    if (!path || path === '/') {
      // Just root
      setBreadcrumbs([{ name: 'Root', path: '' }]);
      return;
    }
    
    // Split the path into segments
    const segments = path.split('/').filter(Boolean);
    const crumbs = [{ name: 'Root', path: '' }];
    
    // Build up paths for each segment
    let currentSegmentPath = '';
    segments.forEach(segment => {
      currentSegmentPath += '/' + segment;
      crumbs.push({
        name: segment,
        path: currentSegmentPath
      });
    });
    
    setBreadcrumbs(crumbs);
  };
  
  // Handle clicking on a folder to navigate into it
  const handleFolderClick = (folder: FolderItem) => {
    if (folder.type === 'folder') {
      setCurrentPath(folder.path);
      setIsLoading(true);
      
      // Create a URL object for better parameter handling
      const url = new URL('/api/dropbox', window.location.origin);
      url.searchParams.append('action', 'listFolders');
      url.searchParams.append('folderPath', folder.path);
      
      // Navigate to the clicked folder
      fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (!response.ok) {
            return response.json().catch(() => ({}))
              .then(errorData => {
                throw new Error(errorData.error || `Failed to load folder contents (${response.status})`);
              });
          }
          return response.json();
        })
        .then(data => {
          setContents(data.contents || []);
          setCurrentPath(data.path || '');
          updateBreadcrumbs(data.path || '');
        })
        .catch(err => {
          console.error('Error navigating to folder:', err);
          setError(err.message || 'Error loading folder contents');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };
  
  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
    setIsLoading(true);
    
    // Create a URL object for better parameter handling
    const url = new URL('/api/dropbox', window.location.origin);
    url.searchParams.append('action', 'listFolders');
    url.searchParams.append('folderPath', path);
    
    fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          return response.json().catch(() => ({}))
            .then(errorData => {
              throw new Error(errorData.error || `Failed to load folder contents (${response.status})`);
            });
        }
        return response.json();
      })
      .then(data => {
        setContents(data.contents || []);
        setCurrentPath(data.path || '');
        updateBreadcrumbs(data.path || '');
      })
      .catch(err => {
        console.error('Error navigating via breadcrumb:', err);
        setError(err.message || 'Error loading folder contents');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Handle selecting the current folder
  const handleSelectFolder = () => {
    onFolderSelect(currentPath);
  };
  
  // Render a single folder/file item
  const renderItem = (item: FolderItem) => {
    const isFolder = item.type === 'folder';
    const isSelectedFolder = selectedPath === item.path;
    
    return (
      <div 
        key={item.path} 
        className={`p-4 border-b border-terminal cursor-pointer flex items-center transition-all hover:matrix-glow ${
          isSelectedFolder ? 'bg-foreground text-background' : 'bg-background text-foreground'
        }`}
        onClick={() => {
          if (isFolder) {
            handleFolderClick(item);
          } else {
            // If it's a file, just select this folder
            setSelectedPath(currentPath);
          }
        }}
      >
        {/* Folder or file icon */}
        <div className="mr-4 p-2 bg-foreground border border-terminal">
          {isFolder ? (
            <div className="w-6 h-6 bg-accent border border-terminal flex items-center justify-center">
              <span className="text-background text-sm">📁</span>
            </div>
          ) : item.isVideo ? (
            <div className="w-6 h-6 bg-accent border border-terminal flex items-center justify-center">
              <span className="text-background text-sm">🎬</span>
            </div>
          ) : (
            <div className="w-6 h-6 bg-muted border border-terminal flex items-center justify-center">
              <span className="text-foreground text-sm">📄</span>
            </div>
          )}
        </div>
        
        {/* File/folder name */}
        <div className="flex-1 truncate text-terminal uppercase tracking-wide">
          {item.name}
        </div>
        
        {/* Arrow indicator for folders */}
        {isFolder && (
          <div className="ml-4 text-terminal text-2xl">
            →
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ minWidth: '600px', minHeight: '500px' }}>
        {/* Header */}
        <div className="bg-foreground text-background p-6 border-b border-terminal flex justify-between items-center">
          <h2 className="text-2xl uppercase tracking-wider">BROWSE DROPBOX</h2>
          <button 
            onClick={onClose} 
            className="bg-background text-foreground p-3 border border-terminal hover:bg-foreground hover:text-background transition-all"
          >
            ✕
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="p-4 border-b border-terminal bg-accent">
          <div className="flex items-center space-x-1 text-background uppercase tracking-wide">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                <button 
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className="hover:bg-background hover:text-foreground px-2 py-1 border border-transparent hover:border-terminal transition-all"
                >
                  {crumb.name.toUpperCase()}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-2 text-background text-xl">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-terminal mx-auto mb-4"></div>
                <div className="text-terminal text-xl uppercase tracking-wide">LOADING FOLDERS...</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="bg-destructive text-destructive-foreground p-6 border border-terminal inline-block">
                <div className="text-xl uppercase mb-2">ERROR!</div>
                <div className="font-medium">{error}</div>
              </div>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center p-8">
              <div className="bg-muted text-foreground p-6 border border-terminal inline-block">
                <div className="text-xl uppercase">FOLDER IS EMPTY</div>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {contents.map(item => renderItem(item))}
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="p-6 border-t border-terminal flex justify-end items-center bg-accent">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="control-button"
            >
              CANCEL
            </button>
            <button
              onClick={handleSelectFolder}
              className="control-button matrix-glow"
            >
              SELECT THIS FOLDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}