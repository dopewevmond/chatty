import { ObjectId, type Db } from "mongodb";

export const saveAIMessage = async (
  db: Db,
  userId: string,
  modelName: string | null,
  message: string
) => {
  const payload = {
    userId,
    modelName,
    message,
    timestamp: new Date(),
  };

  return db.collection("aiMessages").insertOne({
    ...payload,
    _id: new ObjectId().toString() as unknown as ObjectId,
  });
};

export const getAIMessages = async (db: Db, userId: string) => {
  return db
    .collection("aiMessages")
    .find({ userId })
    .sort("timestamp", -1)
    .limit(100)
    .toArray();
};

export const getAIMessagesAfterTimestamp = async (
  db: Db,
  userId: string,
  timestamp: string
) => {
  return db.collection("aiMessages").find({
    $and: [{ userId }, { timestamp: { $gt: timestamp } }],
  });
};
