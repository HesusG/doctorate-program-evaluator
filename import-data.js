const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';
const client = new MongoClient(uri);

async function importData() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const programasCollection = db.collection('programas');
    
    // Check if collection already has data
    const count = await programasCollection.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} documents. Skipping import.`);
      console.log('If you want to reimport, drop the collection first.');
      return;
    }
    
    // Read JSON file
    const jsonData = fs.readFileSync('./doctorados.programas.json', 'utf8');
    const programas = JSON.parse(jsonData);
    
    // Import data
    const result = await programasCollection.insertMany(programas);
    console.log(`${result.insertedCount} documents imported successfully.`);
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import
importData();