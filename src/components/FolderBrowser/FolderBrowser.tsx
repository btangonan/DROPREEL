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
        className={`p-2 border-b hover:bg-gray-100 cursor-pointer flex items-center ${
          isSelectedFolder ? 'bg-blue-100' : ''
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
        <div className="mr-2">
          {isFolder ? (
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
            </svg>
          ) : item.isVideo ? (
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.793 1.793l-2.586 2.586a1 1 0 000 1.414l2.586 2.586a1 1 0 001.414-1.414l-.293-.293h1.172a1 1 0 001-1v-2a1 1 0 00-1-1h-1.172l.293-.293a1 1 0 00-1.414-1.414z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
            </svg>
          )}
        </div>
        
        {/* File/folder name */}
        <div className="flex-1 truncate text-black font-medium">
          {item.name}
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">Browse Dropbox</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="p-2 border-b bg-gray-50">
          <div className="flex items-center space-x-2 text-black font-medium">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                <button 
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  className="hover:underline text-blue-600 px-1 font-medium"
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-1 text-black">/</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : contents.length === 0 ? (
            <div className="text-black p-4 text-center">This folder is empty</div>
          ) : (
            <div>
              {contents.map(item => renderItem(item))}
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div>
            <span className="text-sm text-black font-medium">
              Current path: <span className="font-mono font-medium">{currentPath || '/ (root)'}</span>
            </span>
          </div>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-black hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select This Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
