import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let db: MySql2Database<typeof schema>;

export async function createDatabaseConnection(
  databaseUrl: string,
): Promise<MySql2Database<typeof schema>> {
  if (db) return db;

  const connection = await mysql.createConnection(databaseUrl);
  db = drizzle(connection, { schema, mode: "default" });
  return db;
}

export function getDatabase(): MySql2Database<typeof schema> {
  if (!db) {
    throw new Error(
      "Database not initialized. Call createDatabaseConnection() first.",
    );
  }
  return db;
}

export { schema };
export type Database = MySql2Database<typeof schema>;
