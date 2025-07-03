const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';

const defaultCriteriaConfig = {
    type: 'criteria_config',
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    criteria: [
        {
            id: 1,
            key: 'relevancia',
            label: 'Relevancia Personal y Afinidad Temática',
            description: 'Evalúa qué tan alineadas están las líneas de investigación con tus intereses académicos o profesionales.',
            levels: {
                1: 'Las líneas están en un área general, pero no conectan con tu tema.',
                2: 'Solo hay una línea lejana a tu interés.',
                3: 'Una o dos líneas son parcialmente compatibles.',
                4: 'Una línea muy alineada y otras relacionadas.',
                5: 'Varias líneas directamente relacionadas con tu tema.'
            }
        },
        {
            id: 2,
            key: 'claridad',
            label: 'Claridad y Especificidad de las Líneas de Investigación',
            description: 'Evalúa qué tan bien explicadas están las líneas de investigación.',
            levels: {
                1: 'Solo hay títulos genéricos.',
                2: 'Descripciones breves que no aclaran bien los temas.',
                3: 'Las líneas están explicadas pero sin ejemplos o desglose.',
                4: 'Hay subtemas o subdivisiones, aunque sin ejemplos concretos.',
                5: 'Las líneas incluyen subtemas, proyectos pasados o actuales, y vinculación con grupos reales.'
            }
        },
        {
            id: 3,
            key: 'entorno',
            label: 'Entorno del Programa (Cultura, Mentoría y Bienestar Estudiantil)',
            description: 'Evalúa la experiencia general del estudiante según reseñas y testimonios.',
            levels: {
                1: 'Ambiente tóxico o negativo frecuente.',
                2: 'Apoyo inconsistente; problemas con tutores.',
                3: 'Entorno funcional pero con experiencias mixtas.',
                4: 'Opiniones mayormente positivas sobre mentores y comunidad.',
                5: 'Comunidad activa, apoyo cercano, y bienestar destacado.'
            }
        },
        {
            id: 4,
            key: 'infraestructura',
            label: 'Infraestructura Académica y Recursos',
            description: 'Evalúa si el programa ofrece recursos físicos y digitales adecuados.',
            levels: {
                1: 'No hay imágenes, ni menciones de laboratorios o bibliotecas. Fotos muestran deterioro.',
                2: 'Hay mención de aulas y bibliotecas, pero sin detalle sobre software o accesibilidad.',
                3: 'Fotos y reseñas muestran instalaciones razonables y uso de alguna plataforma digital.',
                4: 'Laboratorios, software académico y bibliotecas digitales disponibles y visibles.',
                5: 'Infraestructura moderna, especializada, accesible, con coworking, bases de datos remotas, y aulas inteligentes.'
            }
        },
        {
            id: 5,
            key: 'actividades',
            label: 'Enfoque y Flexibilidad de las Actividades Formativas',
            description: 'Evalúa la existencia de un plan formativo más allá de la tesis, y qué tan flexible es.',
            levels: {
                1: 'No hay formación adicional o es rígida.',
                2: 'Solo actividades fijas (seminarios, publicaciones), sin personalización.',
                3: 'Algunas opciones de personalización, combinando formación específica y transversal.',
                4: 'Plan estructurado y flexible con valoración diferenciada según tipo de actividad.',
                5: 'Itinerario completamente personalizable, con movilidad, cotutelas, proyectos externos, y validación formal.'
            }
        }
    ]
};

async function initializeCriteriaDatabase() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        const collection = db.collection('criteria_config');
        
        // Check if criteria already exist
        const existing = await collection.findOne({ type: 'criteria_config' });
        
        if (existing) {
            console.log('⚠️  Criteria configuration already exists');
            console.log('Current version:', existing.version);
            
            // Ask if user wants to update
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise((resolve) => {
                rl.question('Do you want to override the existing configuration? (y/N): ', resolve);
            });
            
            rl.close();
            
            if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                console.log('❌ Operation cancelled');
                return;
            }
            
            // Update existing configuration
            await collection.replaceOne(
                { type: 'criteria_config' },
                defaultCriteriaConfig
            );
            console.log('✅ Criteria configuration updated successfully');
        } else {
            // Insert new configuration
            await collection.insertOne(defaultCriteriaConfig);
            console.log('✅ Criteria configuration created successfully');
        }
        
        // Display the configuration
        console.log('\n📋 Current Criteria Configuration:');
        console.log('==================================');
        
        defaultCriteriaConfig.criteria.forEach(criterion => {
            console.log(`\n${criterion.id}. ${criterion.label}`);
            console.log(`   Key: ${criterion.key}`);
            console.log(`   Description: ${criterion.description}`);
            console.log('   Levels:');
            for (let level = 1; level <= 5; level++) {
                console.log(`     ${level}: ${criterion.levels[level]}`);
            }
        });
        
        console.log('\n🎉 Database initialization completed!');
        console.log('📌 Next steps:');
        console.log('   1. Start your server: npm start');
        console.log('   2. Go to Admin tab → Criterios de Evaluación');
        console.log('   3. Test the load and save functionality');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    } finally {
        await client.close();
    }
}

// Run the initialization
if (require.main === module) {
    initializeCriteriaDatabase().catch(console.error);
}

module.exports = { initializeCriteriaDatabase, defaultCriteriaConfig };