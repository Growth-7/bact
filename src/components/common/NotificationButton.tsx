import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationButtonProps {
  onClick: () => void;
  hasNotification: boolean;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ onClick, hasNotification }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
    >
      <Bell className="w-6 h-6" />
      {hasNotification && (
        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
      )}
    </button>
  );
};

export default NotificationButton;
