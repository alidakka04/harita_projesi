const map = L.map('map').setView([39.0, 35.0], 6);

// Base layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const API_BASE_URL = 'http://localhost:8000/api';

// Layers
const poiLayers = {
    low: L.layerGroup(),
    mid: L.layerGroup(),
    high: L.layerGroup()
};
const districtLayer = L.layerGroup().addTo(map);

// Zoom kontrolü: Seviyeye göre yoğunluğu arttır
function updatePoiVisibility() {
    const zoom = map.getZoom();
    
    if (zoom < 7) {
        // Çok uzaktan: Sadece en az sayıda (low) göster
        if (!map.hasLayer(poiLayers.low)) map.addLayer(poiLayers.low);
        if (map.hasLayer(poiLayers.mid)) map.removeLayer(poiLayers.mid);
        if (map.hasLayer(poiLayers.high)) map.removeLayer(poiLayers.high);
    } else if (zoom >= 7 && zoom < 9) {
        // Orta mesafe: Low ve Mid göster
        if (!map.hasLayer(poiLayers.low)) map.addLayer(poiLayers.low);
        if (!map.hasLayer(poiLayers.mid)) map.addLayer(poiLayers.mid);
        if (map.hasLayer(poiLayers.high)) map.removeLayer(poiLayers.high);
    } else {
        // Yakından: Hepsini göster
        if (!map.hasLayer(poiLayers.low)) map.addLayer(poiLayers.low);
        if (!map.hasLayer(poiLayers.mid)) map.addLayer(poiLayers.mid);
        if (!map.hasLayer(poiLayers.high)) map.addLayer(poiLayers.high);
    }
}
map.on('zoomend', updatePoiVisibility);

document.getElementById('loadPoisBtn').addEventListener('click', async () => {
    const category = document.getElementById('poiCategory').value;
    console.log(`Fetching POIs for category: ${category}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/pois?category=${category}`);
        if (!response.ok) throw new Error('API Bulunamadı veya çalışmıyor');
        const data = await response.json();
        
        poiLayers.low.clearLayers();
        poiLayers.mid.clearLayers();
        poiLayers.high.clearLayers();
        
        let index = 0;
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                let htmlContent = `<div style="font-size: 20px; line-height: 1; text-align: center;">📍</div>`;
                
                if (feature.properties.type === "hastane") {
                    // Hastane: Kırmızı yuvarlak içinde beyaz artı
                    htmlContent = `<div style="background: #e74c3c; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); font-family: Arial, sans-serif;">+</div>`;
                }
                else if (feature.properties.type === "okul") {
                    // Okul: Turuncu yuvarlak içinde mezuniyet kepi (SVG)
                    htmlContent = `<div style="background: #f39c12; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"><svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`;
                }
                else if (feature.properties.type === "eczane") {
                    // Eczane: Türkiye standardı olan Beyaz zemin üzerine Kırmızı 'E' harfi
                    htmlContent = `<div style="background: white; color: #e74c3c; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; border: 2px solid #e74c3c; box-shadow: 0 0 4px rgba(0,0,0,0.5); font-family: Arial, sans-serif;">E</div>`;
                }
                else if (feature.properties.type === "cami") {
                    // Cami: Yeşil yuvarlak içinde beyaz Hilal
                    htmlContent = `<div style="background: #2ecc71; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);">☪️</div>`;
                }
                
                const customIcon = L.divIcon({
                    html: htmlContent,
                    className: 'custom-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12]
                });

                return L.marker(latlng, { icon: customIcon });
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`<b>${feature.properties.name}</b><br>Kategori: ${feature.properties.type.toUpperCase()}`);
                
                // Dağıtım algoritması: Her 20 noktadan 1'i low, 5 noktadan 1'i mid, kalanlar high
                if (index % 20 === 0) {
                    poiLayers.low.addLayer(layer);
                } else if (index % 5 === 0) {
                    poiLayers.mid.addLayer(layer);
                } else {
                    poiLayers.high.addLayer(layer);
                }
                index++;
            }
        });

        // Haritayı güncel duruma göre boya
        updatePoiVisibility();
        
    } catch (e) {
        console.error(e);
        alert('Lütfen FastAPI sunucusunun (localhost:8000) çalıştığından emin olun.\n' + e.message);
    }
});

document.getElementById('loadDistrictsBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/districts`);
        if (!response.ok) throw new Error('API Bulunamadı');
        const data = await response.json();
        
        districtLayer.clearLayers();
        L.geoJSON(data, {
            style: {
                color: "#ff7800",
                weight: 2,
                opacity: 0.65,
                fillOpacity: 0.1
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`<b>İl: ${feature.properties.name}</b>`);
            }
        }).addTo(districtLayer);
    } catch (e) {
        console.error(e);
        alert('Lütfen FastAPI sunucusunun çalıştığından emin olun.');
    }
});
