import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'images.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'database-schema.sql');

export interface MetadataRecord {
  uuid: string;
  filename: string;
  hash: string;
  createdAt: string;
  uploaderId: string;
  uploaderName: string;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  usageCount: number;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

class DatabaseService {
  private db: sqlite3.Database | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Apply full schema from SQL file
        this.applySchema()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async applySchema(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Read and execute schema file
      try {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        this.db.exec(schema, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database schema applied successfully');
            resolve();
          }
        });
      } catch (err) {
        reject(new Error(`Failed to read schema file: ${err}`));
      }
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  async getAllImages(): Promise<MetadataRecord[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all('SELECT * FROM images', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as MetadataRecord[]);
        }
      });
    });
  }

  async getImages(options: {
    search?: string;
    orderBy?: string;
    orderDirection?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ images: MetadataRecord[], total: number }> {
    const {
      search = '',
      orderBy = 'createdAt',
      orderDirection = 'desc',
      limit,
      offset = 0
    } = options;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      let whereClause = '';
      let params: any[] = [];

      // Add search filter
      if (search.trim()) {
        const searchTerm = `%${search.toLowerCase().replace(/\s+/g, '')}%`;
        whereClause = `WHERE 
          LOWER(REPLACE(filename, ' ', '')) LIKE ? OR 
          LOWER(REPLACE(uploaderName, ' ', '')) LIKE ? OR 
          LOWER(REPLACE(uuid, ' ', '')) LIKE ?`;
        params = [searchTerm, searchTerm, searchTerm];
      }

      // Validate orderBy to prevent SQL injection
      const validOrderBy = ['createdAt', 'filename', 'uploaderName', 'uuid'];
      const safeOrderBy = validOrderBy.includes(orderBy) ? orderBy : 'createdAt';
      const safeOrderDirection = orderDirection.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Get total count first
      const countQuery = `SELECT COUNT(*) as count FROM images ${whereClause}`;
      this.db.get(countQuery, params, (err, countRow: any) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countRow.count;

        // Build main query
        let query = `SELECT * FROM images ${whereClause} ORDER BY ${safeOrderBy} ${safeOrderDirection}`;
        let queryParams = [...params];

        if (limit !== undefined) {
          query += ` LIMIT ? OFFSET ?`;
          queryParams.push(limit, offset);
        }

        this.db!.all(query, queryParams, async (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            // Fetch tags for each image
            try {
              const imagesWithTags = await Promise.all(
                rows.map(async (image: MetadataRecord) => {
                  const tags = await this.getImageTags(image.uuid);
                  return { ...image, tags };
                })
              );

              resolve({
                images: imagesWithTags,
                total
              });
            } catch (tagErr) {
              reject(tagErr);
            }
          }
        });
      });
    });
  }

  async insertImage(record: MetadataRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(
        'INSERT INTO images (uuid, filename, hash, createdAt, uploaderId, uploaderName) VALUES (?, ?, ?, ?, ?, ?)',
        [record.uuid, record.filename, record.hash, record.createdAt, record.uploaderId, record.uploaderName],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async deleteImage(uuid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run('DELETE FROM images WHERE uuid = ?', [uuid], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async getImageByUuid(uuid: string): Promise<MetadataRecord | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get('SELECT * FROM images WHERE uuid = ?', [uuid], async (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            // Fetch tags for this image
            const tags = await this.getImageTags(uuid);
            resolve({ ...row, tags } as MetadataRecord);
          } catch (tagErr) {
            reject(tagErr);
          }
        }
      });
    });
  }

  async getImageCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get('SELECT COUNT(*) as count FROM images', (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async getAllHashes(): Promise<Array<{ uuid: string; hash: string; filename: string; createdAt: string }>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all('SELECT uuid, hash, filename, createdAt FROM images', (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getRandomImages(count: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT filename FROM images ORDER BY RANDOM() LIMIT ?',
        [count],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.filename));
          }
        }
      );
    });
  }

  // ================================
  // TAG MANAGEMENT METHODS
  // ================================

  async getAllTags(): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        'SELECT * FROM tags ORDER BY usageCount DESC, name ASC',
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Tag[]);
          }
        }
      );
    });
  }

  async getPopularTags(search: string = '', limit: number = 10): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      let query = 'SELECT * FROM tags';
      let params: any[] = [];

      if (search.trim()) {
        const searchTerm = `%${search.toLowerCase().trim()}%`;
        query += ' WHERE LOWER(name) LIKE ?';
        params.push(searchTerm);
      }

      query += ' ORDER BY usageCount DESC, name ASC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Tag[]);
        }
      });
    });
  }

  async createTag(tagData: CreateTagRequest): Promise<Tag> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const normalizedName = tagData.name.toLowerCase().trim();
      
      // First check if tag already exists
      this.db.get(
        'SELECT * FROM tags WHERE name = ?',
        [normalizedName],
        (err, existingTag: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (existingTag) {
            // Tag already exists, return it
            resolve(existingTag as Tag);
            return;
          }

          // Create new tag
          this.db!.run(
            'INSERT INTO tags (name, color, createdAt) VALUES (?, ?, datetime("now"))',
            [normalizedName, tagData.color],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Fetch the created tag
                const tagId = this.lastID;
                dbService.db!.get(
                  'SELECT * FROM tags WHERE id = ?',
                  [tagId],
                  (err, row: any) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(row as Tag);
                    }
                  }
                );
              }
            }
          );
        }
      );
    });
  }

  async addTagToImage(imageUuid: string, tagId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(
        'INSERT OR IGNORE INTO image_tags (image_uuid, tag_id) VALUES (?, ?)',
        [imageUuid, tagId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async removeTagFromImage(imageUuid: string, tagId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(
        'DELETE FROM image_tags WHERE image_uuid = ? AND tag_id = ?',
        [imageUuid, tagId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getImageTags(imageUuid: string): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(
        `SELECT t.* FROM tags t 
         INNER JOIN image_tags it ON t.id = it.tag_id 
         WHERE it.image_uuid = ? 
         ORDER BY t.name ASC`,
        [imageUuid],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Tag[]);
          }
        }
      );
    });
  }

  async deleteTag(tagId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // First remove all associations
      this.db.run(
        'DELETE FROM image_tags WHERE tag_id = ?',
        [tagId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Then delete the tag
          this.db!.run(
            'DELETE FROM tags WHERE id = ?',
            [tagId],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.changes > 0);
              }
            }
          );
        }
      );
    });
  }
}

// Create a singleton instance
const dbService = new DatabaseService();

export default dbService; 