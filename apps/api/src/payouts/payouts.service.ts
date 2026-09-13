import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PayoutsService {
  constructor(private readonly config: ConfigService) {}

  private get host() { return this.config.getOrThrow<string>("MONEROO_HOST"); }
  private get secretKey() { return this.config.getOrThrow<string>("MONEROO_SECRET_KEY"); }

  async initializePayout(body: any) {
    const res = await fetch(`${this.host}/payouts/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.secretKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }

  async verifyPayout(payoutId: string) {
    const res = await fetch(`${this.host}/payouts/${payoutId}/verify`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (!res.ok) throw new Error(`Moneroo API Error: ${await res.text()}`);
    return res.json();
  }
}
