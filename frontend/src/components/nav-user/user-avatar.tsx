import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserAvatarProps {
  user: User;
  showEmail?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({
  user,
  showEmail = true,
  size = "md",
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <>
      <Avatar className={`${sizeClasses[size]} rounded-lg`}>
        <AvatarFallback className="rounded-lg">
          {user?.firstName.charAt(0)}
          {user?.lastName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">
          {user?.firstName} {user?.lastName}
        </span>
        {showEmail && <span className="truncate text-xs">{user?.email}</span>}
      </div>
    </>
  );
}
