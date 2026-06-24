export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  const payload = {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  };

  // Emit vào cả room của conversation lẫn room cá nhân (userId) của từng
  // participant. Room cá nhân luôn được join sẵn lúc connect socket, nên
  // đảm bảo người nhận luôn có tin nhắn realtime kể cả khi họ chưa kịp
  // join room conversation (VD: conversation vừa được tạo lại do cuộc
  // trò chuyện cũ bị xoá). io.to() nhận nhiều room và tự loại trùng
  // socket nên không lo bị nhận 2 lần.
  const rooms = [
    conversation._id.toString(),
    ...conversation.participants.map((p) =>
      (p.userId?._id ?? p.userId).toString()
    ),
  ];

  io.to(rooms).emit("new-message", payload);
};