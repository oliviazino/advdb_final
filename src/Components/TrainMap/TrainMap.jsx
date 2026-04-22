// import { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// export default function TrainMap() {
//   const [trains, setTrains] = useState([]);

//   useEffect(() => {
//     fetch("/data/trains.json")
//       .then((res) => res.json())
//       .then((data) => setTrains(data));
//   }, []);

//   function getTrainPosition(train) {
//     const stations = Object.entries(train.stations_snapshot);

//     for (let i = 0; i < stations.length; i++) {
//       const [code, station] = stations[i];
//       const status = train.stations[code];

//       if (!status.arrived) {
//         const coords = station.geometry.coordinates;
//         return {
//           lat: coords[1],
//           lon: coords[0],
//           name: station.station_name
//         };
//       }
//     }

//     const last = stations[stations.length - 1][1];
//     return {
//       lat: last.geometry.coordinates[1],
//       lon: last.geometry.coordinates[0],
//       name: last.station_name
//     };
//   }

//   return (
//     <MapContainer
//       center={[40, -80]}
//       zoom={5}
//       style={{ height: "600px", width: "100%" }}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       {trains.map((train) => {
//         const pos = getTrainPosition(train);

//         return (
//           <Marker key={train.id} position={[pos.lat, pos.lon]}>
//             <Popup>
//               <strong>{train.route_name}</strong><br />
//               Train #{train.train_number}<br />
//               Near: {pos.name}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// }
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet markers in Vite
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TrainMap() {
  const [trains, setTrains] = useState([]);
  const [tracks, setTracks] = useState(null);
  const [stationLookup, setStationLookup] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // 1. Load the Rail Tracks (Static Background)
    fetch("./public/data/amtrak-track.geojson")
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error("Error loading tracks:", err));

    // 2. Load the Station Lookup (To get coordinates for station codes)
    fetch("./public/data/amtrak-stations.geojson")
      .then(res => res.json())
      .then(data => {
        const lookup = {};
        data.features.forEach(f => {
          // Store [lat, lon] for each station code
          lookup[f.properties.STNCODE] = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
        });
        setStationLookup(lookup);
      })
      .catch(err => console.error("Error loading stations:", err));

    // 3. Live Train Polling
    const fetchData = async () => {
      try {
        const proxy = "https://corsproxy.io/?";
        const target = "https://maps.amtrak.com/services/MapDataService/stations/AllTTMTrains";
        const res = await fetch(proxy + encodeURIComponent(target));
        const data = await res.json();
        if (data && data.features) setTrains(data.features);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      
      {/* Placement restored to top-right */}
      <div style={{
        position: "absolute", top: 10, right: 10, zIndex: 1000,
        background: "white", padding: "8px 12px", borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)", fontWeight: "bold", fontSize: "14px"
      }}>
        Last Updated: {lastUpdated || "Loading..."}
      </div>

      <MapContainer center={[39.8, -98.5]} zoom={4} style={{ height: "100%", width: "100%" }}>
        {/* Original Light Map Style */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* STATIC TRACKS: Subtle grey lines in the background */}
        {tracks && (
          <GeoJSON 
            data={tracks} 
            style={{ color: "#bdc3c7", weight: 1, opacity: 0.4 }} 
          />
        )}

        {trains.map((feature, idx) => {
          const p = feature.properties;
          const currentPos = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

          // Build Route Lines using Station Lookup
          const routeCoords = [];
          for (let i = 1; i <= 42; i++) {
            const stnRaw = p[`station${i}`];
            if (stnRaw) {
              try {
                const stn = JSON.parse(stnRaw);
                if (stationLookup[stn.code]) {
                  routeCoords.push(stationLookup[stn.code]);
                }
              } catch (e) { /* skip bad station data */ }
            }
          }

          // Original Color Logic (Blue for on-time, Red for late)
          const isLate = p.station1?.includes("LATE");
          const statusColor = isLate ? "#dc3545" : "#007bff";

          return (
            <div key={p.objectid || idx}>
              {/* THE ROUTE LINE */}
              {routeCoords.length > 1 && (
                <Polyline 
                  positions={routeCoords} 
                  pathOptions={{ color: statusColor, weight: 3, opacity: 0.6 }} 
                />
              )}

              {/* THE TRAIN MARKER */}
              <Marker position={currentPos} icon={customIcon}>
                <Popup>
                  <strong>{p.routename}</strong><br/>
                  Train #{p.id}<br/>
                  Status: {isLate ? "LATE" : "ON TIME"}
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}