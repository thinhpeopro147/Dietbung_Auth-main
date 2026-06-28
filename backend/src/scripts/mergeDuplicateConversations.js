import mongoose from "mongoose";
import dotenv from "dotenv";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getDirectKey } from "../utils/conversationHelper.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
  console.log("Đã kết nối DB");

  const directConvos = await Conversation.find({ type: "direct" }).lean();
  console.log(`Tìm thấy ${directConvos.length} direct conversation`);
  const groups = new Map();

  for (const convo of directConvos) {
    if (!convo.participants || convo.participants.length !== 2) {
      console.log(`  Bỏ qua conversation ${convo._id} (participants không hợp lệ)`);
      continue;
    }

    const [a, b] = convo.participants.map((p) => p.userId.toString());
    const key = getDirectKey(a, b);

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(convo);
  }

  let mergedGroups = 0;
  let deletedConvos = 0;
  let movedMessages = 0;
  let backfilled = 0;

  for (const [key, convos] of groups.entries()) {
    if (convos.length === 1) {
      // Không trùng, chỉ cần backfill directKey nếu chưa có
      if (!convos[0].directKey) {
        await Conversation.updateOne(
          { _id: convos[0]._id },
          { $set: { directKey: key } }
        );
        backfilled++;
      }
      continue;
    }

    mergedGroups++;
    convos.sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.updatedAt || 0) -
        new Date(a.lastMessageAt || a.updatedAt || 0)
    );

    const keep = convos[0];
    const duplicates = convos.slice(1);

    console.log(
      `\nCặp user ${key}: tìm thấy ${convos.length} conversation trùng.` +
        ` Giữ lại ${keep._id} (lastMessageAt mới nhất), gộp ${duplicates.length} cái còn lại vào đó.`
    );

    for (const dup of duplicates) {
      const moveResult = await Message.updateMany(
        { conversationId: dup._id },
        { $set: { conversationId: keep._id } }
      );
      movedMessages += moveResult.modifiedCount || 0;
      console.log(
        `  - Đã chuyển ${moveResult.modifiedCount || 0} tin nhắn từ ${dup._id} sang ${keep._id}`
      );

      await Conversation.deleteOne({ _id: dup._id });
      deletedConvos++;
      console.log(`  - Đã xoá conversation trùng ${dup._id}`);
    }

    const latestMessage = await Message.findOne({ conversationId: keep._id })
      .sort({ createdAt: -1 })
      .lean();

    if (latestMessage) {
      await Conversation.updateOne(
        { _id: keep._id },
        {
          $set: {
            directKey: key,
            lastMessageAt: latestMessage.createdAt,
            lastMessage: {
              _id: latestMessage._id.toString(),
              content: latestMessage.content ?? null,
              senderId: latestMessage.senderId,
              createdAt: latestMessage.createdAt,
            },
          },
        }
      );
    } else {
      await Conversation.updateOne(
        { _id: keep._id },
        { $set: { directKey: key } }
      );
    }
  }

  console.log("\n===== TỔNG KẾT =====");
  console.log(`Số cặp user bị trùng đã gộp: ${mergedGroups}`);
  console.log(`Số conversation trùng đã xoá: ${deletedConvos}`);
  console.log(`Số tin nhắn đã chuyển sang conversation giữ lại: ${movedMessages}`);
  console.log(`Số conversation backfill directKey (không trùng): ${backfilled}`);

  await mongoose.disconnect();
  console.log("Xong, đã đóng kết nối DB.");
};

run().catch((err) => {
  console.error("Lỗi khi chạy script:", err);
  process.exit(1);
});
