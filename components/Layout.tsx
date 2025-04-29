'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar collapsed state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState) {
        setSidebarCollapsed(savedState === 'true');
      }
    }
  }, []);

  // Save sidebar collapsed state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
      }`}>
        {/* Top bar with menu toggle */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              id="sidebar-toggle"
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title - could be dynamic in the future */}
            <div className="md:hidden font-medium text-gray-900 dark:text-white">HODYVIKU</div>

            {/* Right side of header - could add notifications, profile, etc. */}
            <div className="flex items-center space-x-2">
              {/* Placeholder for future elements */}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background text-foreground transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
