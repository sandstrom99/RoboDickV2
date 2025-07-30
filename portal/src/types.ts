export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  usageCount: number;
}

export interface ImageMeta {
  uuid: string;
  filename: string;
  createdAt: string; // ISO date
  uploaderId: string; // ID of the user who uploaded
  uploaderName: string; // Name of the user who uploaded
  hash: string;
  url?: string; // Added for compatibility
  tags?: Tag[];
}

export interface CreateTagRequest {
  name: string;
  color?: string; // Optional - backend will assign random color if not provided
}
