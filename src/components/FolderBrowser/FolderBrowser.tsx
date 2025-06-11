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
        className={`p-4 border-b-3 border-black cursor-pointer flex items-center transition-all folder-item ${
          isSelectedFolder ? 'bg-neon-yellow' : ''
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
        <div className="mr-4 p-2 bg-black border-2 border-black">
          {isFolder ? (
            <div className="w-6 h-6 bg-neon-yellow border-2 border-black flex items-center justify-center">
              <span className="text-black font-black text-sm">📁</span>
            </div>
          ) : item.isVideo ? (
            <div className="w-6 h-6 bg-electric-blue border-2 border-black flex items-center justify-center">
              <span className="text-white font-black text-sm">🎬</span>
            </div>
          ) : (
            <div className="w-6 h-6 bg-brutal-gray border-2 border-black flex items-center justify-center">
              <span className="text-white font-black text-sm">📄</span>
            </div>
          )}
        </div>
        
        {/* File/folder name */}
        <div className="flex-1 truncate text-black font-black uppercase tracking-wide text-lg">
          {item.name}
        </div>
        
        {/* Arrow indicator for folders */}
        {isFolder && (
          <div className="ml-4 text-black font-black text-2xl">
            →
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black max-w-4xl w-full max-h-[85vh] flex flex-col mx-4 brutalist-folder-browser">
        {/* Header */}
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-neon-yellow">
          <h2 className="text-2xl font-black uppercase text-black tracking-wider">BROWSE DROPBOX</h2>
          <button 
            onClick={onClose} 
            className="bg-black text-white p-3 border-2 border-black hover:bg-white hover:text-black transition-all font-black text-lg"
          >
            ✕
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="p-4 border-b-4 border-black bg-electric-blue">
          <div className="flex items-center space-x-1 text-white font-black uppercase tracking-wide">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                <button 
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className="hover:bg-white hover:text-black px-2 py-1 border-2 border-transparent hover:border-black transition-all font-black"
                >
                  {crumb.name.toUpperCase()}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-2 text-white font-black text-xl">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
                <div className="text-black font-black text-xl uppercase tracking-wide">LOADING FOLDERS...</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="bg-hot-pink text-white p-6 border-4 border-black inline-block">
                <div className="font-black text-xl uppercase mb-2">ERROR!</div>
                <div className="font-bold">{error}</div>
              </div>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center p-8">
              <div className="bg-brutal-gray text-white p-6 border-4 border-black inline-block">
                <div className="font-black text-xl uppercase">FOLDER IS EMPTY</div>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {contents.map(item => renderItem(item))}
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="p-6 border-t-4 border-black flex justify-end items-center bg-fluorescent-green">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-brutal-gray text-white border-4 border-black font-black text-lg uppercase tracking-wide hover:bg-white hover:text-black transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={handleSelectFolder}
              className="px-6 py-3 bg-electric-blue text-white border-4 border-black font-black text-lg uppercase tracking-wide hover:bg-white hover:text-electric-blue transition-all"
            >
              SELECT THIS FOLDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
