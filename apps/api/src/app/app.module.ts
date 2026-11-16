import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowModule } from '@workflow/nest';
import { ConfigModule } from '@nestjs/config';
import { getDrizzleToken } from '@nestjs/drizzle';
import configuration from '../config/configuration';
import { DrizzleModule } from '../db';
import type { Database } from '../db';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from '../auth';

import { ImageProcessorModule } from '../image-processor/image-processor.module';
import { AdminModule } from '../admin/admin.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { SettingsModule } from '../settings/settings.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersModule } from '../orders/orders.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NewspapersModule } from '../newspapers/newspapers.module';
import { CategoriesModule } from '../categories/categories.module';
import { CountriesModule } from '../countries/countries.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      load: [configuration],
    }),
    DrizzleModule,
    ImageProcessorModule,
    AdminModule,
    CountriesModule,
    CategoriesModule,
    FavoritesModule,
    NewspapersModule,
    OrdersModule,
    OrganizationsModule,
    PaymentsModule,
    PayoutsModule,
    SettingsModule,
    UploadsModule,
    UsersModule,
    WithdrawalsModule,
    WebhooksModule,
    WorkflowModule.forRoot({
      moduleType: 'commonjs',
      distDir: 'dist',
    }),
    AuthModule.forRootAsync({
      // La factory s'exécute après l'instanciation de la base (ConfigModule
      // puis DrizzleModule) : better-auth partage donc la même instance
      // Drizzle que le reste de l'application.
      inject: [getDrizzleToken()],
      useFactory: (db: Database) => ({
        auth: createAuth(db),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
