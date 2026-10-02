import { Conversation, Hostel, Message, User } from '../models/index.js';
import { conversationFor, sendMessage } from '../services/chat.js';
import { HttpError } from '../middleware/http.js';

export async function create(req, res) {
  const hostel = await Hostel.findOne({ _id: req.validated.body.hostelId, status: 'APPROVED', deletedAt: null });
  if (!hostel || !await User.exists({ _id: hostel.owner, active: true })) throw new HttpError(404, 'Hostel not found');
  const filter = { hostel: hostel._id, student: req.user._id };
  let conversation;
  try {
    conversation = await Conversation.findOneAndUpdate(filter, { $setOnInsert: { ...filter, owner: hostel.owner } }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    conversation = await Conversation.findOne(filter);
  }
  res.status(201).json({ data: conversation });
}
export async function list(req, res) {
  const { page, limit } = req.validated.query;
  const conversations = await Conversation.find({ $or: [{ student: req.user._id }, { owner: req.user._id }] }).populate('student owner', 'name').populate('hostel', 'name').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  const data = await Promise.all(conversations.map(async conversation => ({
    ...conversation,
    unreadCount: await Message.countDocuments({ conversation: conversation._id, recipient: req.user._id, readAt: null }),
    lastMessage: await Message.findOne({ conversation: conversation._id }).sort({ _id: -1 }).lean(),
  })));
  const total = await Conversation.countDocuments({ $or: [{ student: req.user._id }, { owner: req.user._id }] });
  res.json({ data, pagination: { page, limit, total } });
}
export async function messages(req, res) {
  await conversationFor(req.params.id, req.user);
  const { before, limit } = req.validated.query;
  const data = await Message.find({ conversation: req.params.id, ...(before && { _id: { $lt: before } }) }).sort({ _id: -1 }).limit(limit);
  res.json({ data: data.reverse(), nextCursor: data.length === limit ? String(data[0]._id) : null });
}
export async function send(req, res) {
  res.status(201).json({ data: await sendMessage(req.params.id, req.user, req.validated.body.text, req.app.get('io')) });
}
export async function read(req, res) {
  const conversation = await conversationFor(req.params.id, req.user);
  const through = await Message.findOne({ _id: req.validated.body.through, conversation: conversation._id });
  if (!through) throw new HttpError(404, 'Message not found');
  const readAt = new Date();
  await Message.updateMany({ conversation: conversation._id, recipient: req.user._id, readAt: null, _id: { $lte: through._id } }, { $set: { readAt } });
  req.app.get('io')?.to(`user:${conversation.student}`).to(`user:${conversation.owner}`).emit('messages:read', { conversationId: conversation.id, userId: req.user.id, through: through.id, readAt });
  res.status(204).end();
}
