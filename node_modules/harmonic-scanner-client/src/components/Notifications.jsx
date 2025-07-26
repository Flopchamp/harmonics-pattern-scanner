import React, { useEffect, useState } from 'react';

const Notifications = ({ notifications, onDismiss }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, 5)); // Show max 5 notifications
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pattern':
        return '📈';
      case 'alert':
        return '🚨';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'pattern':
        return 'border-accent-green bg-accent-green/10';
      case 'alert':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'success':
        return 'border-accent-green bg-accent-green/10';
      case 'error':
        return 'border-accent-red bg-accent-red/10';
      case 'info':
        return 'border-accent-blue bg-accent-blue/10';
      default:
        return 'border-border-color bg-bg-tertiary';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleDismiss = (id) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    setTimeout(() => onDismiss(id), 300); // Delay to allow animation
  };

  const handleDismissAll = () => {
    visibleNotifications.forEach(notification => {
      handleDismiss(notification.id);
    });
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {/* Header with dismiss all button */}
      {visibleNotifications.length > 1 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">
            {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleDismissAll}
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* Notifications */}
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
          getIcon={getNotificationIcon}
          getColor={getNotificationColor}
          formatTime={formatTimeAgo}
        />
      ))}
    </div>
  );
};

const NotificationCard = ({ notification, onDismiss, getIcon, getColor, formatTime }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto-dismiss after 10 seconds for non-error notifications
    if (notification.type !== 'error') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notification.type]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handlePatternClick = () => {
    if (notification.pattern) {
      // Emit event to focus on this pattern
      window.dispatchEvent(new CustomEvent('focusPattern', {
        detail: notification.pattern
      }));
      handleDismiss();
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getColor(notification.type)}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        hover:shadow-xl cursor-pointer
      `}
      onClick={notification.pattern ? handlePatternClick : undefined}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="text-lg flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <div className="text-sm font-medium text-text-primary mb-1">
            {notification.message}
          </div>

          {/* Pattern Details */}
          {notification.pattern && (
            <div className="text-xs text-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>Symbol:</span>
                <span className="font-medium">{notification.pattern.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Timeframe:</span>
                <span className="font-medium">{notification.pattern.timeframe}</span>
              </div>
              {notification.pattern.tradingLevels && (
                <div className="flex justify-between">
                  <span>Entry:</span>
                  <span className="font-medium text-accent-blue">
                    {notification.pattern.tradingLevels.entry?.toFixed(5)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-text-secondary mt-2">
            {formatTime(notification.timestamp)}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.type !== 'error' && (
        <div className="mt-3 h-1 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-green rounded-full animate-shrink"
            style={{ animation: 'shrink 10s linear forwards' }}
          />
        </div>
      )}

      {/* Click hint for pattern notifications */}
      {notification.pattern && (
        <div className="mt-2 text-xs text-text-secondary opacity-75">
          Click to view pattern on chart
        </div>
      )}
    </div>
  );
};

export default Notifications;
