# SQLite Migration Guide

## Overview

Your image service has been upgraded from JSON file storage to SQLite database for better performance and scalability.

## Migration Steps

### 1. Run the Migration Script

Navigate to the image-service directory and run:

```bash
cd image-service
node migrate-to-sqlite.js
```

The script will:
- ✅ Check for existing `data/metadata.json`
- ✅ Create SQLite database at `data/images.db`
- ✅ Migrate all records from JSON to SQLite
- ✅ Create a backup of your JSON file
- ✅ Handle duplicates gracefully

### 2. Start the Updated Service

The service now automatically initializes the SQLite database on startup:

```bash
npm run dev
# or
npm run build && npm start
```

You should see:
```
🔌 Initializing database...
✅ Database initialized successfully
🚀 Image Service listening on:
🗃️ Database: /path/to/data/images.db
```

## What Changed

### Performance Improvements
- **Faster Search**: No longer loads entire dataset into memory
- **Instant Pagination**: Database handles pagination efficiently  
- **Scalable**: Can handle millions of images without performance issues

### File Structure
```
image-service/
├── data/
│   ├── images.db          # ✨ NEW: SQLite database
│   ├── metadata.json      # 📦 Old: JSON metadata
│   └── metadata.json.backup # 💾 Backup created by migration
└── uploads/               # 📁 Your images (unchanged)
```

### API Compatibility
- ✅ **No API changes** - all endpoints work exactly the same
- ✅ **Same responses** - response format unchanged
- ✅ **Enhanced search** - now searches entire database, not just current page

## Verification

### Test the Migration
1. **Check record count**:
   ```bash
   curl http://localhost:3000/api/images/count
   ```

2. **Test search functionality**:
   ```bash
   curl "http://localhost:3000/api/images?search=test&page=1&limit=5"
   ```

3. **Verify pagination**:
   ```bash
   curl "http://localhost:3000/api/images?page=2&limit=10"
   ```

### Browse SQLite Database (Optional)
You can inspect the database using any SQLite browser:

```bash
# Command line
sqlite3 data/images.db
.tables
SELECT COUNT(*) FROM images;
.quit

# Or use a GUI tool like:
# - DB Browser for SQLite
# - SQLiteStudio  
# - VSCode SQLite extension
```

## Rollback (If Needed)

If you need to rollback to JSON (not recommended):

1. Stop the service
2. Restore the backup: `cp data/metadata.json.backup data/metadata.json`
3. Checkout the previous commit that used JSON
4. Restart the service

## Troubleshooting

### Migration Issues

**"No metadata.json found"**
- This is normal if you haven't uploaded any images yet
- The service will create an empty SQLite database

**"Database already exists"**
- The migration script handles this gracefully
- It will only add new records, skipping duplicates

**"Permission denied"**
- Make sure the `data/` directory is writable
- Run `chmod 755 data/` if needed

### Runtime Issues

**"Database not initialized"**
- Check that SQLite3 is properly installed: `npm install sqlite3`
- Verify the database file was created: `ls -la data/`

**"Database locked"**
- Another process might be using the database
- Restart the service
- Check for zombie processes: `ps aux | grep node`

## Performance Notes

### Before (JSON)
- Loaded entire metadata file into memory
- Search only worked on current page (24 images)
- Memory usage grew with image count

### After (SQLite)  
- Only loads requested records
- Search works across entire database
- Constant memory usage regardless of database size

## Next Steps

1. **Monitor Performance**: The service should feel much faster, especially with search
2. **Clean Up**: After verifying everything works, you can delete the JSON backup
3. **Consider Indexes**: For very large datasets (100k+ images), consider adding database indexes

## Future Enhancements Enabled

SQLite opens up possibilities for:
- Complex filtering and sorting
- User analytics and statistics  
- Advanced search features
- Collection/album functionality
- Better duplicate detection

Enjoy your upgraded image service! 🚀 