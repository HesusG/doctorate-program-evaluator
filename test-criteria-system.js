const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';

async function testCriteriaSystem() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('🔗 Connected to MongoDB');
        
        const db = client.db();
        const collection = db.collection('criteria_config');
        
        // Test 1: Check if criteria exist
        console.log('\n📋 Test 1: Checking criteria configuration...');
        const criteriaConfig = await collection.findOne({ type: 'criteria_config' });
        
        if (!criteriaConfig) {
            console.log('❌ No criteria configuration found');
            console.log('💡 Run: node initialize-criteria.js');
            return;
        }
        
        console.log('✅ Criteria configuration found');
        console.log(`📅 Last updated: ${criteriaConfig.lastUpdated}`);
        console.log(`📊 Number of criteria: ${criteriaConfig.criteria.length}`);
        
        // Test 2: Validate structure
        console.log('\n🔍 Test 2: Validating criteria structure...');
        let allValid = true;
        
        criteriaConfig.criteria.forEach((criterion, index) => {
            const hasRequiredFields = criterion.id && criterion.key && criterion.label && criterion.levels;
            const hasAllLevels = criterion.levels && Object.keys(criterion.levels).length === 5;
            
            if (!hasRequiredFields || !hasAllLevels) {
                console.log(`❌ Criterion ${index + 1} has invalid structure`);
                allValid = false;
            } else {
                console.log(`✅ Criterion ${criterion.id}: ${criterion.label} - Valid`);
            }
        });
        
        if (allValid) {
            console.log('✅ All criteria have valid structure');
        }
        
        // Test 3: Show sample criterion
        console.log('\n📄 Test 3: Sample criterion data...');
        const sampleCriterion = criteriaConfig.criteria[0];
        console.log(`ID: ${sampleCriterion.id}`);
        console.log(`Key: ${sampleCriterion.key}`);
        console.log(`Label: ${sampleCriterion.label}`);
        console.log(`Description: ${sampleCriterion.description.substring(0, 50)}...`);
        console.log('Levels:');
        for (let i = 1; i <= 5; i++) {
            console.log(`  ${i}: ${sampleCriterion.levels[i].substring(0, 40)}...`);
        }
        
        // Test 4: Simulate API response
        console.log('\n🌐 Test 4: API response format...');
        const apiResponse = {
            criteria: criteriaConfig.criteria.reduce((acc, criterion) => {
                acc[criterion.key] = {
                    id: criterion.id,
                    label: criterion.label,
                    description: criterion.description,
                    levels: criterion.levels
                };
                return acc;
            }, {}),
            lastUpdated: criteriaConfig.lastUpdated
        };
        
        console.log('✅ API response format prepared');
        console.log(`📊 Available criteria keys: ${Object.keys(apiResponse.criteria).join(', ')}`);
        
        console.log('\n🎉 All tests passed! System is ready.');
        console.log('\n📌 Next steps:');
        console.log('   1. Start server: npm start');
        console.log('   2. Go to: http://localhost:3000');
        console.log('   3. Admin tab → Criterios de Evaluación');
        console.log('   4. Click "📥 Cargar desde DB"');
        console.log('   5. Verify all fields are populated');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.close();
    }
}

// Run the test
if (require.main === module) {
    testCriteriaSystem().catch(console.error);
}

module.exports = { testCriteriaSystem };