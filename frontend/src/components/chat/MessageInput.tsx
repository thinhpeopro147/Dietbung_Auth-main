import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn, tối đa 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImgPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!value.trim() && !imgPreview) return;
    const currValue = value;
    const currImg = imgPreview;
    setValue("");
    setImgPreview(null);
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue, currImg || undefined);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, currImg || undefined);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-background">
      {imgPreview && (
        <div className="relative w-20 h-20">
          <img src={imgPreview} className="w-20 h-20 object-cover rounded-lg border" />
          <button
            onClick={() => setImgPreview(null)}
            className="absolute -top-1 -right-1 size-5 bg-destructive rounded-full flex items-center justify-center"
          >
            <X className="size-3 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 min-h-[56px]">
        <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-md hover:bg-primary/10">
          <ImagePlus className="size-4" />
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />

        <div className="flex-1 relative">
          <Input
            onKeyDown={handleKeyDown}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-10 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <EmojiPicker onChange={(emoji) => setValue(`${value}${emoji}`)} />
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={!value.trim() && !imgPreview}
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;