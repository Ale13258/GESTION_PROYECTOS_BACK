import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/seed.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FilesModule } from './modules/files/files.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ComparisonsModule } from './modules/comparisons/comparisons.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = String(config.get<string>('DB_HOST', 'localhost') ?? 'localhost');
        const local = host === 'localhost' || host === '127.0.0.1';
        const pooler = host.includes('pooler.supabase.com');
        const production = config.get<string>('NODE_ENV') !== 'development';
        return {
          type: 'postgres' as const,
          host,
          port: pooler && production ? 6543 : Number(config.get<string>('DB_PORT', '5432')),
          username: String(config.get<string>('DB_USER', 'promanage') ?? 'promanage'),
          password: String(config.get<string>('DB_PASSWORD', 'promanage') ?? 'promanage'),
          database: String(config.get<string>('DB_NAME', 'promanage') ?? 'promanage'),
          ssl: local ? false : { rejectUnauthorized: false },
          autoLoadEntities: true,
          synchronize: !production,
          logging: !production,
          retryAttempts: 2,
          retryDelay: 2000,
          extra: local
            ? undefined
            : {
                max: 1,
                idleTimeoutMillis: 5000,
                family: 4,
                connectionTimeoutMillis: 15000,
              },
        };
      },
    }),
    DatabaseModule,
    CommonModule,
    FilesModule,
    AuthModule,
    UsersModule,
    CatalogsModule,
    ProjectsModule,
    DocumentsModule,
    EquipmentModule,
    SuppliersModule,
    QuotationsModule,
    ApprovalsModule,
    ComparisonsModule,
    ReportsModule,
    HealthModule,
    NotificationsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
