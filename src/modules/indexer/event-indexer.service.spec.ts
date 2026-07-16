import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventIndexerService } from './event-indexer.service';
import { StreamEvent } from './entities/stream-event.entity';
import { VestingEvent } from './entities/vesting-event.entity';
import { MultistreamEvent } from './entities/multistream-event.entity';
import { StellarService } from '../stellar/stellar.service';

describe('EventIndexerService', () => {
  let service: EventIndexerService;

  const mockRepo = { find: jest.fn(), save: jest.fn() };
  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventIndexerService,
        { provide: getRepositoryToken(StreamEvent), useValue: mockRepo },
        { provide: getRepositoryToken(VestingEvent), useValue: mockRepo },
        { provide: getRepositoryToken(MultistreamEvent), useValue: mockRepo },
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<EventIndexerService>(EventIndexerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('startWatching should not throw', async () => {
    await expect(service.startWatching()).resolves.toBeUndefined();
  });
});
