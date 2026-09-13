import { Global, Module } from "@nestjs/common";
import { db } from "./db";
import * as schema from "./schema";

export const DRIZZLE = "DRIZZLE";

@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: db }],
  exports: [DRIZZLE],
})
export class DrizzleModule {}

export { schema };
