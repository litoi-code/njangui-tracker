'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  isRead: boolean;
  link?: {
    href: string;
    label: string;
  };
}

interface NotificationsPanelProps {
  notifications: Notification[];
  limit?: number;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  limit = 5,
}) => {
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedNotification === id) {
      setExpandedNotification(null);
    } else {
      setExpandedNotification(id);
    }
  };

  const limitedNotifications = notifications.slice(0, limit);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return (
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>

      {limitedNotifications.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notifications found.</p>
      ) : (
        <div className="space-y-4">
          {limitedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg transition-colors cursor-pointer ${
                notification.isRead
                  ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
              onClick={() => toggleExpand(notification.id)}
            >
              <div className="flex items-start space-x-4">
                {getNotificationIcon(notification.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-black dark:text-white'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatDate(notification.date)}
                    </p>
                  </div>

                  <div className={`mt-1 transition-all duration-200 overflow-hidden ${
                    expandedNotification === notification.id ? 'max-h-40' : 'max-h-10'
                  }`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>

                    {notification.link && (
                      <Link
                        href={notification.link.href}
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {notification.link.label}
                      </Link>
                    )}
                  </div>
                </div>

                {!notification.isRead && (
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/notifications"
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationsPanel;
