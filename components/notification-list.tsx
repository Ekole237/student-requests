"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationListProps {
  userId: string;
}

export default function NotificationList({ userId }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      fetchNotifications(); // Re-fetch to update UI
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && <p className="p-2 text-sm">Loading notifications...</p>}
        {error && (
          <p className="p-2 text-sm text-red-500">Error: {error}</p>
        )}
        {!isLoading && notifications.length === 0 && (
          <p className="p-2 text-sm text-gray-500">No new notifications.</p>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start space-y-1"
            onClick={() => markAsRead(notification.id)}
            disabled={notification.is_read}
          >
            <div className="flex w-full justify-between text-sm">
              <span className="font-semibold">{notification.title}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <p className="text-xs text-gray-700">{notification.message}</p>
            {!notification.is_read && (
              <span className="text-xs text-blue-500">Mark as Read</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
