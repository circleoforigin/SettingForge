export interface FileSaveRequest {
  folder: string;
  fileName: string;
  bytes: number[];
}

export interface FileReadRequest {
  folder: string;
  fileName: string;
}

export interface FileDeleteRequest {
  folder: string;
  fileName: string;
}