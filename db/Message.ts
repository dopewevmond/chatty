import { ObjectId, type Db } from "mongodb";

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
          messages: { $slice: ["$messages", 3] },
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
