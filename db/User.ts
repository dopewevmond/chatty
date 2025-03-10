import { ObjectId, type Db } from "mongodb";

export const createUserCollection = async (db: Db) => {
  await db.collection("user").createIndex({ username: 1 }, { unique: true });
};

export const createUser = async (
  db: Db,
  username: string,
  displayName: string
) => {
  return db.collection("user").insertOne({
    _id: new ObjectId().toString() as unknown as ObjectId,
    username,
    displayName,
    createdAt: new Date(),
  });
};

export const findUser = async (db: Db, username: string) => {
  return db.collection("user").findOne({ username });
};

export const searchUserByUsernameDisplayNameOrId = async (
  db: Db,
  query: string,
  excludeUserId?: string
) => {
  const regex = new RegExp(query, "i");
  const conditions: { [key: string]: RegExp | ObjectId | undefined }[] = [
    { username: regex },
    { displayName: regex },
    { _id: ObjectId.isValid(query) ? new ObjectId(query) : undefined },
  ];

  if (excludeUserId && ObjectId.isValid(excludeUserId)) {
    return db
      .collection("user")
      .find({
        $and: [
          { $or: conditions },
          { _id: { $ne: new ObjectId(excludeUserId) } },
        ],
      })
      .toArray();
  }

  return db
    .collection("user")
    .find({
      $or: conditions,
    })
    .toArray();
};
