import { UserType } from "@/lib/types";
import { ObjectId, type Db } from "mongodb";

export const createUserCollection = async (db: Db) => {
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
};

export const createUser = async (
  db: Db,
  username: string,
  displayName: string
) => {
  return db.collection("users").insertOne({
    _id: new ObjectId().toString() as unknown as ObjectId,
    username,
    displayName,
    createdAt: new Date().toISOString(),
  });
};

export const findUserByUsername = async (db: Db, username: string) => {
  return db.collection("users").findOne<UserType>({ username });
};

export const findUserById = async (db: Db, _id: ObjectId) => {
  return db.collection("users").findOne<UserType>({ _id });
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
      .collection("users")
      .find({
        $and: [
          { $or: conditions },
          { _id: { $ne: excludeUserId as unknown as ObjectId } },
        ],
      })
      .toArray();
  }

  return db
    .collection("users")
    .find({
      $or: conditions,
    })
    .toArray();
};
