import { Controller, Get } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * Endpoint de vie pour les healthchecks (Docker/Coolify). Public : le
   * guard global better-auth ne doit pas exiger de session pour sonder
   * l'état du processus.
   */
  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
