#!/usr/bin/env python3
"""
Script to initialize criterios fields in the database for all programs.
This adds the 5 criteria fields (relevancia, claridad, transparencia, actividades, resultados)
with default value of 0 for all existing programs that don't have them.
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def initialize_criterios():
    """Initialize criterios fields for all programs in the database."""
    
    # Get MongoDB connection string from environment
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/doctorados')
    
    try:
        # Connect to MongoDB
        print(f"Connecting to MongoDB: {mongodb_uri}")
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        
        # Test connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        # Get the programas collection
        collection = db.programas
        
        # Count total programs
        total_programs = collection.count_documents({})
        print(f"📊 Total programs in database: {total_programs}")
        
        # Count programs without criterios field
        programs_without_criterios = collection.count_documents({
            "$or": [
                {"criterios": {"$exists": False}},
                {"criterios": None},
                {"criterios": {}}
            ]
        })
        print(f"📊 Programs without criterios: {programs_without_criterios}")
        
        if programs_without_criterios == 0:
            print("✅ All programs already have criterios fields initialized")
            return
        
        # Define default criterios structure
        default_criterios = {
            "relevancia": 0,        # Personal relevance and thematic affinity (1-5)
            "claridad": 0,          # Clarity of research lines (1-5) 
            "transparencia": 0,     # Transparency in information (1-5)
            "actividades": 0,       # Variety of training activities (1-5)
            "resultados": 0         # Transparency in results and quality (1-5)
        }
        
        print(f"🔄 Initializing criterios for {programs_without_criterios} programs...")
        
        # Update programs that don't have criterios or have empty criterios
        result = collection.update_many(
            {
                "$or": [
                    {"criterios": {"$exists": False}},
                    {"criterios": None},
                    {"criterios": {}}
                ]
            },
            {
                "$set": {
                    "criterios": default_criterios
                }
            }
        )
        
        print(f"✅ Updated {result.modified_count} programs with criterios fields")
        
        # Verify the update
        programs_with_criterios = collection.count_documents({
            "criterios": {"$exists": True, "$ne": None, "$ne": {}}
        })
        print(f"📊 Programs with criterios after update: {programs_with_criterios}")
        
        # Show some sample programs with their criterios
        print("\n📋 Sample programs with criterios:")
        sample_programs = collection.find(
            {"criterios": {"$exists": True}},
            {"programa": 1, "universidad": 1, "criterios": 1}
        ).limit(5)
        
        for i, program in enumerate(sample_programs, 1):
            print(f"  {i}. {program.get('programa', 'N/A')} - {program.get('universidad', 'N/A')}")
            criterios = program.get('criterios', {})
            print(f"     Criterios: {criterios}")
        
        print(f"\n🎉 Criterios initialization completed successfully!")
        print(f"   - Total programs: {total_programs}")
        print(f"   - Programs updated: {result.modified_count}")
        print(f"   - Programs with criterios: {programs_with_criterios}")
        
    except Exception as e:
        print(f"❌ Error initializing criterios: {str(e)}")
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 MongoDB connection closed")

def verify_criterios():
    """Verify that criterios fields are properly initialized."""
    
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/doctorados')
    
    try:
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        collection = db.programas
        
        print("\n🔍 Verifying criterios initialization...")
        
        # Check programs with complete criterios
        complete_criterios = collection.count_documents({
            "criterios.relevancia": {"$exists": True},
            "criterios.claridad": {"$exists": True},
            "criterios.transparencia": {"$exists": True},
            "criterios.actividades": {"$exists": True},
            "criterios.resultados": {"$exists": True}
        })
        
        total_programs = collection.count_documents({})
        
        print(f"✅ Programs with complete criterios: {complete_criterios}/{total_programs}")
        
        if complete_criterios == total_programs:
            print("🎉 All programs have complete criterios fields!")
        else:
            print(f"⚠️  {total_programs - complete_criterios} programs still need criterios fields")
            
    except Exception as e:
        print(f"❌ Error verifying criterios: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("🚀 Starting criterios initialization...")
    print("="*50)
    
    # Check if we should verify instead of initialize
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verify_criterios()
    else:
        initialize_criterios()
        verify_criterios()
    
    print("="*50)
    print("✅ Script completed!")