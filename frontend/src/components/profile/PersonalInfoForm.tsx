import { Heart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useState } from "react";
import { toast } from "sonner";

type Props = { userInfo: User | null };

const PersonalInfoForm = ({ userInfo }: Props) => {
  const [formData, setFormData] = useState({
    displayName: userInfo?.displayName ?? "",
    email: userInfo?.email ?? "",
    phone: userInfo?.phone ?? "",
    bio: userInfo?.bio ?? "",
  });

  if (!userInfo) return null;

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // TODO: gọi API update profile
      toast.success("Cập nhật thành công!");
    } catch {
      toast.error("Cập nhật không thành công!");
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tên hiển thị</Label>
            <Input value={formData.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tên người dùng</Label>
            <Input value={userInfo.username} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userInfo.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Số điện thoại</Label>
            <Input value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Giới thiệu</Label>
          <Textarea rows={3} value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="resize-none" />
        </div>

        <Button onClick={handleSave} className="w-full md:w-auto bg-gradient-primary hover:opacity-90">
          Lưu thay đổi
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;