import { Test, TestingModule } from '@nestjs/testing';
import { VerifyService } from './verify.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { OpenFoodFactsProvider } from './providers/openfoodfacts/open-foodfacts.provider';

describe('VerifyService', () => {
  let service: VerifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyService,
        OpenFoodFactsProvider,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(
              of({
                status: 200,
                data: {
                  status: 1,
                  product: { product_name: 'Test Product' },
                },
              }),
            ),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<VerifyService>(VerifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
