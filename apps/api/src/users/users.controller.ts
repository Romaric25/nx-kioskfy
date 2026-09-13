import { Controller, Get, Post, Put, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Session, AuthGuard, Roles, Public, type UserSession } from "@thallesp/nestjs-better-auth";
import type { auth } from "../auth";
import { UsersService } from "./users.service";
import { CreatePartnershipDto, ConfirmEmailDto, ResendTokenDto, UpdatePhoneDto, SetPasswordDto } from "./dto/user.dto";

type AuthSession = UserSession<typeof auth>;

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("partnership")
  @Public()
  @ApiOperation({ summary: "Créer un compte partenaire" })
  createPartnership(@Body() dto: CreatePartnershipDto) {
    return this.usersService.createPartnership(dto);
  }

  @Post("confirm-email")
  @Public()
  @ApiOperation({ summary: "Vérifier l'email" })
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.usersService.verifyEmail(dto.token);
  }

  @Post("resend-token")
  @Public()
  @ApiOperation({ summary: "Renvoyer le token de vérification" })
  resendToken(@Body() dto: ResendTokenDto) {
    return this.usersService.resendToken(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Infos utilisateur connecté" })
  getMe(@Session() session: AuthSession) { return session.user; }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(["admin", "superadmin"])
  @ApiOperation({ summary: "Admin — Tous les utilisateurs" })
  getAll() { return this.usersService.getAll(); }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Utilisateur par ID" })
  getById(@Param("id") id: string) { return this.usersService.getById(id); }

  @Put("phone")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Mettre à jour le téléphone" })
  updatePhone(@Session() session: AuthSession, @Body() dto: UpdatePhoneDto) {
    return this.usersService.updatePhone(session.user.id, dto.phone);
  }

  @Post("password")
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Définir le mot de passe" })
  setPassword(@Session() session: AuthSession, @Body() dto: SetPasswordDto) {
    return this.usersService.setPassword(session.user.id, dto.password);
  }
}
