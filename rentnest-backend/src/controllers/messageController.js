const Message = require('../models/Message');

exports.send = async (req, res, next) => {
  try {
    const { receiverId, propertyId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ ok: false, message: 'receiverId and content required' });
    const msg = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      property: propertyId || null,
      content
    });
    res.status(201).json({ ok: true, message: msg });
  } catch (e) { next(e); }
};

exports.thread = async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    const me = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: me, receiver: otherId },
        { sender: otherId, receiver: me }
      ]
    }).sort({ createdAt: 1 });
    res.json({ ok: true, messages });
  } catch (e) { next(e); }
};

exports.inbox = async (req, res, next) => {
  try {
    const me = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: me }, { receiver: me }]
    }).sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, messages });
  } catch (e) { next(e); }
};
