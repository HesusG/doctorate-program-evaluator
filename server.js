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
              resumen: "$resumen"
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
      
      // Update all programs with the university stats
      await db.collection('programas').updateMany(
        { universidad },
        { $set: { stats } }
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
        stats: programa.stats || universidadesMap.get(uniKey).stats,
        ciudad_metrics: programa.ciudad_metrics || universidadesMap.get(uniKey).ciudad_metrics
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

// Start server
async function startServer() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();