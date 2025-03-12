import { ObjectId, type Db, type Filter, type Document } from "mongodb";
import { findUserById } from "./User";

export const saveMessage = async (
  db: Db,
  senderId: string,
  recipientId: string,
  message: string
) => {
  const payload = {
    senderId,
    recipientId,
    message,
    timestamp: new Date(),
  };

  return db.collection("messages").insertOne({
    ...payload,
    _id: new ObjectId().toString() as unknown as ObjectId,
  });
};

export const getRecentChatsGroupedByUser = async (db: Db, userId: string) => {
  return db
    .collection("messages")
    .aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            otherUserId: {
              $cond: {
                if: { $eq: ["$senderId", userId] },
                then: "$recipientId",
                else: "$senderId",
              },
            },
          },
          messages: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          otherUserId: "$_id.otherUserId",
          messages: { $slice: ["$messages", 100] },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "otherUserId",
          foreignField: "_id",
          as: "otherUserDetails",
        },
      },
      {
        $addFields: {
          otherUserDetails: {
            $first: "$otherUserDetails",
          },
        },
      },
      {
        $project: {
          otherUserId: 0,
        },
      },
    ])
    .toArray();
};

export const getChatsAfterTimestamp = async (
  db: Db,
  userId: string,
  timestamp?: string,
) => {
  if (timestamp == null) {
    const userDetails = await findUserById(db, userId as unknown as ObjectId);
    if (userDetails == null) throw new Error("Could not fetch messages");
    timestamp = userDetails.createdAt;
  }

  const matchFilter: Filter<Document> = {
    $or: [{ senderId: userId }, { recipientId: userId }],
    timestamp: { $gt: new Date(timestamp) },
  };

  return db
    .collection("messages")
    .aggregate([
      { $match: matchFilter },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            otherUserId: {
              $cond: {
                if: { $eq: ["$senderId", userId] },
                then: "$recipientId",
                else: "$senderId",
              },
            },
          },
          messages: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "_id.otherUserId",
          foreignField: "_id",
          as: "otherUserDetails",
        },
      },
      {
        $addFields: {
          otherUserDetails: { $first: "$otherUserDetails" },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ])
    .toArray();
};
