import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Building2, LayoutGrid, Users, Package, Bell, Home } from "lucide-react";
import image from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { ViewTicketDialog } from "@/components/ticket-management";

export function TopBar() {
  const { user, logout } = useAuth();
  const { notifications, markAllAsRead, markAsRead } = useNotification();
  const location = useLocation();
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Use the ticket_id from the notification data
    if (notification.ticket_id) {
      setSelectedTicketId(notification.ticket_id);
      setViewTicketDialogOpen(true);
    }
  };

  const renderNavLinks = () => {
    switch (user?.role) {
      case "admin":
        return (
          <>
            <Link
              to="/admin/home"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/home")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link
              to="/admin/users"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/users")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Users className="h-5 w-5" />
              User Management
            </Link>
            <Link
              to="/admin/departments"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/departments")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Building2 className="h-5 w-5" />
              Department Management
            </Link>
            <Link
              to="/admin/categories"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/categories")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              Category Management
            </Link>
            <Link
              to="/admin/subcategories"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/subcategories")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              Sub-Category Management
            </Link>
            <Link
              to="/admin/statuses"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/statuses")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              Status Management
            </Link>
            <Link
              to="/admin/assets"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/assets")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Package className="h-5 w-5" />
              Asset Management
            </Link>
            <Link
              to="/admin/pc-parts"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/pc-parts")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              PC Parts Management
            </Link>
            <Link
              to="/admin/tickets"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/tickets")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Ticket Management
            </Link>
            <Link
              to="/admin/reports"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/admin/reports")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Report Management
            </Link>
          </>
        );
      case "faculty/staff":
        return (
          <>
            <Link
              to="/faculty-staff"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/faculty-staff")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link
              to="/faculty-staff/tickets"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/faculty-staff/tickets")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              My Tickets
            </Link>
          </>
        );
      case "maintenance":
        return (
          <>
            <Link
              to="/maintenance"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/maintenance")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link
              to="/maintenance/tickets"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/maintenance/tickets")
                  ? "bg-gray-900 text-white dark:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              My Tickets
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-16 w-full items-center justify-between bg-white px-4 md:px-6 border-b-2 border-blue-500">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-12 w-12" variant="ghost">
            <Menu className="size-8 text-black" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetDescription className="sr-only">Top Bar</SheetDescription>
          <SheetTitle className="sr-only">Image</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-center p-6">
              <Link to="/admin/home">
                <img src={image} alt="MTS" className="h-12" />
              </Link>
            </div>
            <Separator />
            <nav className="flex-1 space-y-1 p-4">{renderNavLinks()}</nav>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Link to="/admin/home">
          <img src={image} alt="MTS" className="h-14" />
        </Link>
      </div>
      <div className="flex items-center gap-4">
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
        <div className="text-right">
          <p className="text-sm font-medium">{user?.name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role || "faculty-staff"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className={"h-10 w-10 cursor-pointer"}>
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
      </div>    <ViewTicketDialog 
      ticketId={selectedTicketId} 
      open={viewTicketDialogOpen} 
      onOpenChange={setViewTicketDialogOpen} 
    />
    </div>

  );
}
