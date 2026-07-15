import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "streams" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL UNIQUE,
        "sender" varchar NOT NULL,
        "recipient" varchar NOT NULL,
        "asset" varchar NOT NULL,
        "streamAmount" bigint NOT NULL,
        "claimedAmount" bigint NOT NULL DEFAULT '0',
        "flowRate" bigint NOT NULL,
        "startTime" bigint NOT NULL,
        "duration" int NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_streams_sender ON "streams"("sender");
      CREATE INDEX idx_streams_recipient ON "streams"("recipient");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vesting_schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL UNIQUE,
        "beneficiary" varchar NOT NULL,
        "asset" varchar NOT NULL,
        "totalAmount" bigint NOT NULL,
        "vestedAmount" bigint NOT NULL DEFAULT '0',
        "startTime" bigint NOT NULL,
        "cliffDuration" bigint NOT NULL,
        "vestingDuration" bigint NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "revocable" boolean NOT NULL DEFAULT false,
        "revocationTime" bigint,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "multistreams" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL UNIQUE,
        "sender" varchar NOT NULL,
        "asset" varchar NOT NULL,
        "totalAmount" bigint NOT NULL,
        "duration" int NOT NULL,
        "flowRate" bigint NOT NULL,
        "startTime" bigint NOT NULL,
        "lastUpdateTime" bigint NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "multistream_recipients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "multistreamId" uuid NOT NULL,
        "address" varchar NOT NULL,
        "weight" int NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        FOREIGN KEY ("multistreamId") REFERENCES "multistreams"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stream_nfts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL UNIQUE,
        "streamContractAddress" varchar NOT NULL,
        "owner" varchar NOT NULL,
        "streamAmount" bigint NOT NULL,
        "claimedAmount" bigint NOT NULL DEFAULT '0',
        "remainingAmount" bigint NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "keyHash" varchar NOT NULL UNIQUE,
        "serviceAddress" varchar NOT NULL,
        "scopes" text NOT NULL,
        "expiresAt" timestamp,
        "lastUsedAt" timestamp,
        "revokedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_api_keys_hash ON "api_keys"("keyHash");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stream_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL,
        "txHash" varchar NOT NULL,
        "eventType" varchar NOT NULL,
        "caller" varchar NOT NULL,
        "amount" bigint,
        "ledger" int NOT NULL,
        "ledgerTimestamp" bigint NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_stream_events_contract_type ON "stream_events"("contractAddress", "eventType");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vesting_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL,
        "txHash" varchar NOT NULL,
        "eventType" varchar NOT NULL,
        "caller" varchar NOT NULL,
        "amount" bigint,
        "ledger" int NOT NULL,
        "ledgerTimestamp" bigint NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_vesting_events_contract_type ON "vesting_events"("contractAddress", "eventType");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "multistream_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contractAddress" varchar NOT NULL,
        "txHash" varchar NOT NULL,
        "eventType" varchar NOT NULL,
        "caller" varchar NOT NULL,
        "amount" bigint,
        "ledger" int NOT NULL,
        "ledgerTimestamp" bigint NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_multistream_events_contract_type ON "multistream_events"("contractAddress", "eventType");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "multistream_events"');
    await queryRunner.query('DROP TABLE IF EXISTS "vesting_events"');
    await queryRunner.query('DROP TABLE IF EXISTS "stream_events"');
    await queryRunner.query('DROP TABLE IF EXISTS "api_keys"');
    await queryRunner.query('DROP TABLE IF EXISTS "stream_nfts"');
    await queryRunner.query('DROP TABLE IF EXISTS "multistream_recipients"');
    await queryRunner.query('DROP TABLE IF EXISTS "multistreams"');
    await queryRunner.query('DROP TABLE IF EXISTS "vesting_schedules"');
    await queryRunner.query('DROP TABLE IF EXISTS "streams"');
  }
}
