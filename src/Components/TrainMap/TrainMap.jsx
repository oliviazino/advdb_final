import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function TrainMap() {
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    fetch("/data/trains.json")
      .then((res) => res.json())
      .then((data) => setTrains(data));
  }, []);

  function getTrainPosition(train) {
    const stations = Object.entries(train.stations_snapshot);

    for (let i = 0; i < stations.length; i++) {
      const [code, station] = stations[i];
      const status = train.stations[code];

      if (!status.arrived) {
        const coords = station.geometry.coordinates;
        return {
          lat: coords[1],
          lon: coords[0],
          name: station.station_name
        };
      }
    }

    const last = stations[stations.length - 1][1];
    return {
      lat: last.geometry.coordinates[1],
      lon: last.geometry.coordinates[0],
      name: last.station_name
    };
  }

  return (
    <MapContainer
      center={[40, -80]}
      zoom={5}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trains.map((train) => {
        const pos = getTrainPosition(train);

        return (
          <Marker key={train.id} position={[pos.lat, pos.lon]}>
            <Popup>
              <strong>{train.route_name}</strong><br />
              Train #{train.train_number}<br />
              Near: {pos.name}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
