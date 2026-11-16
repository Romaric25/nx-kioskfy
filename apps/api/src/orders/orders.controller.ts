import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Session, AuthGuard, Roles, type UserSession } from "@thallesp/nestjs-better-auth";
import type { Auth } from "../auth";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, BatchOrderDto, UpdatePaymentIdDto, PaginationQuery } from "./dto/order.dto";

type AuthSession = UserSession<Auth>;

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Admin — Toutes les commandes" })
  getAll(@Query() q: PaginationQuery) {
    return this.ordersService.getAll(q.limit ?? 50, q.offset ?? 0, q.status);
  }

  @Get("my")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Mes commandes" })
  getMy(@Session() session: AuthSession) {
    return this.ordersService.getByUserId(session.user.id);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Supprimer une commande en attente de paiement" })
  supprimer(@Session() session: AuthSession, @Param("id") id: string) {
    return this.ordersService.deletePending(session.user.id, id);
  }

  @Get("my/payeur-alias")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Dernier alias PI-SPI (payeur) utilisé par l'utilisateur" })
  getMyPayeurAlias(@Session() session: AuthSession) {
    return this.ordersService.getLastPayeurAlias(session.user.id);
  }

  @Get("check/:newspaperId")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Vérifier l'achat d'un journal" })
  async check(@Session() session: AuthSession, @Param("newspaperId") newspaperId: string) {
    return { hasPurchased: await this.ordersService.hasUserPurchased(session.user.id, newspaperId) };
  }

  @Get("organization/:organizationId/stats")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Stats d'une organisation" })
  getOrgStats(@Param("organizationId") orgId: string) {
    return this.ordersService.getOrganizationStats(orgId);
  }

  @Get("organization/:organizationId/orders")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Toutes les commandes d'une organisation" })
  getOrgOrders(@Param("organizationId") orgId: string) {
    return this.ordersService.getOrganizationOrders(orgId);
  }

  @Get("organization/:organizationId/customers")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Clients d'une organisation" })
  getOrgCustomers(@Param("organizationId") orgId: string) {
    return this.ordersService.getOrganizationCustomers(orgId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Créer une commande" })
  create(@Session() session: AuthSession, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(session.user.id, dto.newspaperId, dto.price);
  }

  @Post("batch")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Créer plusieurs commandes" })
  createBatch(@Session() session: AuthSession, @Body() dto: BatchOrderDto) {
    return this.ordersService.createBatch(session.user.id, dto.orders);
  }

  @Put("payment-id")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Mettre à jour le paymentId" })
  updatePaymentId(@Body() dto: UpdatePaymentIdDto) {
    return this.ordersService.updatePaymentIdBatch(dto.orderIds, dto.paymentId);
  }
}
