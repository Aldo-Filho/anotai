import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { UsersController } from "./users/users.controller";
import { JwtGuard } from "./auth/jwt.guard";
import { CsrfGuard } from "./auth/csrf.guard";
import { UsersService } from "./users/users.service";
import { CategoriesService } from "./categories/categories.service";
import { CategoriesController } from "./categories/categories.controller";
import { TransactionsService } from "./transactions/transactions.service";
import { TransactionsController } from "./transactions/transactions.controller";
import { ReportsController } from "./reports/reports.controller";
import { BillsController } from "./bills/bills.controller";
import { BillsService } from "./bills/bills.service";
@Module({
  controllers: [
    AuthController,
    UsersController,
    CategoriesController,
    TransactionsController,
    ReportsController,
    BillsController,
  ],
  providers: [
    PrismaService,
    AuthService,
    JwtGuard,
    CsrfGuard,
    UsersService,
    CategoriesService,
    TransactionsService,
    BillsService,
  ],
})
export class AppModule {}
