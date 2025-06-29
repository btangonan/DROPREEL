'use client';

import { useState, useEffect, useRef } from 'react';

export function useDropboxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [authRetryable, setAuthRetryable] = useState<boolean>(false);
  const [authSuggestedAction, setAuthSuggestedAction] = useState<string | null>(null);
  
  const latestAuthState = useRef(isAuthenticated);

  useEffect(() => {
    latestAuthState.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
  }, [isLoading]);

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/dropbox/status');
      if (!response.ok) throw new Error('Auth check failed');
      const data = await response.json();
      const isAuth = !!data.isAuthenticated;
      setIsAuthenticated(isAuth);
      setAuthStatus(data.status || '');
      setAuthErrorCode(data.errorCode);
      setAuthRetryable(data.retryable);
      setAuthSuggestedAction(data.suggestedAction);
      if (!isAuth && data.suggestedAction) {
        setAuthError(data.suggestedAction);
      }
      return isAuth;
    } catch (err) {
      console.error('[useDropboxAuth] Error:', err);
      setIsAuthenticated(false);
      setAuthStatus('unknown_error');
      setAuthErrorCode('unknown_error');
      setAuthRetryable(false);
      setAuthSuggestedAction('Please try reconnecting your Dropbox account.');
      setAuthError('Unable to check Dropbox authentication. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connect = () => {
    console.log('[useDropboxAuth] connect() called - redirecting to /api/auth/dropbox');
    window.location.href = '/api/auth/dropbox';
  };

  // Check for auth success in URL (safely handle in client-side only)
  const [authSuccessParam, setAuthSuccessParam] = useState(false);
  
  useEffect(() => {
    // Only check URL params on client-side to avoid SSR issues
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setAuthSuccessParam(urlParams.get('auth') === 'success');
    }
  }, []);
  
  // Check auth status on mount and when auth success param changes
  useEffect(() => {
    let mounted = true;
    
    const checkAuthStatus = async () => {
      if (!mounted) return;
      
      const isAuth = await checkAuth();
      
      // If we have an auth success param and we're not authenticated, force a recheck
      if (authSuccessParam && !isAuth) {
        console.log('Auth success detected in URL, rechecking auth status...');
        // Small delay to ensure server has processed the auth
        setTimeout(checkAuth, 1000);
      }
    };
    
    checkAuthStatus();
    
    return () => {
      mounted = false;
    };
  }, [authSuccessParam]);
  
  // Periodic auth check
  useEffect(() => {
    const periodicCheck = () => {
      checkAuth();
    };
    
    // Only start periodic checks after initial auth check is done
    const timer = setTimeout(() => {
      periodicCheck();
      const interval = setInterval(periodicCheck, 2 * 60 * 1000); // Every 2 minutes
      return () => clearInterval(interval);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    authStatus,
    authError,
    authErrorCode,
    authRetryable,
    authSuggestedAction,
    latestAuthState,
    checkAuth,
    connect
  };
}