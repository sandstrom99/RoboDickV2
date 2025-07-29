import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'images.db');

export interface MetadataRecord {
  uuid: string;
  filename: string;
  hash: string;
  createdAt: string;
  uploaderId: string;
  uploaderName: string;
}

class DatabaseService {
  private db: sqlite3.Database | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create data directory if it doesn't exist
      const fs = require('fs');
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Create table if it doesn't exist
        this.db!.run(`
          CREATE TABLE IF NOT EXISTS images (
            uuid TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            hash TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            uploaderId TEXT NOT NULL,
            uploaderName TEXT NOT NULL
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
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

        this.db!.all(query, queryParams, (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              images: rows as MetadataRecord[],
              total
            });
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

      this.db.get('SELECT * FROM images WHERE uuid = ?', [uuid], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as MetadataRecord || null);
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
}

// Create a singleton instance
const dbService = new DatabaseService();

export default dbService; 