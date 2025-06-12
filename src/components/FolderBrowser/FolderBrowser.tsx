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
        className="p-3 border-b cursor-pointer flex items-center transition-all hover:opacity-80"
        style={{ 
          borderColor: 'var(--panel-border)',
          background: isSelectedFolder ? 'var(--video-header-bg)' : 'var(--panel-bg)',
          color: isSelectedFolder ? 'var(--video-header-text)' : 'var(--foreground)'
        }}
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
        <div className="mr-4 flex items-center justify-center w-8 h-8">
          {isFolder ? (
            <svg 
              width="24" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ color: 'var(--foreground)' }}
            >
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2v0"/>
            </svg>
          ) : item.isVideo ? (
            <svg 
              width="24" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ color: 'var(--foreground)' }}
            >
              <path d="m15 10-4 4-6-6"/>
              <path d="M17.5 21h-11A4.5 4.5 0 0 1 2 16.5v-9A4.5 4.5 0 0 1 6.5 3h11A4.5 4.5 0 0 1 22 7.5v9a4.5 4.5 0 0 1-4.5 4.5z"/>
              <path d="M7 10.5l3-3 3 3"/>
            </svg>
          ) : (
            <svg 
              width="24" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ color: 'var(--foreground)' }}
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          )}
        </div>
        
        {/* File/folder name */}
        <div className="flex-1 truncate font-mono uppercase tracking-wide">
          {item.name}
        </div>
        
        {/* Arrow indicator for folders */}
        {isFolder && (
          <div className="ml-4 text-lg">
            →
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '600px', height: '500px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-mono font-bold uppercase tracking-wider">BROWSE DROPBOX</h2>
          <button 
            onClick={onClose} 
            className="control-button p-2 text-sm"
          >
            ✕
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--panel-border)', background: 'var(--muted)' }}>
          <div className="flex items-center space-x-1 font-mono text-sm uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                <button 
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className="px-2 py-1 hover:opacity-80 transition-all"
                >
                  {crumb.name.toUpperCase()}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-2">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="modal-body">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--foreground)' }}></div>
                <div className="font-mono text-sm uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>LOADING FOLDERS...</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="p-4 border" style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)', color: 'var(--foreground)' }}>
                <div className="font-mono text-lg uppercase mb-2">ERROR!</div>
                <div className="font-mono text-sm">{error}</div>
              </div>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center p-8">
              <div className="p-4 border" style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)', color: 'var(--foreground)' }}>
                <div className="font-mono text-lg uppercase">FOLDER IS EMPTY</div>
              </div>
            </div>
          ) : (
            <div className="p-0">
              {contents.map(item => renderItem(item))}
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="control-button"
          >
            CANCEL
          </button>
          <button
            onClick={handleSelectFolder}
            className="control-button"
          >
            SELECT THIS FOLDER
          </button>
        </div>
      </div>
    </div>
  );
}