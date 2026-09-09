export interface FileSaveRequest {
  folder: string;
  fileName: string;
  bytes: number[];
}

export interface FileReadRequest {
  folder: string;
  fileName: string;

  /**
   * Optional module that owns the requested file.
   * Defaults to the requesting module.
   */
  ownerModuleId?: string;
}

export interface FileDeleteRequest {
  folder: string;
  fileName: string;
}