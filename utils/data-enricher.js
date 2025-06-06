/**
 * Data Enrichment Utility
 * This script provides functions to enrich program data with OpenAI and geocoding
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const { backupCollection } = require('./mongo-backup');

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';
const client = new MongoClient(uri);

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
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
 * Get coordinates for a city using Nominatim/OpenStreetMap
 * @param {string} city - City name
 * @param {string} [country=null] - Country name, will be determined from city if null
 * @returns {Promise<Object|null>} Coordinates object or null
 */
async function getCoordinates(city, country = null) {
  try {
    // Determine country based on city name if not provided
    if (!country) {
      // Portuguese cities
      const portugueseCities = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Faro'];
      if (portugueseCities.includes(city) || 
          portugueseCities.some(pCity => city.includes(pCity)) ||
          city.includes('Portugal')) {
        country = 'Portugal';
      } else {
        // Default to Spain
        country = 'Spain';
      }
    }
    
    const params = {
      format: 'json',
      limit: 1
    };
    
    // If we have a city name, use it
    if (city) {
      params.city = city;
    }
    
    // Add country parameter
    if (country) {
      params.country = country;
    }
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: params,
      headers: {
        'User-Agent': 'GraduateProgramsEvaluator/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting coordinates for ${city} in ${country}: ${error}`);
    return null;
  }
}

/**
 * Generate summary using OpenAI
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} Generated summary
 */
async function generateSummary(text) {
  try {
    const response = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente académico especializado en resumir líneas de investigación científica de manera concisa y profesional."
        },
        {
          role: "user",
          content: `Resume las siguientes líneas de investigación en un párrafo breve, destacando los aspectos más importantes y potenciales aplicaciones: ${text}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error generating summary: ${error}`);
    return "No se pudo generar un resumen.";
  }
}

/**
 * Generate academic stats for a university using OpenAI
 * @param {string} universidad - University name
 * @param {Array} programas - Programs with research lines
 * @returns {Promise<Object>} Generated stats
 */
async function generateStats(universidad, programas) {
  try {
    const programasTexto = programas.map(p => `${p.nombre}: ${p.lineas_investigacion.join('. ')}`).join('\n\n');
    
    const response = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un analista de datos académicos que evalúa programas de doctorado y genera estadísticas cualitativas."
        },
        {
          role: "user",
          content: `Basándote en la siguiente información de programas de doctorado de ${universidad}, genera 5 métricas numéricas en escala del 1 al 10 para evaluar: 
          1. Innovación: cuán innovadores son los temas de investigación
          2. Interdisciplinariedad: nivel de colaboración entre disciplinas
          3. Impacto potencial: posible impacto en la sociedad/industria
          4. Competitividad internacional: posicionamiento internacional
          5. Aplicabilidad: orientación práctica vs. teórica
          
          Programas y líneas de investigación:
          ${programasTexto}
          
          Responde SOLO con un objeto JSON con este formato exacto:
          {"innovacion": N, "interdisciplinariedad": N, "impacto": N, "internacional": N, "aplicabilidad": N}
          donde N es un número del 1 al 10.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const content = response.data.choices[0].message.content.trim();
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error parsing stats JSON: ${e}`);
      return {
        innovacion: 5,
        interdisciplinariedad: 5,
        impacto: 5, 
        internacional: 5,
        aplicabilidad: 5
      };
    }
  } catch (error) {
    console.error(`Error generating stats: ${error}`);
    return {
      innovacion: 5,
      interdisciplinariedad: 5,
      impacto: 5,
      internacional: 5,
      aplicabilidad: 5
    };
  }
}

/**
 * Get city-specific metrics using OpenAI
 * @param {string} ciudad - City name
 * @returns {Promise<Object>} City metrics
 */
async function getCityMetrics(ciudad) {
  try {
    const metrics = {};
    
    // Determine if the city is in Portugal
    const portugueseCities = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Faro'];
    const isPortugueseCity = portugueseCities.includes(ciudad) || 
                            portugueseCities.some(pCity => ciudad.includes(pCity)) ||
                            ciudad.includes('Portugal');
    
    // Country-specific assistant content
    const countryContext = isPortugueseCity ? 
      "Eres un asistente especializado en economía y datos de ciudades portuguesas." : 
      "Eres un asistente especializado en economía y datos de ciudades españolas.";
    
    // Costo de vida
    const costoVidaResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: countryContext
        },
        {
          role: "user",
          content: `¿Cuál es el costo de vida aproximado en ${ciudad} (sin incluir alquiler) en relación a Ciudad de México? Devuélvelo como un índice numérico 0–100, y un breve comentario.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    });
    const costoVidaText = costoVidaResponse.data.choices[0].message.content.trim();
    // Extract number from response
    const costoVidaMatch = costoVidaText.match(/\b([0-9]{1,3})\b/);
    metrics.costo_vida = costoVidaMatch ? parseInt(costoVidaMatch[0]) : 70;
    metrics.costo_vida_comentario = costoVidaText;
    
    // Reference city for distance - Madrid for Spain, Lisboa for Portugal
    const referenceCity = isPortugueseCity ? "Lisboa" : "Madrid";
    
    // Distancia a la ciudad de referencia
    const distanciaResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente especializado en geografía y cálculo de distancias."
        },
        {
          role: "user",
          content: `Calcula la distancia aérea en kilómetros entre ${ciudad} y ${referenceCity}, basándote en coordenadas. Devuélvela como número entero.`
        }
      ],
      max_tokens: 50,
      temperature: 0.5
    });
    const distanciaText = distanciaResponse.data.choices[0].message.content.trim();
    const distanciaMatch = distanciaText.match(/\b([0-9]{1,4})\b/);
    metrics.distancia_a_madrid_km = distanciaMatch ? parseInt(distanciaMatch[0]) : 300;
    
    // Calidad del servicio médico
    const medicoSystemContent = isPortugueseCity ? 
      "Eres un asistente especializado en sistemas sanitarios portugueses." : 
      "Eres un asistente especializado en sistemas sanitarios españoles.";
      
    const medicoResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: medicoSystemContent
        },
        {
          role: "user",
          content: `En una escala de 0 a 10, ¿qué puntuación le das a la calidad sanitaria en ${ciudad}? Proporciónanos solo el número y, opcionalmente, dos frases de justificación.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    });
    const medicoText = medicoResponse.data.choices[0].message.content.trim();
    const medicoMatch = medicoText.match(/\b([0-9]|10)\b/);
    metrics.calidad_servicio_medico = medicoMatch ? parseInt(medicoMatch[0]) : 8;
    metrics.calidad_servicio_medico_comentario = medicoText;
    
    // Calidad del transporte público
    const transporteResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente especializado en infraestructura de transporte urbano."
        },
        {
          role: "user",
          content: `En una escala de 0 a 10, ¿cómo calificarías la calidad de transporte público en ${ciudad}? Responde con un número y una breve justificación.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    });
    const transporteText = transporteResponse.data.choices[0].message.content.trim();
    const transporteMatch = transporteText.match(/\b([0-9]|10)\b/);
    metrics.calidad_transporte = transporteMatch ? parseInt(transporteMatch[0]) : 7;
    metrics.calidad_transporte_comentario = transporteText;
    
    // Calidad del aire
    const aireResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente especializado en calidad medioambiental urbana."
        },
        {
          role: "user",
          content: `En una escala de 0 a 10, ¿cómo calificarías la calidad del aire en ${ciudad}? Solo el número y, opcionalmente, una frase justificando.`
        }
      ],
      max_tokens: 100,
      temperature: 0.5
    });
    const aireText = aireResponse.data.choices[0].message.content.trim();
    const aireMatch = aireText.match(/\b([0-9]|10)\b/);
    metrics.calidad_aire = aireMatch ? parseInt(aireMatch[0]) : 7;
    metrics.calidad_aire_comentario = aireText;
    
    return metrics;
  } catch (error) {
    console.error(`Error getting city metrics for ${ciudad}: ${error}`);
    return {
      costo_vida: 70,
      distancia_a_madrid_km: 300,
      calidad_servicio_medico: 8,
      calidad_transporte: 7,
      calidad_aire: 7
    };
  }
}

/**
 * Enrich data with coordinates, summaries, stats, and city metrics
 * @param {string} [collectionName='programas'] - Collection name to enrich
 * @param {boolean} [createBackup=true] - Whether to create a backup before enrichment
 * @returns {Promise<Object>} Enrichment results
 */
async function enrichData(collectionName = 'programas', createBackup = true) {
  try {
    // Create backup if requested
    if (createBackup) {
      const backupPath = await backupCollection(collectionName);
      if (!backupPath) {
        console.log('Backup not created. Continuing with enrichment...');
      } else {
        console.log(`Backup created at: ${backupPath}`);
      }
    }
    
    const db = await connectToMongo();
    
    // Group programs by university to process them together
    const universidades = await db.collection(collectionName).aggregate([
      {
        $group: {
          _id: {
            universidad: "$universidad",
            ciudad: "$ciudad"
          },
          programas: {
            $push: {
              _id: "$_id",
              programa: "$programa",
              linea_investigacion: "$linea_investigacion",
              url: "$url"
            }
          }
        }
      }
    ]).toArray();
    
    let totalUpdated = 0;
    let totalUniversities = universidades.length;
    let processedUniversities = 0;
    
    console.log(`Starting enrichment for ${totalUniversities} universities...`);
    
    // Process each university
    for (const uni of universidades) {
      const universidad = uni._id.universidad;
      const ciudad = uni._id.ciudad;
      processedUniversities++;
      
      console.log(`Processing ${processedUniversities}/${totalUniversities}: ${universidad} (${ciudad})`);
      
      // Get coordinates for the city
      let coords = null;
      if (!uni.coords) {
        coords = await getCoordinates(ciudad);
        console.log(`Coordinates for ${ciudad}: `, coords);
      }
      
      // Get city metrics (only once per city)
      console.log(`Getting metrics for ${ciudad}...`);
      const cityMetrics = await getCityMetrics(ciudad);
      console.log(`City metrics obtained for ${ciudad}`);
      
      // Process each program to add summaries
      for (const prog of uni.programas) {
        if (!prog.resumen && prog.linea_investigacion) {
          // Generate summary
          console.log(`Generating summary for: ${prog.programa}`);
          const resumen = await generateSummary(prog.linea_investigacion);
          
          // Update program with summary
          await db.collection(collectionName).updateOne(
            { _id: prog._id },
            { $set: { resumen } }
          );
          
          totalUpdated++;
        }
        
        // Update coordinates and city metrics for all programs of this university
        const updateData = {};
        if (coords) {
          updateData.coords = coords;
        }
        if (cityMetrics) {
          updateData.ciudad_metrics = cityMetrics;
        }
        
        if (Object.keys(updateData).length > 0) {
          await db.collection(collectionName).updateOne(
            { _id: prog._id },
            { $set: updateData }
          );
        }
      }
      
      // Generate stats for the university
      console.log(`Generating stats for ${universidad}...`);
      const processedProgramas = uni.programas.map(p => ({
        nombre: p.programa,
        lineas_investigacion: p.linea_investigacion.split('\n\n')
      }));
      
      const stats = await generateStats(universidad, processedProgramas);
      console.log(`Stats generated for ${universidad}`);
      
      // Update all programs with the university stats
      await db.collection(collectionName).updateMany(
        { universidad },
        { $set: { stats } }
      );
    }
    
    console.log(`Data enrichment completed: ${processedUniversities} universities processed, ${totalUpdated} programs updated.`);
    
    return {
      message: 'Data enrichment completed',
      updated: totalUpdated,
      universities: processedUniversities
    };
  } catch (error) {
    console.error(`Error enriching data: ${error}`);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = {
  enrichData,
  getCoordinates,
  generateSummary,
  generateStats,
  getCityMetrics
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  (async () => {
    try {
      switch (command) {
        case 'enrich':
          const collection = args[1] || 'programas';
          const createBackup = args[2] !== 'false';
          
          console.log(`Enriching collection '${collection}' (backup: ${createBackup})...`);
          await enrichData(collection, createBackup);
          break;
          
        default:
          console.log(`
Data Enrichment Utility

Usage:
  node data-enricher.js enrich [collection] [createBackup]

Options:
  collection   Name of the collection to enrich (default: programas)
  createBackup Whether to create a backup before enrichment (default: true)

Example:
  node data-enricher.js enrich programas true
          `);
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
    } finally {
      process.exit();
    }
  })();
}