import { PrismaClient } from "@prisma/client";

export class PrismaConnection {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaConnection.instance) {
      PrismaConnection.instance = new PrismaClient();
    }

    return PrismaConnection.instance;
  }

  static async query(statement: (client: PrismaClient) => Promise<any>) {
    return statement(PrismaConnection.getInstance())
      .then(async () => {
        await PrismaConnection.instance.$disconnect();
      })
      .catch(async (e) => {
        console.error(e);
        await PrismaConnection.instance.$disconnect();
        process.exit(1);
      });
  }
}
