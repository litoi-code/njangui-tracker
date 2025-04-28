'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const NavBar = () => {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/members', label: 'Members' },
    { href: '/funds', label: 'Funds' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/loans', label: 'Loans' },
    { href: '/contributions', label: 'Contributions' },
    { href: '/penalties', label: 'Penalties' },
    { href: '/reports', label: 'Reports' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-primary-700 dark:bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          HODYVIKU
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-primary-800 dark:bg-gray-700 text-white'
                  : 'text-white hover:bg-primary-600 dark:hover:bg-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Dark mode toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-primary-600 dark:border-gray-700">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? 'bg-primary-800 dark:bg-gray-700 text-white'
                    : 'text-white hover:bg-primary-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Dark mode toggle for mobile */}
            <div className="flex items-center px-3 py-2">
              <span className="mr-2 text-sm font-medium text-white">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
