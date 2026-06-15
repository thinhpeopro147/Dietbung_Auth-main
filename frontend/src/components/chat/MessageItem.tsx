import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000;

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );

  return (
    <>
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Dietbung"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          <Card
            className={cn(
              "p-3",
              message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
            )}
          >
            {message.imgUrl && (
              <img
                src={message.imgUrl}
                alt="image"
                className="max-w-xs rounded-lg mb-2 cursor-pointer"
                onClick={() => window.open(message.imgUrl!, "_blank")}
              />
            )}
            {message.content && (
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            )}
          </Card>

          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
              <>
              {console.log("seenBy:", JSON.stringify(selectedConvo.seenBy))}
              {console.log("participants:", JSON.stringify(selectedConvo.participants))}
                {selectedConvo.type === "group" ? (
                  <div className="flex items-center gap-0.5">
                    {selectedConvo.seenBy
                      .filter((s) => {
                        const id = typeof s === "string" ? s : s._id;
                        return id !== message.senderId;
                      })
                      .map((s) => {
                        const id = typeof s === "string" ? s : s._id;
                        const participant = selectedConvo.participants.find(
                          (p) => p._id === id
                        );
                        return (
                          <UserAvatar
                            key={id}
                            type="chat"
                            name={participant?.displayName ?? ""}
                            avatarUrl={participant?.avatarUrl ?? undefined}
                            className="size-1"
                          />
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {lastMessageStatus === "seen" ? (
                      selectedConvo.seenBy
                        .filter((s) => {
                          const id = typeof s === "string" ? s : s._id;
                          return id !== message.senderId;
                        })
                        .map((s) => {
                          const id = typeof s === "string" ? s : s._id;
                          const participant = selectedConvo.participants.find(
                            (p) => p._id === id
                          );
                          return (
                            <UserAvatar
                              key={id}
                              type="chat"
                              name={participant?.displayName ?? ""}
                              avatarUrl={participant?.avatarUrl ?? undefined}
                              className="size-1"
                            />
                          );
                        })
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 h-4 border-0 bg-muted text-muted-foreground"
                      >
                        delivered
                      </Badge>
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </>
  );
};

export default MessageItem; 