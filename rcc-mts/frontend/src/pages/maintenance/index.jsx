import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Home, Ticket } from "lucide-react";
import { MaintenanceHome } from "./home";
import { TicketManagement } from "./ticket-management";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import mtsLogo from "@/assets/image.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function MaintenancePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("tickets") ? "tickets" : "home"
  );

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Potentially navigate to the ticket details page
    // navigate(`/tickets/${notification.ticket_id}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "home") {
      navigate("/maintenance");
    } else if (tab === "tickets") {
      navigate("/maintenance/tickets");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Horizontal Navigation Bar */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <img src={mtsLogo} alt="MTS Logo" className="h-8 w-auto" />
          </div>

          {/* Center - Empty space to push items to the right */}
          <div className="flex-grow"></div>

          {/* Right side - Navigation buttons and profile */}
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === "home" ? "default" : "ghost"}
              onClick={() => handleTabChange("home")}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 h-12"
            >
              <Home className="h-4 w-4" />
              <span className="font-bold">HOME</span>
            </Button>

            <Button
              variant={activeTab === "tickets" ? "default" : "ghost"}
              onClick={() => handleTabChange("tickets")}
              className="flex items-center gap-2 bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 h-12"
            >
              <Ticket className="h-4 w-4" />
              <span className="font-bold">TICKET</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-bold">Notifications</div>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onSelect={() => handleNotificationClick(notification)}
                      className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800">
                          {notification.message}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                )}
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={markAllAsRead} className="cursor-pointer justify-center">
                      Mark all as read
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile with Notification Dot */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className={"h-12 w-12 cursor-pointer"}>
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6">
        <Card className="flex-1">
          <CardContent className="p-0">
            {activeTab === "home" && <MaintenanceHome />}
            {activeTab === "tickets" && <TicketManagement />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
