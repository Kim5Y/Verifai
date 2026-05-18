import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, ModuleRef } from '@nestjs/core';
import { RegulatoryAdapter } from '../adapters/regulatory-adapter.interface';
import { REGULATORY_ADAPTER_METADATA_KEY } from '../adapters/regulatory-adapter.decorator';
import { Region } from '../../verify/providers/region-inference-provider/region.enums';

@Injectable()
export class AdapterRegistry implements OnModuleInit {
  private readonly logger = new Logger(AdapterRegistry.name);

  private adaptersByRegion: ReadonlyMap<Region, RegulatoryAdapter> = new Map();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit(): void {
    const adaptersMap = new Map<Region, RegulatoryAdapter>();

    const providers = this.discoveryService.getProviders();
    for (const provider of providers) {
      const providerType = provider.metatype;
      if (!providerType) continue;

      const isRegulatoryAdapter = Boolean(
        Reflect.getMetadata(REGULATORY_ADAPTER_METADATA_KEY, providerType),
      );
      if (!isRegulatoryAdapter) continue;

      const adapterInstance =
        provider.instance ??
        this.moduleRef.get(providerType, { strict: false });

      const adapter = adapterInstance as RegulatoryAdapter;
      const region = adapter?.region;
      if (!region) continue;

      if (adaptersMap.has(region)) {
        this.logger.warn(
          JSON.stringify({
            msg: 'duplicate_regulatory_adapter_registration',
            region,
            adapterClass: adapter.constructor?.name,
          }),
        );
        continue;
      }

      adaptersMap.set(region, adapter);
    }

    this.adaptersByRegion = adaptersMap;

    this.logger.log(
      JSON.stringify({
        msg: 'regulatory_adapter_registry_initialized',
        supportedRegions: [...this.adaptersByRegion.keys()],
      }),
    );
  }

  getAdapter(region: Region): RegulatoryAdapter | undefined {
    return this.adaptersByRegion.get(region);
  }

  hasAdapter(region: Region): boolean {
    return this.adaptersByRegion.has(region);
  }

  getSupportedRegions(): Region[] {
    return [...this.adaptersByRegion.keys()];
  }
}
