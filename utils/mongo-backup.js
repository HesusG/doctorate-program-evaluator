/**
 * MongoDB Backup and Restore Utility
 * This script provides functions to backup and restore MongoDB collections
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';
const client = new MongoClient(uri);

// Backup directory
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

/**
 * Connect to MongoDB
 * @returns {Promise<Object>} MongoDB database connection
 */
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Create a backup of a MongoDB collection
 * @param {string} collectionName - Name of the collection to backup
 * @param {string} [backupPrefix='backup'] - Prefix for the backup file
 * @returns {Promise<string>} Path to the backup file
 */
async function backupCollection(collectionName = 'programas', backupPrefix = 'backup') {
  try {
    const db = await connectToMongo();
    
    // Generate timestamp for the backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${backupPrefix}_${collectionName}_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // Get all documents from the collection
    const docs = await db.collection(collectionName).find({}).toArray();
    
    // If no documents, show a message and exit
    if (!docs || docs.length === 0) {
      console.log(`Collection '${collectionName}' is empty. No backup created.`);
      return null;
    }
    
    // Save documents to a JSON file
    fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
    
    console.log(`Backup successful: '${collectionName}' → '${backupPath}' (${docs.length} documents)`);
    return backupPath;
  } catch (error) {
    console.error(`Error creating backup: ${error}`);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Restore a MongoDB collection from a backup file
 * @param {string} backupPath - Path to the backup file
 * @param {string} [targetCollection='programas'] - Name of the collection to restore to
 * @param {boolean} [overwrite=false] - Whether to overwrite existing collection
 * @returns {Promise<boolean>} Success status
 */
async function restoreFromBackup(backupPath, targetCollection = 'programas', overwrite = false) {
  try {
    const db = await connectToMongo();
    
    // Check if the backup file exists
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file '${backupPath}' does not exist.`);
      return false;
    }
    
    // Read backup file
    const fileContent = fs.readFileSync(backupPath, 'utf8');
    let docs;
    
    try {
      docs = JSON.parse(fileContent);
    } catch (e) {
      console.error(`Error parsing backup file: ${e}`);
      return false;
    }
    
    if (!Array.isArray(docs) || docs.length === 0) {
      console.log(`Backup file '${backupPath}' contains no documents.`);
      return false;
    }
    
    // Check if target collection exists
    const collections = await db.listCollections({ name: targetCollection }).toArray();
    
    if (collections.length > 0) {
      if (overwrite) {
        await db.collection(targetCollection).drop();
        console.log(`Collection '${targetCollection}' dropped for restoration.`);
      } else {
        console.error(`Collection '${targetCollection}' already exists. Use overwrite=true to overwrite.`);
        return false;
      }
    }
    
    // Restore _id fields to ObjectId if they're stored as strings
    docs = docs.map(doc => {
      if (doc._id && typeof doc._id === 'string') {
        try {
          doc._id = new ObjectId(doc._id);
        } catch (e) {
          // If conversion fails, keep the original ID
          console.warn(`Could not convert _id '${doc._id}' to ObjectId. Keeping original.`);
        }
      }
      return doc;
    });
    
    // Insert documents into the target collection
    const result = await db.collection(targetCollection).insertMany(docs);
    
    console.log(`Restoration successful: '${backupPath}' → '${targetCollection}' (${result.insertedCount} documents)`);
    return true;
  } catch (error) {
    console.error(`Error restoring from backup: ${error}`);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * List all available backups
 * @param {string} [prefix='backup'] - Prefix for backup files
 * @returns {Promise<Array>} Array of backup file information
 */
async function listBackups(prefix = 'backup') {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('No backups directory found.');
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith(prefix) && file.endsWith('.json'));
    
    if (backupFiles.length === 0) {
      console.log('No backups available.');
      return [];
    }
    
    // Sort backups by creation date (newest first)
    const backups = backupFiles.map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        path: filePath,
        created: stats.mtime,
        size: stats.size
      };
    });
    
    backups.sort((a, b) => b.created - a.created);
    
    // Display backups
    console.log('Available backups:');
    backups.forEach((backup, i) => {
      const sizeInKB = Math.round(backup.size / 1024);
      const date = backup.created.toLocaleString();
      console.log(`${i + 1}. ${backup.filename} (${sizeInKB} KB, created on ${date})`);
    });
    
    return backups;
  } catch (error) {
    console.error(`Error listing backups: ${error}`);
    return [];
  }
}

module.exports = {
  backupCollection,
  restoreFromBackup,
  listBackups
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  (async () => {
    try {
      switch (command) {
        case 'backup':
          const collection = args[1] || 'programas';
          await backupCollection(collection);
          break;
          
        case 'restore':
          if (!args[1]) {
            console.error('Backup file path is required for restore.');
            break;
          }
          const backupPath = args[1];
          const targetCollection = args[2] || 'programas';
          const overwrite = args[3] === 'true';
          
          await restoreFromBackup(backupPath, targetCollection, overwrite);
          break;
          
        case 'list':
          await listBackups();
          break;
          
        default:
          console.log(`
MongoDB Backup and Restore Utility

Usage:
  node mongo-backup.js backup [collection] - Create a backup of the specified collection
  node mongo-backup.js restore <backupPath> [targetCollection] [overwrite] - Restore from backup
  node mongo-backup.js list - List all available backups

Examples:
  node mongo-backup.js backup programas
  node mongo-backup.js restore ./backups/backup_programas_2023-01-01.json
  node mongo-backup.js restore ./backups/backup_programas_2023-01-01.json programas true
  node mongo-backup.js list
          `);
      }
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      process.exit();
    }
  })();
}