import { Db, MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var mongo: { client?: MongoClient };
}

global.mongo = global.mongo || {};

export const connectToDB = async () => {
  if (!global.mongo.client) {
    global.mongo.client = new MongoClient(process.env.DATABASE_URL!, {
      connectTimeoutMS: 10000,
      appName: "chatty",
    });
    await global.mongo.client.connect();
  }

  const db: Db = global.mongo.client.db("chatty");

  return { db, dbClient: global.mongo.client };
};
