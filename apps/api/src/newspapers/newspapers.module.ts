import { Module } from '@nestjs/common';
import { NewspapersService } from './newspapers.service';
import { NewspapersController } from './newspapers.controller';

@Module({
  controllers: [NewspapersController],
  providers: [NewspapersService],
})
export class NewspapersModule {}
