import { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import CreatePassView from './components/CreatePassView';
import AllPassesView from './components/AllPassesView';
import PublicPassView from './components/PublicPassView';
import NotFoundView from './components/NotFoundView';
import PublicPortalHome from './components/PublicPortalHome';
import { ViewType } from './types';
import { authService, extractDCNumber } from './supabase';
import { ShieldCheck, LogOut, Loader2, Sparkles } from 'lucide-react';

// Extract initial router settings synchronously on module parse to prevent any Guest view state 404 race conditions
function getInitialRouteState(): { view: ViewType; dcNumber: string; isLogin: boolean } {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', dcNumber: '', isLogin: false };
  }
  const path = window.location.pathname;
  const hash = window.location.hash;

  const isLogin = path === '/login' || path === '/login/' || hash === '#/login' || hash === '#login';

  if (path.startsWith('/pass/')) {
    const dcNum = extractDCNumber(path);
    if (dcNum) {
      return { view: 'public-verify', dcNumber: dcNum, isLogin: false };
    }
  } else if (hash.startsWith('#/pass/')) {
    const dcNum = extractDCNumber(hash);
    if (dcNum) {
      return { view: 'public-verify', dcNumber: dcNum, isLogin: false };
    }
  } else if (hash === '#/create-pass' || hash === '#create-pass') {
    return { view: 'create-pass', dcNumber: '', isLogin: false };
  } else if (hash === '#/all-passes' || hash === '#all-passes') {
    return { view: 'all-passes', dcNumber: '', isLogin: false };
  }

  return { view: 'dashboard', dcNumber: '', isLogin };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // Custom router state initialized synchronously to avoid any client-side 404 state mismatch
  const initialRoute = getInitialRouteState();
  const [currentView, setCurrentView] = useState<ViewType>(initialRoute.view);
  const [queriedDCNumber, setQueriedDCNumber] = useState(initialRoute.dcNumber);
  const [isOnLoginPath, setIsOnLoginPath] = useState(initialRoute.isLogin);

  // Handle routing by parsing window locations (both pathname and hash falls)
  const parseLocalRoute = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Check login route path or hash
    const isLogin = path === '/login' || path === '/login/' || hash === '#/login' || hash === '#login';
    setIsOnLoginPath(isLogin);

    if (path.startsWith('/pass/')) {
      // E.g., /pass/STQL14010368060001000600
      const dcNum = extractDCNumber(path);
      if (dcNum) {
        setQueriedDCNumber(dcNum);
        setCurrentView('public-verify');
        return true;
      }
    } else if (hash.startsWith('#/pass/')) {
      // E.g., #/pass/STQL14010368060001000600
      const dcNum = extractDCNumber(hash);
      if (dcNum) {
        setQueriedDCNumber(dcNum);
        setCurrentView('public-verify');
        return true;
      }
    } else if (hash === '#/create-pass' || hash === '#create-pass') {
      setCurrentView('create-pass');
    } else if (hash === '#/all-passes' || hash === '#all-passes') {
      setCurrentView('all-passes');
    } else {
      setCurrentView('dashboard');
    }
    return false;
  };

  // Bind popstate events so standard browser Forward/Back buttons operate perfectly
  useEffect(() => {
    const handlePopState = () => {
      parseLocalRoute();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    
    // Initial evaluation
    const isPublicVerify = parseLocalRoute();

    // Check active login session on load
    async function checkActiveSession() {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session handoff error:', err);
      } finally {
        setLoadingSession(false);
      }
    }
    checkActiveSession();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Soft push-routing helper (cleans path without tab resets)
  const navigateToLocalPath = (view: ViewType, dcNum?: string) => {
    if (view === 'public-verify' && dcNum) {
      setQueriedDCNumber(dcNum);
      setCurrentView('public-verify');
      
      // Update browser URL to support hash-routing without login
      const targetPath = `/#/pass/${dcNum}`;
      window.history.pushState({ view, dcNum }, '', targetPath);
    } else {
      setCurrentView(view);
      setIsOnLoginPath(false);
      
      // Map views to hash configurations
      const hash = view === 'dashboard' ? '' : `#/${view}`;
      window.history.pushState({ view }, '', '/' + hash);
    }
  };

  const handleLoginSuccess = (userSession: any) => {
    setCurrentUser(userSession);
    // Return to dashboard after successful login
    navigateToLocalPath('dashboard');
  };

  const handleAdminLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setIsOnLoginPath(false);
    // Clean target back to root (triggering 404 security blocker)
    window.history.pushState({}, '', '/');
    setCurrentView('dashboard');
  };

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070b13] text-gray-400 font-mono">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <span className="text-xs animate-pulse">Consulting Secure Session Handshake...</span>
      </div>
    );
  }

  // PUBLIC PASS PAGE - RENDER OUTSIDE MAIN LAYOUT
  if (currentView === 'public-verify' && queriedDCNumber) {
    return (
      <PublicPassView 
        dcNumber={queriedDCNumber} 
        isAdmin={!!currentUser}
        onBackToPortal={() => {
          // If already logged in, take them back to the portal dashboard
          if (currentUser) {
            navigateToLocalPath('all-passes');
          } else {
            // Otherwise reset path to root / and show the public portal homepage
            window.history.pushState({}, '', '/');
            setIsOnLoginPath(false);
            setCurrentView('dashboard');
          }
        }} 
      />
    );
  }

  // GUEST STATE - NOT LOGGED IN
  if (!currentUser) {
    if (isOnLoginPath) {
      return <LoginView onSuccess={handleLoginSuccess} />;
    } else {
      return (
        <PublicPortalHome 
          onSearch={(dcNum) => navigateToLocalPath('public-verify', dcNum)} 
          onGoToLogin={() => {
            window.history.pushState({}, '', '/login');
            setIsOnLoginPath(true);
          }} 
        />
      );
    }
  }

  // AUTHENTICATED STATE - RENDER SIDEBAR PANEL
  return (
    <div className="flex min-h-screen bg-[#070b13]">
      
      {/* SIDEBAR NAVIGATION SHELL */}
      <Sidebar 
        currentView={currentView}
        onNavigate={(view) => navigateToLocalPath(view)}
        onLogout={handleAdminLogout}
        adminEmail={currentUser.email}
      />

      {/* CORE WORKSPACE PANEL */}
      <main className="flex-1 min-h-screen md:p-8 p-4 pb-24 md:pb-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* TOP COMPLIANCE NOTIFIER BLOCK */}
        <header className="flex justify-between items-center mb-6 border-b border-slate-900 pb-4 no-print">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-black text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            <span>SECURE SYSTEM WORKSPACE (SSL ACTIVE)</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <span>Server Time (UTC):</span>
            <span className="font-mono text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">2026-05-27 12:33:22</span>
          </div>
        </header>

        {/* ACTIVE COMPONENT VIEW ROUTING */}
        <div className="animate-fade-in">
          {currentView === 'dashboard' && (
            <DashboardView 
              onNavigate={(view) => navigateToLocalPath(view)} 
              onSelectPass={(dcNumber) => navigateToLocalPath('public-verify', dcNumber)} 
            />
          )}

          {currentView === 'create-pass' && (
            <CreatePassView 
              onNavigate={(view) => navigateToLocalPath(view)} 
              onSelectPass={(dcNumber) => navigateToLocalPath('public-verify', dcNumber)}
            />
          )}

          {currentView === 'all-passes' && (
            <AllPassesView 
              onSelectPass={(dcNumber) => navigateToLocalPath('public-verify', dcNumber)} 
              onNavigate={(view) => navigateToLocalPath(view)}
            />
          )}
        </div>

      </main>

    </div>
  );
}
