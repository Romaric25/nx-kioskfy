import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowModule } from '@workflow/nest';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DrizzleModule } from '../db';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth';

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
    WorkflowModule.forRoot({
      moduleType: 'commonjs',
      distDir: 'dist',
    }),
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
