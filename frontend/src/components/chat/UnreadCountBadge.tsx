import { Badge } from "../ui/badge";

const UnreadCountBadge = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="pulse-ring">
      <Badge className="size-5 text-xs bg-gradient-chat border border-background flex items-center justify-center">
        {unreadCount > 9 ? "9+" : unreadCount}
      </Badge>
    </div>
  );
};

export default UnreadCountBadge;