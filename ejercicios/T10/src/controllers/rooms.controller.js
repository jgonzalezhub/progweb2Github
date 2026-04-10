import { roomsModel, messagesModel } from '../models/index.js';
import { handleHttpError } from '../utils/handleError.js';

export const getRooms = async (req, res) => {
  try {
    const rooms = await roomsModel.find({}).populate('creator', 'name email');
    res.json({ data: rooms });
  } catch (err) { handleHttpError(res, 'ERROR_GET_ROOMS'); }
};

export const createRoom = async (req, res) => {
  try {
    const room = await roomsModel.create({ ...req.body, creator: req.user._id });
    await room.populate('creator', 'name email');
    res.status(201).json({ data: room });
  } catch (err) { handleHttpError(res, 'ERROR_CREATE_ROOM'); }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      messagesModel
        .find({ room: id })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      messagesModel.countDocuments({ room: id })
    ]);

    res.json({
      data: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) { handleHttpError(res, 'ERROR_GET_MESSAGES'); }
};
