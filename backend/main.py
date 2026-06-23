from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from . import models

# Create all tables in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Türkiye Haritası PostGIS API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "PostGIS Harita API is running"}

import json
from sqlalchemy import func

@app.get("/api/districts")
def get_districts(region_type: str = "all", db: Session = Depends(get_db)):
    query = db.query(
        models.RegionModel.name,
        models.RegionModel.region_type,
        func.ST_AsGeoJSON(models.RegionModel.geom).label('geojson')
    )
    
    if region_type != "all":
        query = query.filter(models.RegionModel.region_type == region_type)
        
    features = []
    for row in query.all():
        if row.geojson:
            features.append({
                "type": "Feature",
                "geometry": json.loads(row.geojson),
                "properties": {"name": row.name, "type": row.region_type}
            })
            
    return {"type": "FeatureCollection", "features": features}

@app.get("/api/pois")
def get_pois(category: str = "all", db: Session = Depends(get_db)):
    query = db.query(
        models.POIModel.name,
        models.POIModel.poi_type,
        func.ST_AsGeoJSON(models.POIModel.geom).label('geojson')
    )
    if category and category != "all":
        query = query.filter(models.POIModel.poi_type == category)
        
    features = []
    for row in query.all():
        if row.geojson:
            features.append({
                "type": "Feature",
                "geometry": json.loads(row.geojson),
                "properties": {"name": row.name, "type": row.poi_type}
            })
            
    return {"type": "FeatureCollection", "features": features}
