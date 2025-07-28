export interface ImageMeta {
  uuid: string;
  filename: string;
  createdAt: string; // ISO date
  uploaderId: string; // ID of the user who uploaded
  uploaderName: string; // Name of the user who uploaded
  hash: string;
}
