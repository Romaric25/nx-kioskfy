import { Module, type OnModuleInit } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Assure que les paramètres par défaut du site existent toujours : la page
   * « Paramètres » de l'admin est utilisable sans initialisation manuelle.
   * Idempotent : ne touche pas aux valeurs existantes.
   */
  async onModuleInit(): Promise<void> {
    try {
      const created = await this.settingsService.seed();
      if (created > 0) {
        console.log(`[settings] ${created} paramètre(s) de site initialisé(s)`);
      }
    } catch (error) {
      console.error('[settings] Échec du seed des paramètres de site :', error);
    }
  }
}
