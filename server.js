const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorados';
const client = new MongoClient(uri);

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Geocoding API (example: Nominatim/OpenStreetMap)
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
    
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
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

// Generate summary using OpenAI (GPT-3.5 Turbo)
async function generateSummary(text) {
  try {
    const response = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo", // GPT-3.5 Turbo es la opción más económica
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
    console.error('Error generating summary:', error);
    return "No se pudo generar un resumen.";
  }
}

// Generate stats using OpenAI (GPT-3.5 Turbo)
async function generateStats(universidad, programas) {
  try {
    const programasTexto = programas.map(p => `${p.nombre}: ${p.lineas_investigacion.join('. ')}`).join('\n\n');
    
    const response = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo", // GPT-3.5 Turbo es la opción más económica
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
      console.error('Error parsing stats JSON:', e);
      return {
        innovacion: 5,
        interdisciplinariedad: 5,
        impacto: 5, 
        internacional: 5,
        aplicabilidad: 5
      };
    }
  } catch (error) {
    console.error('Error generating stats:', error);
    return {
      innovacion: 5,
      interdisciplinariedad: 5,
      impacto: 5,
      internacional: 5,
      aplicabilidad: 5
    };
  }
}

// Routes
app.get('/api/programas', async (req, res) => {
  try {
    const db = client.db();
    const programas = await db.collection('programas').find({}).toArray();
    res.json(programas);
  } catch (error) {
    console.error('Error fetching programas:', error);
    res.status(500).json({ message: 'Error fetching programas' });
  }
});

// Group programas by universidad
app.get('/api/universidades', async (req, res) => {
  try {
    const db = client.db();
    
    // Get distinct universities with their data
    const universidades = await db.collection('programas').aggregate([
      {
        $group: {
          _id: {
            universidad: "$universidad",
            ciudad: "$ciudad"
          },
          programas: {
            $push: {
              _id: "$_id",
              nombre: "$programa",
              url: "$url",
              lineas_investigacion: {
                $split: ["$linea_investigacion", "\n\n"]
              },
              resumen: "$university_summary",
              status: "$status",
              calificacion: "$calificacion",
              criterios: "$criterios",
              university_summary: "$university_summary",
              city_description: "$city_description",
              university_description: "$university_description"
            }
          },
          coords: { $first: "$coords" },
          stats: { $first: "$stats" },
          ciudad_metrics: { $first: "$ciudad_metrics" }
        }
      },
      {
        $project: {
          _id: 0,
          nombre: "$_id.universidad",
          ciudad: "$_id.ciudad",
          programas: 1,
          coords: 1,
          stats: 1,
          ciudad_metrics: 1
        }
      }
    ]).toArray();
    
    res.json({ programas_doctorado: { universidades } });
  } catch (error) {
    console.error('Error fetching universidades:', error);
    res.status(500).json({ message: 'Error fetching universidades' });
  }
});

// Add new universidad with empty programas array
app.post('/api/universidades', async (req, res) => {
  try {
    const { nombre, ciudad } = req.body;
    if (!nombre || !ciudad) {
      return res.status(400).json({ message: 'Nombre y ciudad son requeridos' });
    }
    
    // We don't actually add to the universities collection
    // Just return success for the frontend to update its state
    res.status(201).json({ 
      nombre, 
      ciudad, 
      programas: [] 
    });
  } catch (error) {
    console.error('Error adding universidad:', error);
    res.status(500).json({ message: 'Error adding universidad' });
  }
});

// Add new programa to universidad
app.post('/api/programas', async (req, res) => {
  try {
    const { universidad, ciudad, programa, linea_investigacion, url } = req.body;
    
    if (!universidad || !ciudad || !programa) {
      return res.status(400).json({ message: 'Universidad, ciudad y programa son requeridos' });
    }
    
    // Buscar la universidad para obtener stats y ciudad_metrics
    const db = client.db();
    const existingPrograms = await db.collection('programas')
      .find({ universidad: universidad, ciudad: ciudad })
      .limit(1)
      .toArray();
    
    // Obtener stats y ciudad_metrics si existen
    let stats = null;
    let ciudad_metrics = null;
    let coords = null;
    
    if (existingPrograms.length > 0) {
      stats = existingPrograms[0].stats || null;
      ciudad_metrics = existingPrograms[0].ciudad_metrics || null;
      coords = existingPrograms[0].coords || null;
    }
    
    // Crear nuevo programa con stats y ciudad_metrics si están disponibles
    const newProgram = {
      universidad,
      ciudad,
      programa,
      linea_investigacion: linea_investigacion || "",
      url: url || "",
      // Siempre incluir estos campos aunque sean null para mantener consistencia
      stats: stats,
      ciudad_metrics: ciudad_metrics,
      coords: coords
    };
    
    const result = await db.collection('programas').insertOne(newProgram);
    
    res.status(201).json({ 
      _id: result.insertedId,
      ...newProgram
    });
  } catch (error) {
    console.error('Error adding programa:', error);
    res.status(500).json({ message: 'Error adding programa' });
  }
});

// Delete programa
app.delete('/api/programas/:id', async (req, res) => {
  try {
    const db = client.db();
    const result = await db.collection('programas').deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Programa not found' });
    }
    
    res.json({ message: 'Programa deleted successfully' });
  } catch (error) {
    console.error('Error deleting programa:', error);
    res.status(500).json({ message: 'Error deleting programa' });
  }
});

// Update programa status
app.patch('/api/programas/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const db = client.db();
    const result = await db.collection('programas').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Programa not found' });
    }
    
    res.json({ message: 'Status updated successfully', status });
  } catch (error) {
    console.error('Error updating programa status:', error);
    res.status(500).json({ message: 'Error updating programa status' });
  }
});

// Update multiple fields in a programa
app.put('/api/programas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`DEBUG PUT /api/programas/${id}:`, updates);
    
    // DEBUG: Specifically check for criterios
    if (updates.criterios) {
      console.log(`DEBUG PUT /api/programas/${id}: CRITERIOS RECEIVED:`, updates.criterios);
    } else {
      console.log(`DEBUG PUT /api/programas/${id}: No criterios in update payload`);
    }
    
    // Verificar que hay campos para actualizar
    if (!updates || Object.keys(updates).length === 0) {
      console.log(`DEBUG PUT /api/programas/${id}: No updates provided`);
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    // Campos que no se pueden actualizar directamente
    const restrictedFields = ['_id', 'universidad', 'ciudad'];
    
    // Eliminar campos restringidos
    restrictedFields.forEach(field => {
      if (updates[field]) delete updates[field];
    });
    
    // Si no quedan campos para actualizar
    if (Object.keys(updates).length === 0) {
      console.log(`DEBUG PUT /api/programas/${id}: No valid updates after filtering`);
      return res.status(400).json({ message: 'No valid updates provided' });
    }
    
    const db = client.db();
    const result = await db.collection('programas').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      console.log(`DEBUG PUT /api/programas/${id}: Programa not found`);
      return res.status(404).json({ message: 'Programa not found' });
    }
    
    console.log(`DEBUG PUT /api/programas/${id}: Update successful - matchedCount=${result.matchedCount}, modifiedCount=${result.modifiedCount}`);
    
    // DEBUG: Verify criterios were stored by re-fetching the document
    if (updates.criterios) {
      const updatedDoc = await db.collection('programas').findOne(
        { _id: new ObjectId(id) },
        { projection: { criterios: 1 } }
      );
      console.log(`DEBUG PUT /api/programas/${id}: Criterios after update:`, updatedDoc?.criterios || 'NOT FOUND');
    }
    
    res.json({ 
      message: 'Programa updated successfully',
      updated: Object.keys(updates),
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating programa:', error);
    res.status(500).json({ message: 'Error updating programa', error: error.message });
  }
});

// Get city-specific metrics
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
    
    // Costo de vida - Escala invertida de 1-10 (más bajo costo = 10 puntos, más alto costo = 1 punto)
    const costoVidaResponse = await openaiClient.post('/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: countryContext
        },
        {
          role: "user",
          content: `Evalúa el costo de vida en ${ciudad} (sin incluir alquiler) en una escala INVERTIDA del 1 al 10, donde:
          - 10 puntos = costo de vida muy bajo (más económico)
          - 1 punto = costo de vida muy alto (más caro)
          
          Primero compara con Ciudad de México como referencia y luego asigna una puntuación.
          
          Responde con:
          1. Un número entero del 1 al 10 (recuerda: mayor puntuación = menor costo de vida)
          2. Un comentario que explique el porcentaje aproximado de diferencia con Ciudad de México
          3. Menciona 2-3 factores específicos que afectan el costo de vida en esta ciudad
          
          Ejemplo de respuesta: "8. El costo de vida en [ciudad] es aproximadamente un 30% menor que en Ciudad de México. Destacan los bajos precios en transporte público y alimentación, aunque los servicios básicos son relativamente costosos."`
        }
      ],
      max_tokens: 200,
      temperature: 0.5
    });
    const costoVidaText = costoVidaResponse.data.choices[0].message.content.trim();
    // Extract number from response (looking for digits 1-10)
    const costoVidaMatch = costoVidaText.match(/\b([1-9]|10)\b/);
    metrics.costo_vida = costoVidaMatch ? parseInt(costoVidaMatch[0]) : 5;
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
    const distanciaValue = distanciaMatch ? parseInt(distanciaMatch[0]) : 300;
    
    // Store appropriate distance field based on country
    if (isPortugueseCity) {
      metrics.distancia_a_lisboa_km = distanciaValue;
      metrics.distancia_a_madrid_km = null; // Not applicable for Portuguese cities
    } else {
      metrics.distancia_a_madrid_km = distanciaValue;
      metrics.distancia_a_lisboa_km = null; // Not applicable for Spanish cities
    }
    
    // Store the reference city used
    metrics.ciudad_referencia = referenceCity;
    
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

// Enrich data - add coordinates, summaries, stats and city metrics
app.post('/api/enrich', async (req, res) => {
  try {
    const db = client.db();
    
    // Group programs by university to process them together
    const universidades = await db.collection('programas').aggregate([
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
    
    // Process each university
    for (const uni of universidades) {
      const universidad = uni._id.universidad;
      const ciudad = uni._id.ciudad;
      
      // Get coordinates for the city
      let coords = null;
      if (!uni.coords) {
        coords = await getCoordinates(ciudad);
        console.log(`Coordinates for ${ciudad}: `, coords);
      }
      
      // Get city metrics (only once per city)
      console.log(`Getting metrics for ${ciudad}...`);
      const cityMetrics = await getCityMetrics(ciudad);
      console.log(`City metrics for ${ciudad}:`, cityMetrics);
      
      // Process each program to add summaries
      for (const prog of uni.programas) {
        if (!prog.resumen && prog.linea_investigacion) {
          // Generate summary
          const resumen = await generateSummary(prog.linea_investigacion);
          
          // Update program with summary
          await db.collection('programas').updateOne(
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
          await db.collection('programas').updateOne(
            { _id: prog._id },
            { $set: updateData }
          );
        }
      }
      
      // Generate stats for the university
      const processedProgramas = uni.programas.map(p => ({
        nombre: p.programa,
        lineas_investigacion: p.linea_investigacion.split('\n\n')
      }));
      
      const stats = await generateStats(universidad, processedProgramas);
      
      // Update all programs with the university stats and timestamp
      const ultimo_enriquecimiento = new Date().toISOString();
      await db.collection('programas').updateMany(
        { universidad },
        { 
          $set: { 
            stats,
            ultimo_enriquecimiento 
          } 
        }
      );
    }
    
    res.json({ 
      message: 'Data enrichment completed', 
      updated: totalUpdated,
      universities: universidades.length
    });
  } catch (error) {
    console.error('Error enriching data:', error);
    res.status(500).json({ message: 'Error enriching data' });
  }
});

// Get stats for analysis
app.get('/api/analysis', async (req, res) => {
  try {
    const db = client.db();
    
    // Get universities with their stats and city metrics
    const universidades = await db.collection('programas').aggregate([
      {
        $group: {
          _id: "$universidad",
          ciudad: { $first: "$ciudad" },
          stats: { $first: "$stats" },
          ciudad_metrics: { $first: "$ciudad_metrics" },
          coords: { $first: "$coords" },
          programCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          nombre: "$_id",
          ciudad: 1,
          stats: 1,
          ciudad_metrics: 1,
          coords: 1,
          programCount: 1
        }
      }
    ]).toArray();
    
    res.json({ universidades });
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    res.status(500).json({ message: 'Error fetching analysis data' });
  }
});

// API para búsqueda avanzada con regex
app.get('/api/busqueda', async (req, res) => {
  try {
    const db = client.db();
    const {
      texto,         // Texto para buscar en cualquier campo
      universidad,   // Universidad específica
      ciudad,        // Ciudad específica
      programa,      // Nombre de programa
      linea,         // Texto en líneas de investigación
      calificacion,  // Calificación mínima
      innovacion,    // Valor mínimo de innovación
      aplicabilidad, // Valor mínimo de aplicabilidad
      status         // Estado del programa
    } = req.query;
    
    // Construir filtro
    const filtro = {};
    
    // Búsqueda general de texto usando regex
    if (texto) {
      const termino = texto.trim();
      filtro.$or = [
        { universidad: { $regex: termino, $options: 'i' } },
        { programa: { $regex: termino, $options: 'i' } },
        { linea_investigacion: { $regex: termino, $options: 'i' } },
        { resumen: { $regex: termino, $options: 'i' } },
        { ciudad: { $regex: termino, $options: 'i' } }
      ];
    }
    
    // Filtros específicos
    if (universidad) filtro.universidad = { $regex: universidad, $options: 'i' };
    if (ciudad) filtro.ciudad = { $regex: ciudad, $options: 'i' };
    if (programa) filtro.programa = { $regex: programa, $options: 'i' };
    if (linea) filtro.linea_investigacion = { $regex: linea, $options: 'i' };
    if (status) filtro.status = status;
    
    // Filtros numéricos
    if (calificacion) {
      filtro['calificacion.valor'] = { $gte: parseInt(calificacion) };
    }
    
    // Filtros para métricas académicas
    if (innovacion) {
      filtro['stats.innovacion'] = { $gte: parseInt(innovacion) };
    }
    
    if (aplicabilidad) {
      filtro['stats.aplicabilidad'] = { $gte: parseInt(aplicabilidad) };
    }
    
    // Ejecutar búsqueda
    const programas = await db.collection('programas').find(filtro).toArray();
    
    // Agrupar resultados por universidad para devolverlos en formato similar a /api/universidades
    const universidadesMap = new Map();
    
    programas.forEach(programa => {
      const uniKey = `${programa.universidad}|${programa.ciudad}`;
      
      if (!universidadesMap.has(uniKey)) {
        universidadesMap.set(uniKey, {
          nombre: programa.universidad,
          ciudad: programa.ciudad,
          programas: [],
          coords: programa.coords,
          stats: programa.stats,
          ciudad_metrics: programa.ciudad_metrics
        });
      }
      
      // Añadir programa a la universidad correspondiente
      universidadesMap.get(uniKey).programas.push({
        _id: programa._id,
        nombre: programa.programa,
        url: programa.url,
        lineas_investigacion: programa.linea_investigacion ? programa.linea_investigacion.split('\n\n') : [],
        resumen: programa.resumen,
        status: programa.status,
        calificacion: programa.calificacion,
        criterios: programa.criterios,
        stats: programa.stats || universidadesMap.get(uniKey).stats,
        ciudad_metrics: programa.ciudad_metrics || universidadesMap.get(uniKey).ciudad_metrics,
        university_summary: programa.university_summary,
        city_description: programa.city_description,
        university_description: programa.university_description
      });
    });
    
    // Convertir map a array para la respuesta
    const universidades = Array.from(universidadesMap.values());
    
    res.json({ 
      programas_doctorado: { universidades },
      total: programas.length,
      termino_busqueda: texto || 'todos' 
    });
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
  }
});

// Update programa calificacion
app.put('/api/programas/:id/calificacion', async (req, res) => {
  try {
    const { calificacion } = req.body;
    if (!calificacion || !calificacion.valor) {
      return res.status(400).json({ message: 'Calificación requerida' });
    }
    
    const db = client.db();
    const result = await db.collection('programas').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { calificacion } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Programa no encontrado' });
    }
    
    res.json({ 
      message: 'Calificación actualizada correctamente',
      calificacion
    });
  } catch (error) {
    console.error('Error actualizando calificación:', error);
    res.status(500).json({ message: 'Error actualizando calificación' });
  }
});

// Get a specific programa by ID
app.get('/api/programas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DEBUG GET /api/programas/${id}: Buscando programa`);
    
    const db = client.db();
    const programa = await db.collection('programas').findOne({ _id: new ObjectId(id) });
    
    if (!programa) {
      console.log(`DEBUG GET /api/programas/${id}: Programa not found`);
      return res.status(404).json({ message: 'Programa not found' });
    }
    
    console.log(`DEBUG GET /api/programas/${id}: Programa encontrado:`, {
      id: programa._id,
      nombre: programa.nombre,
      universidad: programa.universidad,
      criterios: programa.criterios || 'No tiene criterios'
    });
    
    res.json(programa);
  } catch (error) {
    console.error('Error fetching programa:', error);
    res.status(500).json({ message: 'Error fetching programa', error: error.message });
  }
});

// Get criterios for a specific programa - Endpoint para pruebas
app.get('/api/programas/:id/criterios', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DEBUG GET /api/programas/${id}/criterios: Buscando criterios`);
    
    const db = client.db();
    const programa = await db.collection('programas').findOne(
      { _id: new ObjectId(id) },
      { projection: { _id: 1, nombre: 1, criterios: 1 } }
    );
    
    if (!programa) {
      console.log(`DEBUG GET /api/programas/${id}/criterios: Programa not found`);
      return res.status(404).json({ message: 'Programa not found' });
    }
    
    const criterios = programa.criterios || {};
    console.log(`DEBUG GET /api/programas/${id}/criterios:`, criterios);
    
    res.json({
      programa_id: programa._id,
      nombre: programa.nombre,
      criterios: criterios,
      tiene_criterios: Object.keys(criterios).length > 0
    });
  } catch (error) {
    console.error(`Error fetching criterios for programa ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching criterios', error: error.message });
  }
});

// ===== CRITERIA CONFIGURATION MANAGEMENT API =====

// Get criteria configuration from database
app.get('/api/admin/criteria-labels', async (req, res) => {
  try {
    const db = client.db();
    let criteriaConfig = await db.collection('criteria_config').findOne({ type: 'criteria_config' });
    
    // If no configuration exists, return error (should be initialized first)
    if (!criteriaConfig) {
      return res.status(404).json({ 
        message: 'Criteria configuration not found. Please run initialization script first.',
        suggestion: 'Run: node initialize-criteria.js'
      });
    }
    
    res.json(criteriaConfig);
  } catch (error) {
    console.error('Error fetching criteria configuration:', error);
    res.status(500).json({ message: 'Error fetching criteria configuration', error: error.message });
  }
});

// Update criteria configuration in database
app.put('/api/admin/criteria-labels', async (req, res) => {
  try {
    const { criteria, updatedBy = 'admin' } = req.body;
    
    if (!criteria || !Array.isArray(criteria)) {
      return res.status(400).json({ message: 'Invalid criteria configuration. Expected array of criteria.' });
    }
    
    // Validate criteria structure
    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      if (!criterion.id || !criterion.key || !criterion.label || !criterion.levels) {
        return res.status(400).json({ 
          message: `Invalid criterion structure at index ${i}. Missing required fields.` 
        });
      }
    }
    
    const db = client.db();
    const updateData = {
      type: 'criteria_config',
      version: '1.0',
      criteria: criteria,
      lastUpdated: new Date().toISOString(),
      updatedBy: updatedBy
    };
    
    const result = await db.collection('criteria_config').replaceOne(
      { type: 'criteria_config' },
      updateData,
      { upsert: true }
    );
    
    console.log('Criteria configuration updated:', result);
    res.json({ 
      message: 'Criteria configuration updated successfully', 
      criteria: updateData.criteria,
      lastUpdated: updateData.lastUpdated 
    });
    
  } catch (error) {
    console.error('Error updating criteria configuration:', error);
    res.status(500).json({ message: 'Error updating criteria configuration', error: error.message });
  }
});

// Get criteria for public use (used by modals and forms)
app.get('/api/criteria-labels', async (req, res) => {
  try {
    const db = client.db();
    const criteriaConfig = await db.collection('criteria_config').findOne({ type: 'criteria_config' });
    
    if (!criteriaConfig) {
      return res.status(404).json({ message: 'Criteria configuration not found' });
    }
    
    // Return simplified format for frontend
    const simplifiedCriteria = criteriaConfig.criteria.reduce((acc, criterion) => {
      acc[criterion.key] = {
        id: criterion.id,
        label: criterion.label,
        description: criterion.description,
        levels: criterion.levels
      };
      return acc;
    }, {});
    
    res.json({
      criteria: simplifiedCriteria,
      lastUpdated: criteriaConfig.lastUpdated
    });
    
  } catch (error) {
    console.error('Error fetching public criteria:', error);
    res.status(500).json({ message: 'Error fetching criteria', error: error.message });
  }
});

// Start server
async function startServer() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();