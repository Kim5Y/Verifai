import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AdapterRegistry } from './registry/adapter.registry';
import { VerificationRouterService } from './router/verification-router.service';
import { EUAdapter } from './adapters/implementations/eu.adapter';
import { FDAAdapter } from './adapters/implementations/fda.adapter';
import { NAFDACAdapter } from './adapters/implementations/nafdac.adapter';

@Module({
  imports: [DiscoveryModule],
  providers: [
    FDAAdapter,
    NAFDACAdapter,
    EUAdapter,
    AdapterRegistry,
    VerificationRouterService,
  ],
  exports: [AdapterRegistry, VerificationRouterService],
})
export class VerificationModule {}
