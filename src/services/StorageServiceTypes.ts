export interface StorageLoadRequest {
  collection: string;
  key?: string;
}

export interface StorageLoadManyRequest {
  collection: string;
  keys: string[];
}

export interface StorageSaveRequest {
  collection: string;
  key: string;
  data: unknown;
}

export interface StorageDeleteRequest {
  collection: string;
  key: string;
}
