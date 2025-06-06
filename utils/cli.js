#!/usr/bin/env node

/**
 * Graduate Programs Evaluator CLI
 * Command-line tool for managing the application database
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { backupCollection, restoreFromBackup, listBackups } = require('./mongo-backup');
const { enrichData } = require('./data-enricher');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';
const client = new MongoClient(uri);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} User input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Import data from JSON file
 * @param {string} filePath - Path to JSON file
 * @param {string} [collectionName='programas'] - Target collection name
 * @param {boolean} [overwrite=false] - Whether to overwrite existing collection
 * @returns {Promise<boolean>} Success status
 */
async function importDataFromJson(filePath, collectionName = 'programas', overwrite = false) {
  try {
    const db = await connectToMongo();
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File '${filePath}' does not exist.`);
      return false;
    }
    
    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let data;
    
    try {
      data = JSON.parse(fileContent);
    } catch (e) {
      console.error(`Error parsing JSON file: ${e}`);
      return false;
    }
    
    // Check if data is an array
    if (!Array.isArray(data) || data.length === 0) {
      console.error('File does not contain an array of documents.');
      return false;
    }
    
    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length > 0) {
      if (overwrite) {
        await db.collection(collectionName).drop();
        console.log(`Collection '${collectionName}' dropped for import.`);
      } else {
        console.error(`Collection '${collectionName}' already exists. Use --overwrite to overwrite.`);
        return false;
      }
    }
    
    // Insert data
    const result = await db.collection(collectionName).insertMany(data);
    
    console.log(`Import successful: ${result.insertedCount} documents imported into '${collectionName}'.`);
    return true;
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * View database statistics
 * @param {string} [collectionName='programas'] - Collection to analyze
 * @returns {Promise<void>}
 */
async function viewStats(collectionName = 'programas') {
  try {
    const db = await connectToMongo();
    
    // Check if collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length === 0) {
      console.error(`Collection '${collectionName}' does not exist.`);
      return;
    }
    
    // Get document count
    const count = await db.collection(collectionName).countDocuments();
    
    // Get distinct universities and cities
    const universities = await db.collection(collectionName).distinct('universidad');
    const cities = await db.collection(collectionName).distinct('ciudad');
    
    // Get status counts
    const statusCounts = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: { $ifNull: ['$status', 'pendiente'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Display stats
    console.log('\nDatabase Statistics:');
    console.log('===================');
    console.log(`Collection: ${collectionName}`);
    console.log(`Total documents: ${count}`);
    console.log(`Universities: ${universities.length}`);
    console.log(`Cities: ${cities.length}`);
    
    console.log('\nStatus Distribution:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`);
    });
    
    // Check enrichment status
    const enrichedCount = await db.collection(collectionName).countDocuments({
      $and: [
        { coords: { $exists: true } },
        { stats: { $exists: true } },
        { resumen: { $exists: true } }
      ]
    });
    
    console.log(`\nEnrichment: ${Math.round((enrichedCount / count) * 100)}% (${enrichedCount}/${count} documents)`);
    
  } catch (error) {
    console.error(`Error viewing stats: ${error}`);
  } finally {
    await client.close();
  }
}

/**
 * Delete all documents matching a query
 * @param {string} [collectionName='programas'] - Collection to delete from
 * @param {Object} [query={}] - Query to match documents
 * @returns {Promise<boolean>} Success status
 */
async function deleteDocuments(collectionName = 'programas', query = {}) {
  try {
    const db = await connectToMongo();
    
    // Count matching documents
    const count = await db.collection(collectionName).countDocuments(query);
    
    if (count === 0) {
      console.log('No documents match the query.');
      return false;
    }
    
    // Confirm deletion
    const answer = await askQuestion(`Delete ${count} documents? (yes/no): `);
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      return false;
    }
    
    // Delete documents
    const result = await db.collection(collectionName).deleteMany(query);
    
    console.log(`${result.deletedCount} documents deleted.`);
    return true;
  } catch (error) {
    console.error(`Error deleting documents: ${error}`);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * Main CLI function
 */
async function runCli() {
  console.log('\nGraduate Programs Evaluator CLI');
  console.log('==============================\n');
  
  while (true) {
    console.log('\nAvailable commands:');
    console.log('1. backup - Create a database backup');
    console.log('2. restore - Restore from a backup');
    console.log('3. list - List all backups');
    console.log('4. import - Import data from JSON file');
    console.log('5. enrich - Enrich data with OpenAI');
    console.log('6. stats - View database statistics');
    console.log('7. delete - Delete documents');
    console.log('8. exit - Exit the CLI');
    
    const command = await askQuestion('\nEnter command: ');
    
    try {
      switch (command.toLowerCase()) {
        case '1':
        case 'backup':
          const backupCollection = await askQuestion('Collection to backup [programas]: ') || 'programas';
          console.log(`Creating backup of '${backupCollection}'...`);
          await backupCollection(backupCollection);
          break;
          
        case '2':
        case 'restore':
          const backups = await listBackups();
          
          if (backups.length === 0) {
            console.log('No backups available.');
            break;
          }
          
          const backupIndex = parseInt(await askQuestion('Enter backup number to restore: '));
          
          if (isNaN(backupIndex) || backupIndex < 1 || backupIndex > backups.length) {
            console.error('Invalid backup number.');
            break;
          }
          
          const selectedBackup = backups[backupIndex - 1];
          const targetCollection = await askQuestion('Target collection [programas]: ') || 'programas';
          const overwrite = (await askQuestion('Overwrite existing collection? (yes/no): ')).toLowerCase() === 'yes';
          
          console.log(`Restoring from '${selectedBackup.filename}' to '${targetCollection}'...`);
          await restoreFromBackup(selectedBackup.path, targetCollection, overwrite);
          break;
          
        case '3':
        case 'list':
          await listBackups();
          break;
          
        case '4':
        case 'import':
          const filePath = await askQuestion('JSON file path: ');
          const importCollection = await askQuestion('Target collection [programas]: ') || 'programas';
          const overwriteImport = (await askQuestion('Overwrite existing collection? (yes/no): ')).toLowerCase() === 'yes';
          
          console.log(`Importing data from '${filePath}' to '${importCollection}'...`);
          await importDataFromJson(filePath, importCollection, overwriteImport);
          break;
          
        case '5':
        case 'enrich':
          const enrichCollection = await askQuestion('Collection to enrich [programas]: ') || 'programas';
          const createBackup = (await askQuestion('Create backup before enrichment? (yes/no): ')).toLowerCase() !== 'no';
          
          console.log(`Enriching collection '${enrichCollection}'${createBackup ? ' with backup' : ''}...`);
          await enrichData(enrichCollection, createBackup);
          break;
          
        case '6':
        case 'stats':
          const statsCollection = await askQuestion('Collection to analyze [programas]: ') || 'programas';
          await viewStats(statsCollection);
          break;
          
        case '7':
        case 'delete':
          console.log('Delete documents - specify query as JSON');
          console.log('Examples:');
          console.log('  {} - Delete all documents');
          console.log('  {"status":"descartado"} - Delete all discarded programs');
          console.log('  {"universidad":"Universidad Complutense de Madrid"} - Delete by university');
          
          const deleteCollection = await askQuestion('Collection [programas]: ') || 'programas';
          const queryString = await askQuestion('Query (JSON): ');
          
          let query = {};
          try {
            if (queryString) {
              query = JSON.parse(queryString);
            }
          } catch (e) {
            console.error('Invalid JSON query. Operation cancelled.');
            break;
          }
          
          await deleteDocuments(deleteCollection, query);
          break;
          
        case '8':
        case 'exit':
          console.log('Exiting CLI. Goodbye!');
          rl.close();
          return;
          
        default:
          console.log('Unknown command. Please try again.');
      }
    } catch (error) {
      console.error(`Error executing command: ${error}`);
    }
  }
}

// Start CLI if executed directly
if (require.main === module) {
  runCli().catch(error => {
    console.error('Unhandled error:', error);
    rl.close();
    process.exit(1);
  });
}

module.exports = {
  importDataFromJson,
  viewStats,
  deleteDocuments
};