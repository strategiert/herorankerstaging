
export const STATION_MAP_CONFIG = {
  map: {
    id: "station_base_v1",
    image: "station_map.png",
    // Base resolution for calculations (aspect ratio 1.87)
    sizePx: { w: 2048, h: 1093 },
    coordinateSystem: "normalized_0_1",
    origin: "top_left",
    
    // SLOTS: Defined as normalized coordinates (0.0 to 1.0) relative to map size
    // anchor: center bottom of the building sprite
    // sortY: usually same as anchor.y, determines z-index
    slots: [
      // --- CENTRAL CORE ---
      {
        id: "slot_center_core",
        anchor: { x: 0.50, y: 0.55 },
        footprint: { w: 0.20, h: 0.20 },
        sortY: 0.55,
        type: "CORE", // HQ only
        allowed: ["COMMAND_CENTER"]
      },
      
      // --- INNER RING (Production & Storage) ---
      {
        id: "slot_inner_left",
        anchor: { x: 0.35, y: 0.62 },
        footprint: { w: 0.12, h: 0.12 },
        sortY: 0.62,
        type: "STANDARD",
        allowed: ["NANO_FOUNDRY", "HYDROPONICS", "CREDIT_TERMINAL", "NANO_VAULT", "BIO_SILO"]
      },
      {
        id: "slot_inner_right",
        anchor: { x: 0.65, y: 0.62 },
        footprint: { w: 0.12, h: 0.12 },
        sortY: 0.62,
        type: "STANDARD",
        allowed: ["NANO_FOUNDRY", "HYDROPONICS", "CREDIT_TERMINAL", "NANO_VAULT", "BIO_SILO"]
      },
      {
        id: "slot_inner_top",
        anchor: { x: 0.50, y: 0.35 },
        footprint: { w: 0.12, h: 0.12 },
        sortY: 0.35,
        type: "STANDARD",
        allowed: ["NANO_FOUNDRY", "HYDROPONICS", "CREDIT_TERMINAL"]
      },

      // --- MILITARY WING (Left) ---
      {
        id: "slot_mil_1",
        anchor: { x: 0.20, y: 0.50 },
        footprint: { w: 0.14, h: 0.14 },
        sortY: 0.50,
        type: "LARGE",
        allowed: ["BARRACKS", "TERRA_FACTORY", "AERO_DOCK"]
      },
      {
        id: "slot_mil_2",
        anchor: { x: 0.25, y: 0.75 },
        footprint: { w: 0.12, h: 0.12 },
        sortY: 0.75,
        type: "STANDARD",
        allowed: ["MED_BAY", "SHIELD_GENERATOR"]
      },

      // --- TECH WING (Right) ---
      {
        id: "slot_tech_1",
        anchor: { x: 0.80, y: 0.50 },
        footprint: { w: 0.14, h: 0.14 },
        sortY: 0.50,
        type: "LARGE",
        allowed: ["TECH_LAB", "CYBER_UPLINK", "RADAR_STATION"]
      },
      {
        id: "slot_tech_2",
        anchor: { x: 0.75, y: 0.75 },
        footprint: { w: 0.12, h: 0.12 },
        sortY: 0.75,
        type: "STANDARD",
        allowed: ["ALLIANCE_HUB", "CREDIT_TERMINAL"]
      },

      // --- OUTER PERIMETER ---
      {
        id: "slot_outer_top_left",
        anchor: { x: 0.30, y: 0.25 },
        footprint: { w: 0.10, h: 0.10 },
        sortY: 0.25,
        type: "STANDARD",
        allowed: ["NANO_VAULT", "BIO_SILO"]
      },
      {
        id: "slot_outer_top_right",
        anchor: { x: 0.70, y: 0.25 },
        footprint: { w: 0.10, h: 0.10 },
        sortY: 0.25,
        type: "STANDARD",
        allowed: ["NANO_VAULT", "BIO_SILO"]
      },
      {
        id: "slot_outer_bottom_left",
        anchor: { x: 0.40, y: 0.85 },
        footprint: { w: 0.10, h: 0.10 },
        sortY: 0.85,
        type: "STANDARD",
        allowed: ["DEFENSE_TURRET"] // Placeholder
      },
      {
        id: "slot_outer_bottom_right",
        anchor: { x: 0.60, y: 0.85 },
        footprint: { w: 0.10, h: 0.10 },
        sortY: 0.85,
        type: "STANDARD",
        allowed: ["DEFENSE_TURRET"]
      }
    ]
  }
};
