import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const C = {
  green: "#4CAF50",
  greenDark: "#2E7D32",
  greenDim: "#EAF7E3",
  amber: "#F59E0B",
  amberDim: "#FFF8EC",
  blue: "#3B82F6",
  blueDim: "#EFF6FF",
  red: "#EF4444",
  border: "#E5EDE0",
  text: "#102114",
  textMid: "#6E8A72",
  textLight: "#9AA89B",
  surface: "#FFFFFF",
  bg: "#F6F8F3",
  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};

const FARM_POSITION = [5.4205, 100.5745];
const FARM_ADDRESS = "AyamTech Farm, Kedah, Malaysia";

const KEDAH_LOCATIONS = {
  kulim: [5.3646, 100.5618],
  "taman kulim utama": [5.377, 100.566],
  "taman kempas": [5.389, 100.555],
  "sungai petani": [5.647, 100.487],
  "alor setar": [6.1248, 100.3678],
  jitra: [6.268, 100.421],
  baling: [5.678, 100.916],
  "bandar baharu": [5.131, 100.489],
  kedah: [5.73, 100.55],
};

const normalizeDeliveryStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "assigned") return "assigned";

  if (
    value === "out of delivery" ||
    value === "out for delivery" ||
    value === "out_for_delivery" ||
    value === "out-of-delivery"
  ) {
    return "out of delivery";
  }

  if (value === "completed" || value === "complete" || value === "delivered") {
    return "completed";
  }

  return "assigned";
};

function fullAddress(delivery) {
  if (!delivery) return "";

  if (delivery.customer_full_address) {
    return delivery.customer_full_address;
  }

  return [
    delivery.delivery_address || delivery.customer_address || delivery.address,
    delivery.customer_area || delivery.area,
    "Kedah",
    "Malaysia",
  ]
    .filter(Boolean)
    .join(", ");
}

function getCustomerPosition(delivery) {
  const address = fullAddress(delivery).toLowerCase();

  for (const key of Object.keys(KEDAH_LOCATIONS)) {
    if (address.includes(key)) {
      return KEDAH_LOCATIONS[key];
    }
  }

  return KEDAH_LOCATIONS.kedah;
}

function makeRoutePoints(farm, customer) {
  const [farmLat, farmLng] = farm;
  const [custLat, custLng] = customer;

  const midLat = (farmLat + custLat) / 2;
  const midLng = (farmLng + custLng) / 2;

  const offsetLat = Math.abs(farmLat - custLat) < 0.03 ? 0.035 : 0.018;
  const offsetLng = Math.abs(farmLng - custLng) < 0.03 ? 0.035 : 0.018;

  return [
    farm,
    [midLat + offsetLat, midLng - offsetLng],
    [midLat - offsetLat / 2, midLng + offsetLng],
    customer,
  ];
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function getPointAlongRoute(points, progress) {
  if (!points || points.length === 0) return FARM_POSITION;
  if (points.length === 1) return points[0];

  const safeProgress = Math.max(0, Math.min(1, progress));

  const segmentLengths = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const len = distance(points[i], points[i + 1]);
    segmentLengths.push(len);
    totalLength += len;
  }

  let targetLength = totalLength * safeProgress;

  for (let i = 0; i < segmentLengths.length; i++) {
    if (targetLength <= segmentLengths[i]) {
      const ratio = targetLength / segmentLengths[i];
      const start = points[i];
      const end = points[i + 1];

      return [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ];
    }

    targetLength -= segmentLengths[i];
  }

  return points[points.length - 1];
}

function createEmojiIcon(emoji, borderColor, label = "") {
  return L.divIcon({
    className: "ayamtech-map-icon",
    html: `
      <div class="marker-wrap" style="border-color:${borderColor}">
        <div class="marker-emoji">${emoji}</div>
        ${
          label
            ? `<div class="marker-label" style="border-color:${borderColor}">${label}</div>`
            : ""
        }
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -25],
  });
}

// ── FitBounds: zooms to route when delivery exists, else centers on farm ──
function FitBounds({ route, farmOnly }) {
  const map = useMap();

  useEffect(() => {
    if (farmOnly) {
      map.setView(FARM_POSITION, 13, { animate: true });
      return;
    }

    if (!route || route.length === 0) return;

    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 13,
    });
  }, [map, route, farmOnly]);

  return null;
}

export default function LeafletDeliveryMap({ delivery }) {
  const [movingProgress, setMovingProgress] = useState(0.15);

  // ── null delivery → farm-only map ──
  const farmOnly = !delivery;

  const status = farmOnly
    ? "assigned"
    : normalizeDeliveryStatus(
        delivery?.delivery_status || delivery?.display_status
      );

  const customerPosition = useMemo(
    () => (farmOnly ? null : getCustomerPosition(delivery)),
    [delivery, farmOnly]
  );

  const route = useMemo(
    () =>
      farmOnly ? null : makeRoutePoints(FARM_POSITION, customerPosition),
    [customerPosition, farmOnly]
  );

  useEffect(() => {
    if (farmOnly || status !== "out of delivery") {
      setMovingProgress(status === "completed" ? 1 : 0);
      return;
    }

    let progress = 0.15;
    let direction = 1;

    const timer = setInterval(() => {
      progress += direction * 0.012;

      if (progress >= 0.85) direction = -1;
      if (progress <= 0.15) direction = 1;

      setMovingProgress(progress);
    }, 130);

    return () => clearInterval(timer);
  }, [status, farmOnly]);

  const vehicleProgress =
    farmOnly || status === "assigned"
      ? 0
      : status === "completed"
      ? 1
      : movingProgress;

  const vehiclePosition = farmOnly
    ? FARM_POSITION
    : getPointAlongRoute(route, vehicleProgress);

  const routeColor =
    status === "assigned"
      ? C.amber
      : status === "out of delivery"
      ? C.blue
      : C.greenDark;

  const statusText = farmOnly
    ? "No deliveries assigned yet — showing farm location."
    : status === "assigned"
    ? "Assigned: motorcycle is still at the farm."
    : status === "out of delivery"
    ? "Out for Delivery: motorcycle is moving between farm and customer."
    : "Completed: motorcycle has reached the customer location.";

  const statusEmoji = farmOnly
    ? "🏠"
    : status === "assigned"
    ? "🏠"
    : status === "out of delivery"
    ? "🚚"
    : "✅";

  return (
    <div>
      <style>{mapStyle}</style>

      <div style={mapShell}>
        <MapContainer
          center={FARM_POSITION}
          zoom={farmOnly ? 13 : 11}
          scrollWheelZoom
          style={{
            height: 430,
            width: "100%",
            borderRadius: 20,
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds route={route} farmOnly={farmOnly} />

          {/* Route polylines — only when a delivery is selected */}
          {!farmOnly && route && (
            <>
              <Polyline
                positions={route}
                pathOptions={{
                  color: routeColor,
                  weight: 7,
                  opacity: 0.88,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={route}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  opacity: 0.9,
                  dashArray: "10 12",
                }}
              />
            </>
          )}

          {/* Farm marker — always shown */}
          <Marker
            position={FARM_POSITION}
            icon={createEmojiIcon("🏠", C.greenDark, "Farm")}
          >
            <Popup>
              <strong>AyamTech Farm</strong>
              <br />
              {FARM_ADDRESS}
            </Popup>
          </Marker>

          {/* Customer + vehicle markers — only when a delivery is selected */}
          {!farmOnly && customerPosition && (
            <>
              <Marker
                position={customerPosition}
                icon={createEmojiIcon("🏡", C.blue, "Customer")}
              >
                <Popup>
                  <strong>{delivery.customer_name || "Customer"}</strong>
                  <br />
                  {fullAddress(delivery)}
                </Popup>
              </Marker>

              <Marker
                position={vehiclePosition}
                icon={createEmojiIcon(
                  status === "assigned"
                    ? "🛵"
                    : status === "out of delivery"
                    ? "🚚"
                    : "✅",
                  routeColor,
                  status === "assigned"
                    ? "At Farm"
                    : status === "out of delivery"
                    ? "On Road"
                    : "Delivered"
                )}
              >
                <Popup>
                  <strong>
                    {status === "assigned"
                      ? "At Farm"
                      : status === "out of delivery"
                      ? "On Road"
                      : "Delivered"}
                  </strong>
                  <br />
                  Delivery: {delivery.delivery_id}
                  <br />
                  Customer: {delivery.customer_name || "Customer"}
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      <div
        style={{
          ...statusBox,
          background: farmOnly ? C.greenDim : (
            status === "assigned"
              ? C.amberDim
              : status === "out of delivery"
              ? C.blueDim
              : C.greenDim
          ),
          borderColor: farmOnly ? "#4CAF5033" : (
            status === "assigned"
              ? "#F59E0B33"
              : status === "out of delivery"
              ? "#3B82F633"
              : "#4CAF5033"
          ),
        }}
      >
        <div style={{ fontSize: 24 }}>{statusEmoji}</div>

        <div>
          <div style={statusTitle}>{statusText}</div>
          {!farmOnly && (
            <div style={statusSub}>
              {delivery.delivery_id} · {delivery.customer_name || "Customer"} ·{" "}
              {fullAddress(delivery)}
            </div>
          )}
          {farmOnly && (
            <div style={statusSub}>{FARM_ADDRESS}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const mapShell = {
  borderRadius: 22,
  overflow: "hidden",
  border: `1.5px solid ${C.border}`,
  background: C.bg,
  boxShadow: "0 8px 22px rgba(16,33,20,.05)",
};

const statusBox = {
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const statusTitle = {
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 13,
  color: C.text,
};

const statusSub = {
  fontSize: 12,
  color: C.textMid,
  fontWeight: 700,
  marginTop: 2,
  lineHeight: 1.5,
};

const mapStyle = `
.leaflet-container {
  font-family: ${C.body};
}

.ayamtech-map-icon {
  background: transparent;
  border: none;
}

.marker-wrap {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  border: 3px solid;
  background: white;
  box-shadow: 0 12px 28px rgba(16,33,20,.22);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.marker-emoji {
  font-size: 27px;
  line-height: 1;
}

.marker-label {
  position: absolute;
  left: 50%;
  bottom: -22px;
  transform: translateX(-50%);
  background: white;
  border: 1.5px solid;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 9px;
  font-weight: 900;
  color: ${C.text};
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(16,33,20,.12);
}
`;