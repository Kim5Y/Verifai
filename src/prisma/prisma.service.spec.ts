describe('PrismaService', () => {
  it('throws when DATABASE_URL is missing', () => {
    // Arrange
    const originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    jest.resetModules();
    jest.doMock('dotenv/config', () => ({}));

    // Act + Assert
    expect(() => {
      const { PrismaService } = require('./prisma.service') as typeof import('./prisma.service');
      new PrismaService();
    }).toThrow('DATABASE_URL is required to initialize PrismaService.');

    // Cleanup
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('connects on init and disconnects/ends pool on destroy', async () => {
    // Arrange
    jest.resetModules();
    jest.doMock('dotenv/config', () => ({}));

    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

    const connect = jest.fn();
    const disconnect = jest.fn();
    const end = jest.fn();

    jest.doMock('@prisma/client', () => ({
      PrismaClient: class PrismaClient {
        $connect = connect;
        $disconnect = disconnect;
      },
    }));
    jest.doMock('pg', () => ({
      Pool: class Pool {
        end = end;
        constructor(_opts: unknown) {}
      },
    }));
    jest.doMock('@prisma/adapter-pg', () => ({
      PrismaPg: class PrismaPg {
        constructor(_pool: unknown) {}
      },
    }));

    const { PrismaService } = require('./prisma.service') as typeof import('./prisma.service');
    const service = new PrismaService();

    // Act
    await service.onModuleInit();
    await service.onModuleDestroy();

    // Assert
    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);

    // Cleanup
    process.env.DATABASE_URL = originalDatabaseUrl;
  });
});
