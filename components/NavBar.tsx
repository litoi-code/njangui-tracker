"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
    };

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex space-x-4">
                        <Link 
                            href="/" 
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            href="/internal-lending" 
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/internal-lending')}`}
                        >
                            Internal Lending
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
