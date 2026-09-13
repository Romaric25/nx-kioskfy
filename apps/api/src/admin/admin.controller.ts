import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard, Roles } from "@thallesp/nestjs-better-auth";
import { AdminService } from "./admin.service";

@ApiTags("Admin")
@Controller("admin/stats")
@UseGuards(AuthGuard)
@Roles(["admin", "superadmin"])
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: "Stats du dashboard admin" })
  getStats() {
    return this.adminService.getDashboardStats();
  }
}
