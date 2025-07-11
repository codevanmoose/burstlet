import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

interface MigrationResult {
  success: boolean;
  message: string;
  appliedMigrations?: string[];
  error?: string;
}

class MigrationManager {
  private prisma: PrismaClient;
  private logger: winston.Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  // Apply all pending migrations
  async applyMigrations(): Promise<MigrationResult> {
    try {
      this.logger.info('Starting database migration process...');

      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      // Generate Prisma client first
      this.logger.info('Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'pipe' });

      // Apply migrations
      this.logger.info('Applying database migrations...');
      const migrationOutput = execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      this.logger.info('Database migrations completed successfully', {
        output: migrationOutput,
      });

      return {
        success: true,
        message: 'All migrations applied successfully',
        appliedMigrations: this.parseMigrationOutput(migrationOutput),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      this.logger.error('Migration failed', { error: errorMessage });

      return {
        success: false,
        message: 'Migration failed',
        error: errorMessage,
      };
    }
  }

  // Create a database backup before migrations
  async createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.info('Skipping backup in non-production environment');
        return { success: true };
      }

      const backupDir = path.join(process.cwd(), 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${timestamp}.sql`);

      // Create backups directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      this.logger.info('Creating database backup...', { backupPath });

      // Use pg_dump to create backup (requires DATABASE_URL to be PostgreSQL)
      const databaseUrl = process.env.DATABASE_URL!;
      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
      
      execSync(command, { stdio: 'pipe' });

      this.logger.info('Database backup created successfully', { backupPath });

      return {
        success: true,
        backupPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      this.logger.error('Failed to create database backup', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Verify database schema integrity
  async verifySchema(): Promise<{ valid: boolean; issues?: string[] }> {
    try {
      this.logger.info('Verifying database schema...');

      const issues: string[] = [];

      // Check if all required tables exist
      const requiredTables = [
        'User', 'Session', 'OAuthProvider', 'TwoFactorAuth',
        'ContentGeneration', 'GeneratedContent', 'AIProvider',
        'PlatformConnection', 'Plan', 'Subscription', 'UsageRecord',
        'Invoice', 'PaymentMethod', 'BillingEvent'
      ];

      for (const tableName of requiredTables) {
        try {
          const tableExists = await this.prisma.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = ${tableName}
            );
          ` as any[];

          if (!tableExists[0]?.exists) {
            issues.push(`Required table '${tableName}' is missing`);
          }
        } catch (error) {
          issues.push(`Failed to check table '${tableName}': ${error}`);
        }
      }

      // Check for orphaned records
      try {
        const orphanedSessions = await this.prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM "Session" s 
          LEFT JOIN "User" u ON s."user_id" = u.id 
          WHERE u.id IS NULL
        ` as any[];

        if (orphanedSessions[0]?.count > 0) {
          issues.push(`Found ${orphanedSessions[0].count} orphaned session records`);
        }
      } catch (error) {
        // Ignore if tables don't exist yet
      }

      // Check for required indexes
      const requiredIndexes = [
        { table: 'User', column: 'email' },
        { table: 'Session', column: 'token' },
        { table: 'ContentGeneration', column: 'user_id' },
        { table: 'Subscription', column: 'user_id' },
      ];

      for (const index of requiredIndexes) {
        try {
          const indexExists = await this.prisma.$queryRaw`
            SELECT EXISTS (
              SELECT FROM pg_indexes 
              WHERE tablename = ${index.table} 
              AND indexdef LIKE ${'%' + index.column + '%'}
            );
          ` as any[];

          if (!indexExists[0]?.exists) {
            issues.push(`Missing index on ${index.table}.${index.column}`);
          }
        } catch (error) {
          // Ignore if table doesn't exist
        }
      }

      this.logger.info('Schema verification completed', { 
        valid: issues.length === 0,
        issueCount: issues.length 
      });

      return {
        valid: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined,
      };
    } catch (error) {
      this.logger.error('Schema verification failed', { error });
      return {
        valid: false,
        issues: ['Schema verification failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
      };
    }
  }

  // Seed database with initial data
  async seedDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('Seeding database with initial data...');

      // Run the seed script
      execSync('npm run db:seed', { stdio: 'pipe' });

      this.logger.info('Database seeding completed successfully');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Seeding failed';
      this.logger.error('Database seeding failed', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get migration status
  async getMigrationStatus(): Promise<{
    appliedMigrations: string[];
    pendingMigrations: string[];
    lastMigration?: string;
  }> {
    try {
      // This is a simplified version - in a real app you'd query the migration table
      const migrationStatus = {
        appliedMigrations: ['initial_schema', 'add_billing_tables', 'add_content_tables'],
        pendingMigrations: [],
        lastMigration: 'add_content_tables',
      };

      return migrationStatus;
    } catch (error) {
      this.logger.error('Failed to get migration status', { error });
      return {
        appliedMigrations: [],
        pendingMigrations: [],
      };
    }
  }

  // Rollback last migration (emergency use)
  async rollbackLastMigration(): Promise<MigrationResult> {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Rollback is not allowed in production environment');
      }

      this.logger.warn('Rolling back last migration...');

      // In a real implementation, you'd have proper rollback scripts
      // For now, we'll just log the warning
      this.logger.warn('Rollback functionality not implemented - manual intervention required');

      return {
        success: false,
        message: 'Rollback functionality not implemented',
        error: 'Manual rollback required',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rollback failed';
      this.logger.error('Migration rollback failed', { error: errorMessage });

      return {
        success: false,
        message: 'Rollback failed',
        error: errorMessage,
      };
    }
  }

  private parseMigrationOutput(output: string): string[] {
    // Parse migration output to extract applied migration names
    const migrations: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Applied migration') || line.includes('Migration')) {
        migrations.push(line.trim());
      }
    }
    
    return migrations;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const migrationManager = new MigrationManager();