import os
import json
import pymongo
from bson.objectid import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv
import openai
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file.")

openai.api_key = openai_api_key

# MongoDB connection
def connect_mongodb():
    """Connect to MongoDB and return client and database objects."""
    try:
        uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/doctorados')
        client = MongoClient(uri)
        db = client.get_database()
        print(f"Successfully connected to MongoDB: {db.name}")
        return client, db
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        return None, None

def get_llm_explanation(university_name, stats):
    """
    Generate an explanation for university stats using LLM.
    
    Args:
        university_name (str): Name of the university
        stats (dict): Dictionary containing the university stats metrics
    
    Returns:
        str: Generated explanation for the university stats
    """
    try:
        # Create the prompt for the LLM
        prompt = f"""Explica por qué la universidad '{university_name}' tiene las siguientes calificaciones en su perfil académico:
        
        - Innovación: {stats.get('innovacion', 'N/A')}/10
        - Interdisciplinariedad: {stats.get('interdisciplinariedad', 'N/A')}/10
        - Impacto: {stats.get('impacto', 'N/A')}/10
        - Internacional: {stats.get('internacional', 'N/A')}/10
        - Aplicabilidad: {stats.get('aplicabilidad', 'N/A')}/10
        
        Proporciona una explicación detallada que cubra cada una de estas métricas, explicando los posibles factores 
        que contribuyen a estas calificaciones específicas. Escribe en español y asegúrate de que la explicación 
        tenga un tono analítico y profesional, apropiado para un contexto académico.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # You can use "gpt-4" for better results if available
            messages=[
                {"role": "system", "content": "Eres un analista académico especializado en evaluación de universidades y programas de doctorado."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating LLM explanation: {str(e)}")
        return f"No se pudo generar una explicación para las estadísticas de {university_name}."

def recalculate_fields(fields_to_recalculate=None, collection_name='programas', generate_descriptions=True):
    """
    Recalculate selected fields for all university documents and add LLM explanations.
    
    Args:
        fields_to_recalculate (list): List of field names to recalculate, or None for all fields
        collection_name (str): MongoDB collection name
        generate_descriptions (bool): Whether to generate LLM descriptions
    
    Returns:
        dict: Summary of the updates performed
    """
    # Connect to MongoDB
    client, db = connect_mongodb()
    if not client or not db:
        return {"error": "Failed to connect to MongoDB"}
    
    # Default to all fields if none specified
    if fields_to_recalculate is None:
        fields_to_recalculate = ["innovacion", "interdisciplinariedad", "impacto", "internacional", "aplicabilidad"]
    
    # Track updates for reporting
    updates = {
        "universities_processed": 0,
        "documents_updated": 0,
        "fields_updated": fields_to_recalculate,
        "errors": []
    }
    
    try:
        # Group programs by university to process them together
        universities = db[collection_name].aggregate([
            {
                "$group": {
                    "_id": {
                        "universidad": "$universidad",
                        "ciudad": "$ciudad"
                    },
                    "programas": {
                        "$push": {
                            "_id": "$_id",
                            "programa": "$programa",
                            "linea_investigacion": "$linea_investigacion",
                            "stats": "$stats"
                        }
                    }
                }
            }
        ])
        
        # Process each university
        for uni in universities:
            university_name = uni["_id"]["universidad"]
            print(f"Processing university: {university_name}")
            updates["universities_processed"] += 1
            
            # Check if the university has stats
            sample_program = next((p for p in uni["programas"] if "stats" in p and p["stats"]), None)
            
            if not sample_program or not sample_program.get("stats"):
                print(f"No stats found for {university_name}. Skipping...")
                updates["errors"].append(f"No stats found for {university_name}")
                continue
            
            stats = sample_program["stats"]
            
            # If we need to recalculate stats, you would do it here
            # For now, we're just using the existing stats
            
            # Create metadata if needed and add LLM explanation
            if generate_descriptions:
                try:
                    explanation = get_llm_explanation(university_name, stats)
                    
                    # Update all programs for this university
                    update_time = datetime.now().isoformat()
                    result = db[collection_name].update_many(
                        {"universidad": university_name},
                        {
                            "$set": {
                                "metadata.descripcion": explanation,
                                "metadata.last_updated": update_time
                            }
                        }
                    )
                    
                    updates["documents_updated"] += result.modified_count
                    print(f"Updated {result.modified_count} documents for {university_name}")
                    
                except Exception as e:
                    error_msg = f"Error processing {university_name}: {str(e)}"
                    print(error_msg)
                    updates["errors"].append(error_msg)
        
        print("\nRecalculation Summary:")
        print(f"Universities processed: {updates['universities_processed']}")
        print(f"Documents updated: {updates['documents_updated']}")
        print(f"Fields recalculated: {', '.join(updates['fields_updated'])}")
        
        if updates["errors"]:
            print(f"\nErrors occurred ({len(updates['errors'])}):")
            for error in updates["errors"]:
                print(f"- {error}")
        
        return updates
        
    except Exception as e:
        error_msg = f"Error during recalculation: {str(e)}"
        print(error_msg)
        updates["errors"].append(error_msg)
        return updates
    finally:
        client.close()

def get_university_explanations(university_name=None, collection_name='programas'):
    """
    Retrieve existing explanations for universities.
    
    Args:
        university_name (str): Optional name of a specific university to retrieve
        collection_name (str): MongoDB collection name
    
    Returns:
        dict: Dictionary of university names and their explanations
    """
    # Connect to MongoDB
    client, db = connect_mongodb()
    if not client or not db:
        return {"error": "Failed to connect to MongoDB"}
    
    try:
        # Prepare filter
        filter_query = {}
        if university_name:
            filter_query["universidad"] = university_name
        
        # Project only needed fields
        projection = {
            "universidad": 1,
            "metadata.descripcion": 1,
            "metadata.last_updated": 1,
            "stats": 1
        }
        
        # Execute query
        results = db[collection_name].find(
            filter_query, 
            projection
        ).limit(100)  # Limit to avoid overwhelming results
        
        # Group by university
        explanations = {}
        for doc in results:
            uni = doc.get("universidad")
            if uni and "metadata" in doc and "descripcion" in doc["metadata"]:
                if uni not in explanations:
                    explanations[uni] = {
                        "descripcion": doc["metadata"]["descripcion"],
                        "last_updated": doc["metadata"].get("last_updated", "Unknown"),
                        "stats": doc.get("stats", {})
                    }
        
        return explanations
        
    except Exception as e:
        print(f"Error retrieving explanations: {str(e)}")
        return {"error": str(e)}
    finally:
        client.close()

# Example usage in Jupyter Notebook:
"""
# Import the module
import sys
sys.path.append('/path/to/your/utils')  # Make sure the path to the script is in your Python path
from data_explainer import recalculate_fields, get_university_explanations

# Recalculate all fields for all universities
results = recalculate_fields()
print(f"Updated {results['documents_updated']} documents")

# Recalculate only specific fields
results = recalculate_fields(fields_to_recalculate=["innovacion", "aplicabilidad"])
print(f"Updated {results['documents_updated']} documents")

# Get explanations for a specific university
explanations = get_university_explanations(university_name="Universidad de Barcelona")
for uni, data in explanations.items():
    print(f"\n{uni}:")
    print(f"Last updated: {data['last_updated']}")
    print(f"Explanation: {data['descripcion']}")
"""