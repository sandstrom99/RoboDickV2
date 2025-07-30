-- RoboDickV2 Image Service Database Schema
-- SQLite Database Schema for Image Management with Tagging System

-- Main images table
CREATE TABLE IF NOT EXISTS images (
  uuid TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  hash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  uploaderId TEXT NOT NULL,
  uploaderName TEXT NOT NULL
);

-- Tags table - shared across all images
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,  -- lowercase tag name (e.g., "vacation", "meme", "funny")
  color TEXT NOT NULL,        -- hex color code (e.g., "#FF5733", "#3498DB")
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  usageCount INTEGER NOT NULL DEFAULT 0  -- how many images use this tag
);

-- Junction table for many-to-many relationship between images and tags
CREATE TABLE IF NOT EXISTS image_tags (
  image_uuid TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (image_uuid, tag_id),
  FOREIGN KEY (image_uuid) REFERENCES images(uuid) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(createdAt);
CREATE INDEX IF NOT EXISTS idx_images_uploader ON images(uploaderName);
CREATE INDEX IF NOT EXISTS idx_images_hash ON images(hash);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usageCount DESC);

CREATE INDEX IF NOT EXISTS idx_image_tags_image ON image_tags(image_uuid);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags(tag_id);

-- Trigger to update tag usage count when image_tags are added/removed
CREATE TRIGGER IF NOT EXISTS update_tag_usage_insert
  AFTER INSERT ON image_tags
BEGIN
  UPDATE tags 
  SET usageCount = usageCount + 1 
  WHERE id = NEW.tag_id;
END;

CREATE TRIGGER IF NOT EXISTS update_tag_usage_delete
  AFTER DELETE ON image_tags
BEGIN
  UPDATE tags 
  SET usageCount = usageCount - 1 
  WHERE id = OLD.tag_id;
  
  -- Auto-delete tags with zero usage (optional - uncomment if desired)
  -- DELETE FROM tags WHERE id = OLD.tag_id AND usageCount <= 0;
END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS images_with_tags AS
SELECT 
  i.*,
  COUNT(it.tag_id) as tag_count,
  GROUP_CONCAT(
    json_object(
      'id', t.id,
      'name', t.name, 
      'color', t.color
    )
  ) as tags_json
FROM images i
LEFT JOIN image_tags it ON i.uuid = it.image_uuid
LEFT JOIN tags t ON it.tag_id = t.id
GROUP BY i.uuid;

-- Sample data (optional - for testing)
-- INSERT OR IGNORE INTO tags (name, color) VALUES 
--   ('meme', '#FF6B6B'),
--   ('vacation', '#4ECDC4'), 
--   ('funny', '#45B7D1'),
--   ('work', '#96CEB4'),
--   ('family', '#FFEAA7');

-- Migration notes:
-- This schema is designed to be run on existing databases
-- All CREATE statements use IF NOT EXISTS to avoid conflicts
-- Foreign key constraints will maintain data integrity
-- Indexes will improve query performance for searching and filtering 