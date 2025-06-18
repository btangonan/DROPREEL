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
    window.location.href = '/api/auth/dropbox';
  };

  // Periodic auth check
  useEffect(() => {
    const periodicCheck = () => {
      checkAuth();
    };
    periodicCheck(); // Check immediately
    const interval = setInterval(periodicCheck, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
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