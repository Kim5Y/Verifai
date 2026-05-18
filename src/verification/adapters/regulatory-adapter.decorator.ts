export const REGULATORY_ADAPTER_METADATA_KEY = 'REGULATORY_ADAPTER_METADATA_KEY';

export function RegulatoryAdapterImplementation(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(REGULATORY_ADAPTER_METADATA_KEY, true, target);
  };
}

