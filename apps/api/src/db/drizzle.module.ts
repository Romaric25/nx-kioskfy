import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DrizzleModule as NestDrizzleModule, getDrizzleToken } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Token historique utilisé par les services (`@Inject(DRIZZLE)`) : alias de
 * la base enregistrée par `@nestjs/drizzle` (token `default`). Les services
 * existants continuent de fonctionner sans changement, et on peut aussi
 * utiliser `@InjectDrizzle()` directement.
 */
export const DRIZZLE = "DRIZZLE";

/**
 * Enregistrement de la base via le module NestJS officiel `@nestjs/drizzle` :
 * la connexion est créée une seule fois par instance d'application, dans la
 * factory async (donc APRÈS que `ConfigModule.forRoot()` ait chargé le `.env`),
 * et elle est fermée proprement à l'arrêt de l'application.
 */
@Global()
@Module({
  imports: [
    NestDrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = mysql.createPool({
          uri: configService.getOrThrow<string>("DATABASE_URL"),
          connectionLimit: 10,
          waitForConnections: true,
          // Le serveur MySQL distant (ou le pare-feu) coupe les connexions
          // restées inactives : le keep-alive TCP maintient le pool en vie
          // et évite les ECONNRESET en pleine requête.
          enableKeepAlive: true,
          keepAliveInitialDelay: 10_000,
        });
        // Une connexion inutilisée tuée par le serveur ne doit pas faire
        // planter le process : le pool la remplace à la prochaine requête.
        // `pool.pool` est le Pool sous-jacent (EventEmitter) : le PromisePool
        // de mysql2 n'expose que l'événement "enqueue" dans ses typages.
        pool.pool.on("error", (err) => {
          const code = (err as { code?: string })?.code;
          if (code !== "ECONNRESET" && code !== "PROTOCOL_CONNECTION_LOST") {
            console.error("[drizzle] erreur de pool MySQL :", err);
          }
        });
        const db = drizzle(pool, { schema, mode: "default" });
        return { db };
      },
    }),
  ],
  providers: [{ provide: DRIZZLE, useExisting: getDrizzleToken() }],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
