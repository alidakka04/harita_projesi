from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from .database import Base

class RegionModel(Base):
    """
    İl ve ilçelerin geometrisini ve UAVT kodlarını tutan tablo.
    region_type alanı 'province' veya 'district' olabilir.
    """
    __tablename__ = 'regions'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    region_type = Column(String, nullable=False) # 'province' veya 'district'
    uavt_code = Column(Integer, unique=True, index=True, nullable=True)
    
    # İlçe ise bağlı olduğu il
    parent_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    parent = relationship("RegionModel", remote_side=[id], backref="districts")

    # Geometri kolonu (Polygon / MultiPolygon) - PostGIS SRID 4326 (WGS 84)
    geom = Column(Geometry(geometry_type='MULTIPOLYGON', srid=4326))


class POIModel(Base):
    """
    Okul, hastane, cami, cadde vb. ilgi noktalarını (POI) tutan tablo.
    """
    __tablename__ = 'pois'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    poi_type = Column(String, index=True, nullable=False) # 'school', 'hospital', 'mosque' vb.
    
    # Hangi ilçeye/bölgeye ait
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=True)
    region = relationship("RegionModel", backref="pois")

    # Nokta geometrisi - PostGIS SRID 4326
    geom = Column(Geometry(geometry_type='POINT', srid=4326))
