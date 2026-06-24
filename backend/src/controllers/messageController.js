import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { getDirectKey } from "../utils/conversationHelper.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;

    let conversation;
    let isNewConversation = false;

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc ảnh" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    const directKey = recipientId ? getDirectKey(senderId, recipientId) : null;

    // Nếu conversationId không tồn tại nữa (VD: 1 trong 2 người vừa xoá
    // cuộc trò chuyện), tìm lại direct conversation đã có giữa 2 người này
    // trước khi tạo mới, tránh sinh ra nhiều conversation trùng cho cùng 1 cặp user
    if (!conversation && directKey) {
      conversation = await Conversation.findOne({ type: "direct", directKey });
    }

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          type: "direct",
          directKey,
          participants: [
            { userId: senderId, joinedAt: new Date() },
            { userId: recipientId, joinedAt: new Date() },
          ],
          lastMessageAt: new Date(),
          unreadCounts: new Map(),
        });
        isNewConversation = true;
      } catch (err) {
        // Race condition: 2 request gửi gần nhau cùng lúc tạo conversation
        // cho cùng cặp user -> bị unique index chặn (mã lỗi 11000).
        // Lấy lại conversation vừa được tạo bởi request kia để dùng tiếp,
        // không coi đây là "vừa tạo mới" để tránh báo new-group 2 lần.
        if (err?.code === 11000) {
          conversation = await Conversation.findOne({ type: "direct", directKey });
        } else {
          throw err;
        }
      }
    }

     const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
      imgUrl, 
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    // Conversation vừa được tạo mới (lần đầu chat, hoặc do conversation cũ
    // đã bị xoá) -> báo realtime cho cả 2 người để FE thêm ngay vào danh sách
    // và tự join room, không cần load lại trang mới thấy
    if (isNewConversation) {
      await conversation.populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      });

      const participants = conversation.participants.map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      const formatted = { ...conversation.toObject(), participants };

      conversation.participants.forEach((p) => {
        io.to(p.userId._id.toString()).emit("new-group", formatted);
      });
    }

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      imgUrl,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};