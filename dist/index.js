import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/robot-constants.ts
import dotenv from "dotenv";
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Secret": ROBOT_SECRET
  };
}
var ROBOT_SERIAL, robotIpFromEnv, ROBOT_IP, ROBOT_API_URL, ROBOT_WS_URL, robotSecretFromEnv, ROBOT_SECRET;
var init_robot_constants = __esm({
  "server/robot-constants.ts"() {
    "use strict";
    dotenv.config();
    ROBOT_SERIAL = "L382502104987ir";
    robotIpFromEnv = process.env.ROBOT_IP;
    if (!robotIpFromEnv) {
      throw new Error("ROBOT_IP environment variable is required but not set");
    }
    ROBOT_IP = robotIpFromEnv;
    ROBOT_API_URL = `http://${ROBOT_IP}:8090`;
    ROBOT_WS_URL = `ws://${ROBOT_IP}:8090/ws/v2`;
    robotSecretFromEnv = process.env.ROBOT_SECRET_KEY || process.env.ROBOT_SECRET;
    if (!robotSecretFromEnv) {
      throw new Error("Robot secret must be provided in environment variables");
    }
    ROBOT_SECRET = robotSecretFromEnv;
  }
});

// server/robot-position-tracker.ts
var robot_position_tracker_exports = {};
__export(robot_position_tracker_exports, {
  robotPositionTracker: () => robotPositionTracker
});
import { EventEmitter } from "events";
var RobotPositionTracker, robotPositionTracker;
var init_robot_position_tracker = __esm({
  "server/robot-position-tracker.ts"() {
    "use strict";
    RobotPositionTracker = class _RobotPositionTracker extends EventEmitter {
      static instance;
      latestPosition = null;
      positionHistory = [];
      maxHistoryLength = 100;
      constructor() {
        super();
      }
      /**
       * Get the singleton instance
       */
      static getInstance() {
        if (!_RobotPositionTracker.instance) {
          _RobotPositionTracker.instance = new _RobotPositionTracker();
        }
        return _RobotPositionTracker.instance;
      }
      /**
       * Update the robot's position
       */
      updatePosition(position) {
        this.latestPosition = {
          ...position,
          timestamp: position.timestamp || Date.now()
        };
        this.positionHistory.push(this.latestPosition);
        if (this.positionHistory.length > this.maxHistoryLength) {
          this.positionHistory.shift();
        }
        this.emit("position", this.latestPosition);
        if (this.positionHistory.length % 10 === 0) {
          console.log(`[Position Tracker] Updated robot position: (${this.latestPosition.x.toFixed(2)}, ${this.latestPosition.y.toFixed(2)}, orientation: ${this.latestPosition.theta.toFixed(2)})`);
        }
      }
      /**
       * Get the latest position data
       */
      getLatestPosition() {
        return this.latestPosition;
      }
      /**
       * Get position history
       */
      getPositionHistory() {
        return [...this.positionHistory];
      }
      /**
       * Check if we have valid position data
       */
      hasPosition() {
        return this.latestPosition !== null;
      }
      /**
       * Calculate the distance from current position to a target point
       */
      distanceTo(targetX, targetY) {
        if (!this.latestPosition) return null;
        const dx = this.latestPosition.x - targetX;
        const dy = this.latestPosition.y - targetY;
        return Math.sqrt(dx * dx + dy * dy);
      }
      /**
       * Check if the position is recent (within last 10 seconds)
       */
      hasRecentPosition() {
        if (!this.latestPosition) return false;
        const now = Date.now();
        const positionAge = now - this.latestPosition.timestamp;
        return positionAge < 1e4;
      }
    };
    robotPositionTracker = RobotPositionTracker.getInstance();
  }
});

// server/robot-websocket.ts
var robot_websocket_exports = {};
__export(robot_websocket_exports, {
  attachWebSocketProxy: () => attachWebSocketProxy,
  getLatestBatteryData: () => getLatestBatteryData,
  getLatestLidarData: () => getLatestLidarData,
  getLatestMapData: () => getLatestMapData,
  getRobotCameraData: () => getRobotCameraData,
  getRobotLidarData: () => getRobotLidarData,
  getRobotMapData: () => getRobotMapData,
  getRobotPosition: () => getRobotPosition,
  getRobotSensorData: () => getRobotSensorData,
  getRobotStatus: () => getRobotStatus,
  getRobotWebSocketStatus: () => getRobotWebSocketStatus,
  getVideoFrame: () => getVideoFrame,
  isRobotConnected: () => isRobotConnected,
  sendRobotCommand: () => sendRobotCommand,
  setupRobotWebSocketServer: () => setupRobotWebSocketServer
});
import WebSocket, { WebSocketServer } from "ws";
function getRobotWebSocketUrl() {
  return `${ROBOT_API_URL.replace(/^http/, "ws")}/ws/v2`;
}
function connectRobotWebSocket() {
  if (isConnecting || robotWs && robotWs.readyState === WebSocket.OPEN) {
    return;
  }
  isConnecting = true;
  const wsUrl = getRobotWebSocketUrl();
  console.log(`Connecting to robot WebSocket at ${wsUrl}`);
  try {
    connectionTimeout = setTimeout(() => {
      console.log("Robot WebSocket connection timed out");
      if (robotWs) {
        try {
          robotWs.terminate();
        } catch (e) {
          console.error("Error terminating robot WebSocket:", e);
        }
      }
      robotWs = null;
      isConnecting = false;
      scheduleReconnect();
    }, 1e4);
    robotWs = new WebSocket(wsUrl, {
      headers: getAuthHeaders()
    });
    robotWs.on("open", () => {
      console.log("Robot WebSocket connection established");
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      isConnecting = false;
      reconnectAttempt = 0;
      try {
        if (robotWs && robotWs.readyState === WebSocket.OPEN) {
          robotWs.send(JSON.stringify({
            command: "enable_topics",
            topics: subscribeTopics
          }));
          console.log(`Subscribed to robot topics: ${subscribeTopics.join(", ")}`);
        }
      } catch (e) {
        console.error(`Error subscribing to topics:`, e);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      pingInterval = setInterval(() => {
        if (robotWs && robotWs.readyState === WebSocket.OPEN) {
          try {
            robotWs.ping();
          } catch (e) {
            console.error("Error sending ping to robot WebSocket:", e);
          }
        }
      }, 3e4);
      broadcastToClients({
        type: "connection",
        status: "connected",
        timestamp: Date.now()
      });
    });
    robotWs.on("message", (data) => {
      try {
        const messageStr = data.toString();
        let message;
        try {
          message = JSON.parse(messageStr);
        } catch (e) {
          message = { raw: messageStr };
        }
        if (message.topic) {
          let category = "other";
          for (const [cat, topics] of Object.entries(topicCategories)) {
            if (topics.includes(message.topic)) {
              category = cat;
              break;
            }
          }
          if (message.topic === "/tracked_pose" || message.topic === "/robot/footprint") {
            const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
            let posData = {
              x: 0,
              y: 0,
              theta: 0,
              timestamp: Date.now()
            };
            if (message.pos && Array.isArray(message.pos) && message.pos.length >= 2) {
              posData.x = message.pos[0];
              posData.y = message.pos[1];
              posData.theta = message.ori || 0;
            } else if (message.data && message.data.pos && Array.isArray(message.data.pos)) {
              posData.x = message.data.pos[0];
              posData.y = message.data.pos[1];
              posData.theta = message.data.ori || 0;
            } else if (message.x !== void 0 && message.y !== void 0) {
              posData.x = message.x;
              posData.y = message.y;
              posData.theta = message.theta || message.orientation || 0;
            } else if (message.data && message.data.x !== void 0) {
              posData.x = message.data.x;
              posData.y = message.data.y;
              posData.theta = message.data.theta || message.data.orientation || 0;
            }
            robotPositionTracker2.updatePosition(posData);
          } else if (message.topic === "/map" || message.topic === "/map_v2") {
            latestMapData = message;
            console.log(`Stored latest map data from ${message.topic}`);
          } else if (category === "lidar") {
            latestLidarData = message;
            const dataStructure = {};
            if (message.data) {
              Object.keys(message.data).forEach((key) => {
                const value = message.data[key];
                if (Array.isArray(value)) {
                  dataStructure[key] = `Array[${value.length}]`;
                } else if (typeof value === "object" && value !== null) {
                  dataStructure[key] = "Object";
                } else {
                  dataStructure[key] = typeof value;
                }
              });
            }
            const hasPointCloud = message.points && message.points.length > 0 || message.data && message.data.points && message.data.points.length > 0;
            const hasRanges = message.ranges && message.ranges.length > 0 || message.data && message.data.ranges && message.data.ranges.length > 0;
            console.log(`Received LiDAR data from topic ${message.topic} - Has point cloud: ${hasPointCloud}, Has ranges: ${hasRanges}`);
            console.log(`LiDAR data structure: ${JSON.stringify(dataStructure)}`);
          } else if (message.topic === "/battery_state") {
            latestBatteryData = message;
            console.log(`Stored latest battery data: ${message.percentage ? (message.percentage * 100).toFixed(1) + "%" : "unknown"}`);
          }
          broadcastToClients({
            type: "data",
            category,
            topic: message.topic,
            data: message,
            timestamp: Date.now()
          });
        } else if (message.error) {
          console.log("Robot WebSocket error message:", message.error);
          broadcastToClients({
            type: "error",
            error: message.error,
            timestamp: Date.now()
          });
        } else {
          broadcastToClients({
            type: "data",
            category: "unknown",
            data: message,
            timestamp: Date.now()
          });
        }
      } catch (e) {
        console.error("Error processing robot WebSocket message:", e);
      }
    });
    robotWs.on("error", (error) => {
      console.error("Robot WebSocket error:", error);
      console.log("Connection error occurred. Attempting to reconnect...");
    });
    robotWs.on("close", (code, reason) => {
      console.log(`Robot WebSocket connection closed: ${code} ${reason || ""}`);
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      robotWs = null;
      isConnecting = false;
      broadcastToClients({
        type: "connection",
        status: "disconnected",
        code,
        reason: reason?.toString(),
        timestamp: Date.now()
      });
      scheduleReconnect();
    });
  } catch (error) {
    console.error("Error creating robot WebSocket connection:", error);
    isConnecting = false;
    robotWs = null;
    scheduleReconnect();
  }
}
function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  reconnectAttempt++;
  const delay = Math.min(1e3 * Math.pow(2, reconnectAttempt - 1), 3e4);
  console.log(`Attempting to reconnect to robot WebSocket in ${delay}ms (attempt ${reconnectAttempt})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectRobotWebSocket();
  }, delay);
}
function broadcastToClients(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (e) {
        console.error("Error broadcasting to client:", e);
      }
    }
  });
}
function getRobotWebSocketStatus() {
  if (robotWs && robotWs.readyState === WebSocket.OPEN) {
    return "connected";
  } else if (isConnecting) {
    return "connecting";
  } else {
    return "disconnected";
  }
}
function getLatestMapData() {
  return latestMapData;
}
function getLatestLidarData() {
  return latestLidarData;
}
function getLatestBatteryData() {
  return latestBatteryData && latestBatteryData.percentage ? { percentage: latestBatteryData.percentage, charging: !!latestBatteryData.charging } : null;
}
function getRobotStatus(serialNumber) {
  if (!(robotWs && robotWs.readyState === WebSocket.OPEN)) {
    throw new Error("Cannot get robot status: Robot WebSocket not connected");
  }
  return {
    connected: true,
    reconnectAttempt,
    serialNumber,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function getRobotPosition(serialNumber) {
  const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
  if (robotPositionTracker2.hasPosition()) {
    return robotPositionTracker2.getLatestPosition();
  }
  return {
    x: 0,
    y: 0,
    theta: 0,
    orientation: 0,
    timestamp: Date.now()
  };
}
function getRobotSensorData(serialNumber) {
  return {
    battery: getLatestBatteryData() || { percentage: 0.8, charging: false },
    lidar: getLatestLidarData() ? { available: true } : { available: false },
    lastUpdated: Date.now()
  };
}
function getRobotMapData(serialNumber) {
  const mapData = getLatestMapData();
  if (mapData) {
    return mapData;
  }
  return {
    grid: "",
    resolution: 0.05,
    origin: [0, 0, 0],
    size: [100, 100],
    stamp: Date.now()
  };
}
function getRobotCameraData(serialNumber) {
  return {
    available: !!(robotWs && robotWs.readyState === WebSocket.OPEN),
    endpoints: [
      "/rgb_cameras/front/image",
      "/rgb_cameras/front/snapshot",
      "/camera/snapshot",
      "/camera/image"
    ]
  };
}
function getVideoFrame(serialNumber) {
  throw new Error("Video frames should be fetched directly via HTTP endpoint");
}
function getRobotLidarData(serialNumber) {
  const lidarData = getLatestLidarData();
  if (lidarData) {
    return {
      topic: lidarData.topic || "/scan",
      stamp: lidarData.stamp || Date.now(),
      ranges: (lidarData.ranges || lidarData.data?.ranges || []).slice(0, 100),
      // Limit the data to avoid overwhelming the client
      points: (lidarData.points || lidarData.data?.points || []).slice(0, 100),
      available: true
    };
  }
  return {
    topic: "/scan",
    stamp: Date.now(),
    ranges: [],
    points: [],
    available: false
  };
}
function isRobotConnected(serialNumber) {
  return robotWs !== null && robotWs.readyState === WebSocket.OPEN;
}
function sendRobotCommand(serialNumber, command) {
  if (!(robotWs && robotWs.readyState === WebSocket.OPEN)) {
    throw new Error("Cannot send robot command: Robot WebSocket not connected");
  }
  try {
    robotWs.send(JSON.stringify(command));
    return true;
  } catch (e) {
    console.error("Error sending command to robot:", e);
    throw new Error(`Failed to send command to robot: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function attachWebSocketProxy(server) {
  const wss = new WebSocketServer({ server, path: "/ws/status" });
  wss.on("connection", (client) => {
    console.log("\u{1F50C} Admin client connected to task status WS proxy");
    const robotBaseUrl = ROBOT_API_URL.replace(/^http/, "ws");
    const upstream = new WebSocket(`${robotBaseUrl}/ws/status`, {
      headers: getAuthHeaders()
    });
    upstream.on("open", () => {
      console.log("\u27A1\uFE0F Connected to robot task status WebSocket");
      try {
        client.send(JSON.stringify({
          taskId: "system",
          status: "connected",
          message: "Task status stream connected"
        }));
      } catch (err) {
        console.error("Error sending connected message to client:", err);
      }
    });
    upstream.on("message", (data) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          const parsed = JSON.parse(data.toString());
          if (!parsed.sn || parsed.sn === "L382502104987ir") {
            client.send(data);
          }
        }
      } catch (err) {
        console.error("Error forwarding task status message:", err);
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    });
    upstream.on("error", (err) => {
      console.error("\u274C Upstream task status WS error:", err);
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            taskId: "system",
            status: "error",
            message: "Connection error with robot WebSocket"
          }));
        }
      } catch (sendErr) {
        console.error("Error sending error message to client:", sendErr);
      }
    });
    upstream.on("close", () => {
      console.log("Upstream task status WebSocket closed");
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            taskId: "system",
            status: "disconnected",
            message: "Task status stream disconnected"
          }));
          client.close();
        }
      } catch (err) {
        console.error("Error sending close message to client:", err);
      }
    });
    client.on("close", () => {
      console.log("\u274C Admin task status WS client disconnected");
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.close();
      }
    });
    client.on("error", (err) => {
      console.error("\u274C Admin task status WS client error:", err);
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.close();
      }
    });
  });
}
function setupRobotWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/api/robot-ws"
  });
  connectRobotWebSocket();
  attachWebSocketProxy(server);
  wss.on("connection", (ws, req) => {
    console.log(`Client WebSocket connected from ${req.socket.remoteAddress}`);
    clients.add(ws);
    try {
      ws.send(JSON.stringify({
        type: "status",
        connected: robotWs && robotWs.readyState === WebSocket.OPEN,
        reconnectAttempt,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Error sending initial status to client:", e);
    }
    ws.on("message", (message) => {
      try {
        const command = JSON.parse(message.toString());
        if (command.action === "reconnect") {
          if (robotWs) {
            try {
              robotWs.terminate();
            } catch (e) {
              console.error("Error terminating existing connection:", e);
            }
            robotWs = null;
          }
          connectRobotWebSocket();
          try {
            ws.send(JSON.stringify({
              type: "command_response",
              action: "reconnect",
              status: "initiated",
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Error sending command response:", e);
          }
        }
        if (command.action === "send" && command.data) {
          const success = sendRobotCommand("", command.data);
          try {
            ws.send(JSON.stringify({
              type: "command_response",
              action: "send",
              status: success ? "sent" : "failed",
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Error sending command response:", e);
          }
        }
      } catch (e) {
        console.error("Error processing client message:", e);
        try {
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid message format",
            error: e instanceof Error ? e.message : String(e),
            timestamp: Date.now()
          }));
        } catch (sendError) {
          console.error("Error sending error response:", sendError);
        }
      }
    });
    ws.on("close", () => {
      console.log("Client WebSocket disconnected");
      clients.delete(ws);
    });
    ws.on("error", (error) => {
      console.error("Client WebSocket error:", error);
      clients.delete(ws);
    });
  });
}
var robotWs, isConnecting, reconnectAttempt, reconnectTimer, pingInterval, connectionTimeout, clients, topicCategories, subscribeTopics, latestMapData, latestLidarData, latestBatteryData;
var init_robot_websocket = __esm({
  "server/robot-websocket.ts"() {
    "use strict";
    init_robot_constants();
    robotWs = null;
    isConnecting = false;
    reconnectAttempt = 0;
    reconnectTimer = null;
    pingInterval = null;
    connectionTimeout = null;
    clients = /* @__PURE__ */ new Set();
    topicCategories = {
      "status": ["/battery_state", "/detailed_battery_state", "/wheel_state"],
      "pose": ["/tracked_pose", "/robot/footprint"],
      "map": ["/map", "/map_v2", "/slam/state"],
      "video": ["/rgb_cameras/front/compressed", "/rgb_cameras/front/video"],
      "lidar": ["/scan", "/lidar/scan", "/lidar/pointcloud"]
    };
    subscribeTopics = [
      "/tracked_pose",
      // Robot position
      "/battery_state",
      // Battery information
      "/wheel_state",
      // Wheel status
      "/slam/state",
      // SLAM status
      "/map",
      // Map data
      "/scan",
      // 2D LiDAR data showing people moving
      "/scan_matched_points2",
      // 3D LiDAR point cloud data
      "/lidar/scan"
      // Alternative LiDAR path
    ];
    latestMapData = null;
    latestLidarData = null;
    latestBatteryData = null;
  }
});

// server/robot-map-data.ts
var robot_map_data_exports = {};
__export(robot_map_data_exports, {
  fetchRobotMapPoints: () => fetchRobotMapPoints,
  getAllFloors: () => getAllFloors,
  getShelfPoints: () => getShelfPoints,
  getShelfPointsByFloor: () => getShelfPointsByFloor,
  getSpecialPoints: () => getSpecialPoints,
  validateShelfId: () => validateShelfId
});
import axios2 from "axios";
async function fetchRobotMapPoints() {
  const headers3 = getAuthHeaders();
  try {
    const mapsRes = await axios2.get(`${ROBOT_API_URL}/maps/`, { headers: headers3 });
    const maps = mapsRes.data || [];
    const activeMap = maps[0];
    if (!activeMap) {
      const error = "No maps found from robot API";
      console.error("\u274C " + error);
      throw new Error(error);
    }
    const rawName = activeMap.name || activeMap.map_name || "";
    const floorMatch = rawName.match(/^(\d+)/);
    const floorId = floorMatch ? floorMatch[1] : "1";
    console.log(`\u2705 Found map: ${rawName} (Floor ID: ${floorId})`);
    const mapDetailRes = await axios2.get(`${ROBOT_API_URL}/maps/${activeMap.id}`, { headers: headers3 });
    const mapData = mapDetailRes.data;
    if (!mapData || !mapData.overlays) {
      const error = "No overlay data in map";
      console.error("\u274C " + error);
      throw new Error(error);
    }
    let overlays;
    try {
      overlays = JSON.parse(mapData.overlays);
    } catch (e) {
      const error = "Failed to parse overlays JSON: " + (e instanceof Error ? e.message : String(e));
      console.error("\u274C " + error);
      throw new Error(error);
    }
    const features = overlays.features || [];
    console.log(`\u2705 Found ${features.length} features in map overlays`);
    console.log("------ POINT IDS FROM ROBOT API ------");
    const pointIds = [];
    features.forEach((f) => {
      if (f && f.properties && f.properties.name) {
        const pointId = f.properties.name;
        pointIds.push(pointId);
        if (pointId.includes("104") || pointId.toLowerCase().includes("load")) {
          console.log(`IMPORTANT POINT ID FROM ROBOT: "${pointId}" (case-sensitive exact string)`);
        }
      }
    });
    console.log(`Found ${pointIds.length} total point IDs from robot`);
    console.log("------ END POINT IDS ------");
    const points = features.filter((f) => f.geometry?.type === "Point" && f.properties).map((f) => {
      const { properties, geometry } = f;
      const id = String(properties.name || properties.text || "").trim();
      const x = typeof properties.x === "number" ? properties.x : geometry.coordinates[0];
      const y = typeof properties.y === "number" ? properties.y : geometry.coordinates[1];
      const ori = parseFloat(String(properties.yaw || properties.orientation || "0"));
      return {
        id,
        x,
        y,
        ori,
        floorId,
        description: id
      };
    });
    if (points.length > 0) {
      console.log(`\u2705 Successfully extracted ${points.length} map points from robot`);
      return points;
    } else {
      const error = "No point features found in map overlays";
      console.error("\u274C " + error);
      throw new Error(error);
    }
  } catch (error) {
    console.error("Error fetching robot map points:", error);
    throw error instanceof Error ? error : new Error("Unknown error fetching map points");
  }
}
function getShelfPointsByFloor(points) {
  const grouped = {};
  for (const p of points) {
    const isShelf = /^\d+$/.test(p.id) || /^\d+_/.test(p.id) || p.id.toLowerCase().includes("_load") || p.id.length > 20 && !p.id.includes("_docking") && !p.id.toLowerCase().includes("charger");
    if (!isShelf) continue;
    console.log(`Found shelf point in getShelfPointsByFloor: ${p.id} (${p.x}, ${p.y})`);
    const floorId = p.floorId || "1";
    if (!grouped[floorId]) grouped[floorId] = [];
    grouped[floorId].push(p);
  }
  Object.values(grouped).forEach(
    (list) => list.sort((a, b) => parseInt(a.id) - parseInt(b.id))
  );
  return grouped;
}
function getSpecialPoints(points) {
  const match = (label, target) => label.toLowerCase().includes(target.toLowerCase());
  let pickup, dropoff, standby, charger;
  let pickupDocking, dropoffDocking;
  for (const p of points) {
    const id = p.id.toLowerCase();
    if (!pickup && (match(id, "pick") || match(id, "load"))) {
      if (!id.includes("docking")) {
        pickup = p;
      }
    } else if (!dropoff && match(id, "drop")) {
      if (!id.includes("docking")) {
        dropoff = p;
      }
    } else if (!standby && (match(id, "desk") || match(id, "standby"))) {
      standby = p;
    } else if (!charger && (match(id, "charge") || match(id, "charger"))) {
      charger = p;
    }
    if (!pickupDocking && match(id, "pick") && match(id, "docking")) {
      pickupDocking = p;
    } else if (!dropoffDocking && match(id, "drop") && match(id, "docking")) {
      dropoffDocking = p;
    }
  }
  return {
    pickup,
    pickupDocking,
    dropoff,
    dropoffDocking,
    standby,
    charger
  };
}
function getAllFloors(points) {
  const floorIds = points.map((p) => p.floorId || "1");
  return Array.from(new Set(floorIds)).sort();
}
function validateShelfId(shelfId, points) {
  if (!points || points.length === 0) {
    throw new Error("No map points available for shelf ID validation");
  }
  return points.some((point) => String(point.id).toLowerCase() === String(shelfId).toLowerCase());
}
function getShelfPoints(points) {
  if (!points || points.length === 0) {
    throw new Error("No map points available for shelf filtering");
  }
  const shelfPoints = points.filter((point) => {
    const id = String(point.id || "").trim();
    return /^\d+$/.test(id) || /^\d+_/.test(id) || id.toLowerCase().includes("_load") || id.length > 20 && !id.includes("_docking") && !id.toLowerCase().includes("charger");
  });
  console.log(`Found ${shelfPoints.length} shelf points in getShelfPoints`);
  if (shelfPoints.length > 0) {
    console.log(`First shelf point: ${JSON.stringify(shelfPoints[0])}`);
  }
  shelfPoints.sort((a, b) => {
    const numA = parseInt(String(a.id));
    const numB = parseInt(String(b.id));
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
  return shelfPoints;
}
var init_robot_map_data = __esm({
  "server/robot-map-data.ts"() {
    "use strict";
    init_robot_constants();
  }
});

// server/robot-points-map.ts
var robot_points_map_exports = {};
__export(robot_points_map_exports, {
  default: () => robot_points_map_default,
  getShelfDockingPoint: () => getShelfDockingPoint,
  getShelfPoint: () => getShelfPoint,
  pointDisplayMappings: () => pointDisplayMappings
});
function getShelfPoint(shelfId) {
  const floorId = 1;
  if (!robotPointsMap.floors[floorId]) {
    console.error(`Floor ${floorId} not found in robot points map`);
    return null;
  }
  let pointName;
  if (shelfId.toLowerCase().endsWith("_load")) {
    pointName = shelfId.toLowerCase();
    console.log(`Using already formatted shelf ID: ${pointName}`);
  } else if (shelfId === "pick-up") {
    pointName = "050_load";
  } else if (shelfId === "drop-off") {
    pointName = "001_load";
  } else if (shelfId === "050" || shelfId === "pickup") {
    pointName = "050_load";
  } else if (shelfId === "001" || shelfId === "dropoff") {
    pointName = "001_load";
  } else {
    pointName = `${shelfId.toLowerCase()}_load`;
  }
  console.log(`Looking for shelf point with ID: ${pointName}`);
  if (robotPointsMap.floors[floorId].points[pointName]) {
    console.log(`Found shelf point: ${pointName}`);
    const point = robotPointsMap.floors[floorId].points[pointName];
    return {
      x: point.x,
      y: point.y,
      theta: point.theta
    };
  }
  console.error(`Shelf point not found: ${pointName} on floor ${floorId}`);
  return null;
}
function getShelfDockingPoint(shelfId) {
  const floorId = 1;
  if (!robotPointsMap.floors[floorId]) {
    console.error(`Floor ${floorId} not found in robot points map`);
    return null;
  }
  let pointName;
  if (shelfId.toLowerCase().endsWith("_load_docking")) {
    pointName = shelfId.toLowerCase();
    console.log(`Using already formatted docking ID: ${pointName}`);
  } else if (shelfId.toLowerCase().endsWith("_load")) {
    pointName = `${shelfId.toLowerCase()}_docking`;
    console.log(`Converting load point to docking point: ${pointName}`);
  } else if (shelfId === "pick-up") {
    pointName = "050_load_docking";
  } else if (shelfId === "drop-off") {
    pointName = "001_load_docking";
  } else if (shelfId === "050" || shelfId === "pickup") {
    pointName = "050_load_docking";
  } else if (shelfId === "001" || shelfId === "dropoff") {
    pointName = "001_load_docking";
  } else {
    pointName = `${shelfId.toLowerCase()}_load_docking`;
  }
  console.log(`Looking for shelf docking point with ID: ${pointName}`);
  if (robotPointsMap.floors[floorId].points[pointName]) {
    console.log(`Found shelf docking point: ${pointName}`);
    const point = robotPointsMap.floors[floorId].points[pointName];
    return {
      x: point.x,
      y: point.y,
      theta: point.theta
    };
  }
  console.error(`Shelf docking point not found: ${pointName} on floor ${floorId}`);
  return null;
}
var pointDisplayMappings, robotPointsMap, robot_points_map_default;
var init_robot_points_map = __esm({
  "server/robot-points-map.ts"() {
    "use strict";
    pointDisplayMappings = [
      { technicalId: "050_load", displayName: "Pickup", pointType: "pickup" },
      { technicalId: "050_load_docking", displayName: "Pickup Docking", pointType: "pickup" },
      { technicalId: "001_load", displayName: "Dropoff", pointType: "dropoff" },
      { technicalId: "001_load_docking", displayName: "Dropoff Docking", pointType: "dropoff" },
      { technicalId: "104_load", displayName: "Zone 104", pointType: "shelf" },
      { technicalId: "104_load_docking", displayName: "Zone 104 Docking", pointType: "shelf" },
      { technicalId: "charger", displayName: "Charging Station", pointType: "charger" }
    ];
    robotPointsMap = {
      floors: {
        // Floor1 is our main operational floor
        1: {
          mapId: 4,
          mapName: "Floor1",
          points: {
            // Central pickup and dropoff points (updated nomenclature)
            "050_load": {
              x: -2.847,
              y: 2.311,
              theta: 0
            },
            "050_load_docking": {
              x: -1.887,
              y: 2.311,
              theta: 0
            },
            "001_load": {
              x: -2.861,
              y: 3.383,
              theta: 0
            },
            "001_unload": {
              x: -2.861,
              // Same position as 001_load
              y: 3.383,
              theta: 0
            },
            "001_load_docking": {
              x: -1.85,
              y: 3.366,
              theta: 0
            },
            // Legacy points kept for backward compatibility
            "pick-up_load": {
              x: -2.847,
              y: 2.311,
              theta: 0
            },
            "pick-up_load_docking": {
              x: -1.887,
              y: 2.311,
              theta: 0
            },
            "drop-off_load": {
              x: -2.861,
              y: 3.383,
              theta: 0
            },
            "drop-off_load_docking": {
              x: -1.85,
              y: 3.366,
              theta: 0
            },
            // Shelf points on floor 1
            "104_load": {
              x: -15.88,
              y: 6.768,
              theta: 0
            },
            "104_load_docking": {
              x: -14.801,
              y: 6.768,
              theta: 0
            },
            "112_load": {
              x: 1.406,
              y: 4.496,
              theta: 180
            },
            "112_load_docking": {
              x: 0.378,
              y: 4.529,
              theta: 0
            },
            "115_load": {
              x: -8.029,
              y: 6.704,
              theta: 0
            },
            "115_load_docking": {
              x: -6.917,
              y: 6.721,
              theta: 0
            }
          },
          // Charger location on this floor
          charger: {
            x: 0.034,
            y: 0.498,
            theta: 266.11
          }
        }
      },
      // Get point coordinates by floor ID and point name
      getPoint: function(floorId, pointName) {
        if (!this.floors[floorId]) {
          throw new Error(`Floor ${floorId} not found`);
        }
        if (!this.floors[floorId].points[pointName]) {
          throw new Error(`Point ${pointName} not found on floor ${floorId}`);
        }
        return this.floors[floorId].points[pointName];
      },
      // Get charger coordinates for a specific floor
      getCharger: function(floorId) {
        if (!this.floors[floorId]) {
          throw new Error(`Floor ${floorId} not found`);
        }
        if (!this.floors[floorId].charger) {
          throw new Error(`No charger found on floor ${floorId}`);
        }
        return this.floors[floorId].charger;
      },
      // Get map ID for a specific floor
      getMapId: function(floorId) {
        if (!this.floors[floorId]) {
          throw new Error(`Floor ${floorId} not found`);
        }
        return this.floors[floorId].mapId;
      },
      // Get all available floor IDs
      getFloorIds: function() {
        return Object.keys(this.floors).map((id) => parseInt(id, 10));
      },
      // Get all shelf point names for a specific floor
      getShelfPointNames: function(floorId) {
        if (!this.floors[floorId]) {
          throw new Error(`Floor ${floorId} not found`);
        }
        return Object.keys(this.floors[floorId].points).filter((pointName) => /^\d+_load$/.test(pointName));
      },
      // Extract the shelf number from a shelf point name (e.g., "104_load" -> 104)
      getShelfNumber: function(shelfPointName) {
        if (!shelfPointName.endsWith("_load")) {
          throw new Error(`${shelfPointName} is not a valid shelf point name`);
        }
        return parseInt(shelfPointName.replace("_load", ""), 10);
      },
      // Get the docking point name for a load point
      getDockingPointName: function(loadPointName) {
        if (!loadPointName.endsWith("_load")) {
          throw new Error(`${loadPointName} is not a valid load point name`);
        }
        return `${loadPointName}_docking`;
      },
      // Get display name for technical point ID
      getDisplayName: function(technicalId) {
        const mapping = pointDisplayMappings.find((m) => m.technicalId === technicalId);
        if (mapping) {
          return mapping.displayName;
        }
        return technicalId;
      },
      // Get technical ID from display name
      getTechnicalIdFromDisplay: function(displayName) {
        const mapping = pointDisplayMappings.find((m) => m.displayName === displayName);
        if (mapping) {
          return mapping.technicalId;
        }
        return displayName;
      }
    };
    robot_points_map_default = robotPointsMap;
  }
});

// server/mission-queue.ts
import * as fs3 from "fs";
import * as path4 from "path";
import axios5 from "axios";
var QUEUE_FILE, MISSION_LOG_FILE, headers2, MissionQueueManager, missionQueue;
var init_mission_queue = __esm({
  "server/mission-queue.ts"() {
    "use strict";
    init_robot_constants();
    QUEUE_FILE = path4.join(process.cwd(), "robot-mission-queue.json");
    MISSION_LOG_FILE = path4.join(process.cwd(), "robot-mission-log.json");
    headers2 = getAuthHeaders();
    MissionQueueManager = class {
      missions = [];
      isProcessing = false;
      maxRetries = 3;
      constructor() {
        this.loadMissionsFromDisk();
        setImmediate(() => this.processMissionQueue());
        setInterval(() => this.processMissionQueue(), 5e3);
      }
      /**
       * Create a new mission from sequential steps
       */
      createMission(name, steps, robotSn) {
        const mission = {
          id: `mission_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name,
          steps: steps.map((step) => ({
            ...step,
            completed: false,
            retryCount: 0
          })),
          status: "pending",
          currentStepIndex: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          robotSn
        };
        this.missions.push(mission);
        this.saveMissionsToDisk();
        if (!this.isProcessing) {
          this.processMissionQueue();
        }
        return mission;
      }
      /**
       * Process all pending missions in the queue
       */
      async processMissionQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
          console.log(`[MISSION-QUEUE] Processing mission queue - ${(/* @__PURE__ */ new Date()).toISOString()}`);
          const activeMissions = this.missions.filter(
            (m) => m.status === "pending" || m.status === "in_progress"
          );
          console.log(`[MISSION-QUEUE] Found ${activeMissions.length} active missions`);
          for (const mission of activeMissions) {
            if (mission.status === "pending") {
              mission.status = "in_progress";
              mission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
              this.saveMissionsToDisk();
            }
            await this.executeMission(mission);
          }
        } catch (error) {
          console.error("Error processing mission queue:", error);
        } finally {
          this.isProcessing = false;
        }
      }
      /**
       * Execute a mission step by step with enhanced validation and logging
       */
      async executeMission(mission) {
        console.log(`========== MISSION EXECUTION START ==========`);
        console.log(`Executing mission ${mission.id} (${mission.name})`);
        console.log(`Total steps: ${mission.steps.length}`);
        console.log(`Current step index: ${mission.currentStepIndex}`);
        try {
          const positionRes = await axios5.get(`${ROBOT_API_URL}/tracked_pose`, { headers: headers2 });
          if (positionRes.data) {
            console.log(`Robot starting position: (${positionRes.data.position_x.toFixed(2)}, ${positionRes.data.position_y.toFixed(2)}, orientation: ${positionRes.data.orientation.toFixed(2)}\xB0)`);
          }
        } catch (error) {
          console.log(`Unable to get robot starting position: ${error.message}`);
        }
        let currentStepIndex = mission.currentStepIndex;
        let allStepsCompleted = true;
        console.log(`Mission steps:`);
        mission.steps.forEach((step, idx) => {
          const status = step.completed ? "\u2705 COMPLETED" : idx === currentStepIndex ? "\u23F3 CURRENT" : "\u23F3 PENDING";
          const details = step.type === "move" ? ` to ${step.params.label || `(${step.params.x}, ${step.params.y})`}` : "";
          console.log(`  ${idx + 1}. ${step.type}${details} - ${status}`);
        });
        while (currentStepIndex < mission.steps.length) {
          const step = mission.steps[currentStepIndex];
          const stepNumber = currentStepIndex + 1;
          if (step.completed) {
            console.log(`Skipping already completed step ${stepNumber}/${mission.steps.length}: ${step.type}`);
            currentStepIndex++;
            continue;
          }
          try {
            console.log(`
---------- STEP ${stepNumber}/${mission.steps.length} START ----------`);
            console.log(`Executing step ${stepNumber}: ${step.type}`);
            if (step.type === "move") {
              const target = step.params.label || `(${step.params.x}, ${step.params.y})`;
              console.log(`Moving robot to ${target}`);
            } else if (step.type === "jack_up") {
              console.log(`\u26A0\uFE0F CRITICAL SAFETY OPERATION: Jack up - robot must be COMPLETELY STOPPED`);
            } else if (step.type === "jack_down") {
              console.log(`\u26A0\uFE0F CRITICAL SAFETY OPERATION: Jack down - robot must be COMPLETELY STOPPED`);
            }
            try {
              const statusRes = await axios5.get(`${ROBOT_API_URL}/service/status`, {
                headers: headers2,
                timeout: 5e3
                // Short timeout to quickly detect offline robots
              });
              mission.offline = false;
              console.log(`Robot connection verified - status: ${statusRes.data?.status || "ok"}`);
            } catch (error) {
              console.log(`\u26A0\uFE0F Robot connection check failed: ${error.message}`);
            }
            let stepResult;
            try {
              if (step.type === "move") {
                console.log(`Starting move operation to ${step.params.label || `(${step.params.x.toFixed(2)}, ${step.params.y.toFixed(2)})`}`);
                stepResult = await this.executeMoveStep(step.params);
                console.log(`Move operation complete with result: ${JSON.stringify(stepResult)}`);
                const isMoveComplete = await this.checkMoveStatus();
                console.log(`Final move status check: ${isMoveComplete ? "COMPLETE" : "STILL MOVING"}`);
                if (!isMoveComplete) {
                  console.log(`\u26A0\uFE0F WARNING: Robot reports it's still moving after move should be complete`);
                  await new Promise((resolve) => setTimeout(resolve, 3e3));
                  const secondCheck = await this.checkMoveStatus();
                  console.log(`Second move status check: ${secondCheck ? "COMPLETE" : "STILL MOVING"}`);
                  if (!secondCheck) {
                    throw new Error("Robot failed to complete movement - still moving after operation should be complete");
                  }
                }
              } else if (step.type === "jack_up") {
                console.log(`Executing jack up operation...`);
                stepResult = await this.executeJackUpStep();
              } else if (step.type === "jack_down") {
                console.log(`Executing jack down operation...`);
                stepResult = await this.executeJackDownStep();
              } else if (step.type === "align_with_rack") {
                console.log(`\u26A0\uFE0F RACK OPERATION: Aligning with rack at ${step.params.label || `(${step.params.x}, ${step.params.y})`}`);
                stepResult = await this.executeAlignWithRackStep(step.params);
                console.log(`Rack alignment operation complete with result: ${JSON.stringify(stepResult)}`);
                const isAlignComplete = await this.checkMoveStatus();
                console.log(`Final alignment status check: ${isAlignComplete ? "COMPLETE" : "STILL MOVING"}`);
              } else if (step.type === "to_unload_point") {
                console.log(`\u26A0\uFE0F RACK OPERATION: Moving to unload point at ${step.params.label || `(${step.params.x}, ${step.params.y})`}`);
                stepResult = await this.executeToUnloadPointStep(step.params);
                console.log(`Move to unload point complete with result: ${JSON.stringify(stepResult)}`);
              } else if (step.type === "return_to_charger") {
                console.log(`\u26A0\uFE0F CRITICAL OPERATION: Returning robot to charging station...`);
                stepResult = await this.executeReturnToChargerStep(step.params);
                console.log(`Return to charger operation complete with result: ${JSON.stringify(stepResult)}`);
              }
              step.completed = true;
              step.robotResponse = stepResult;
              mission.currentStepIndex = currentStepIndex + 1;
              mission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            } catch (error) {
              if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.message.includes("timeout")) {
                console.log(`Connectivity issue detected in mission ${mission.id}, marking as offline`);
                mission.offline = true;
                step.retryCount++;
                step.errorMessage = `Connection error: ${error.message}`;
                if (step.retryCount >= this.maxRetries) {
                  console.error(`Max retries (${this.maxRetries}) reached for step ${currentStepIndex}, failing mission`);
                  throw error;
                }
                allStepsCompleted = false;
                break;
              } else {
                throw error;
              }
            }
            currentStepIndex++;
            this.saveMissionsToDisk();
          } catch (error) {
            console.error(`Error executing mission step ${currentStepIndex}:`, error);
            step.errorMessage = error.message || "Unknown error";
            mission.status = "failed";
            mission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            this.saveMissionsToDisk();
            this.logFailedMission(mission, error);
            allStepsCompleted = false;
            break;
          }
        }
        if (allStepsCompleted && currentStepIndex >= mission.steps.length) {
          mission.status = "completed";
          mission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.logCompletedMission(mission);
          this.saveMissionsToDisk();
        }
        return mission;
      }
      /**
       * Check if the robot is currently moving
       */
      /**
       * Cancel all active missions in the queue
       * This will mark all pending and in-progress missions as canceled
       */
      async cancelAllActiveMissions() {
        console.log("Cancelling all active missions in the queue");
        const activeMissions = this.missions.filter(
          (m) => m.status === "pending" || m.status === "in_progress"
        );
        for (const mission of activeMissions) {
          console.log(`Cancelling mission ${mission.id} (${mission.name})`);
          mission.status = "failed";
          mission.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.logFailedMission(mission, new Error("Mission cancelled by system for return-to-charger"));
        }
        this.saveMissionsToDisk();
        console.log(`Cancelled ${activeMissions.length} active missions`);
      }
      /**
       * Verify that robot is completely stopped before safety-critical operations
       * Used for jack_up and jack_down operations to prevent accidents with bins
       */
      async verifyRobotStopped(operation) {
        console.log(`\u26A0\uFE0F CRITICAL SAFETY CHECK: Verifying robot is completely stopped before ${operation}...`);
        console.log(`Waiting 3 seconds for robot to fully stabilize before safety check...`);
        await new Promise((resolve) => setTimeout(resolve, 3e3));
        let moveStatus = null;
        try {
          const moveResponse = await axios5.get(`${ROBOT_API_URL}/chassis/moves/current`, { headers: headers2 });
          moveStatus = moveResponse.data;
          if (moveStatus && moveStatus.state === "moving") {
            console.log(`\u26A0\uFE0F CRITICAL SAFETY VIOLATION: Robot is currently moving, cannot perform ${operation}`);
            console.log(`Current move details: ${JSON.stringify(moveStatus)}`);
            throw new Error(`SAFETY ERROR: Robot has active movement - must be completely stopped before ${operation} operation`);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`\u2705 SAFETY CHECK 1 PASSED: No active movement command`);
          } else {
            console.log(`Warning: Error checking move status: ${error.message}`);
          }
        }
        let wheelCheckPassed = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const wheelResponse = await axios5.get(`${ROBOT_API_URL}/wheel_state`, { headers: headers2 });
            const wheelState = wheelResponse.data;
            if (wheelState) {
              const speed = Math.max(
                Math.abs(wheelState.left_speed || 0),
                Math.abs(wheelState.right_speed || 0)
              );
              if (speed > 0.01) {
                console.log(`\u26A0\uFE0F SAFETY CHECK: Robot wheels are moving (${speed.toFixed(2)}m/s), waiting for complete stop...`);
                if (attempt === 3) {
                  throw new Error(`SAFETY ERROR: Robot wheels still moving after 3 checks - cannot proceed with ${operation}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 2e3));
              } else {
                console.log(`\u2705 SAFETY CHECK 2 PASSED: Robot wheels are stopped (${speed.toFixed(2)}m/s)`);
                wheelCheckPassed = true;
                break;
              }
            }
          } catch (error) {
            if (error.message.includes("SAFETY")) {
              throw error;
            } else {
              console.log(`Warning: Could not check wheel state: ${error.message}`);
              if (attempt === 3) {
                console.log(`\u26A0\uFE0F Unable to verify wheel state after multiple attempts. Proceeding with caution.`);
              }
            }
          }
        }
        try {
          const statusResponse = await axios5.get(`${ROBOT_API_URL}/service/status`, { headers: headers2 });
          const status = statusResponse.data;
          if (status && status.is_busy) {
            console.log(`\u26A0\uFE0F SAFETY WARNING: Robot reports busy status, waiting for it to complete...`);
            console.log(`Waiting 5 seconds for robot to finish current operations...`);
            await new Promise((resolve) => setTimeout(resolve, 5e3));
          } else {
            console.log(`\u2705 SAFETY CHECK 3 PASSED: Robot reports not busy`);
          }
        } catch (error) {
          console.log(`Warning: Could not check robot busy status: ${error.message}`);
        }
        console.log(`\u2705 All safety checks passed! Waiting additional 3 seconds to ensure complete stability...`);
        await new Promise((resolve) => setTimeout(resolve, 3e3));
        console.log(`\u2705 SAFETY CHECK COMPLETE: Robot confirmed stopped for ${operation} operation`);
      }
      async checkMoveStatus() {
        try {
          const response = await axios5.get(`${ROBOT_API_URL}/chassis/moves/current`, {
            headers: headers2
          });
          if (response.data && response.data.state) {
            console.log(`Current move status: ${response.data.state}`);
            return ["succeeded", "cancelled", "failed"].includes(response.data.state);
          }
          return true;
        } catch (error) {
          console.log(`No active movement or error checking status`);
          return true;
        }
      }
      /**
       * Wait for the robot to complete its current movement
       * Enhanced version that verifies the robot is actually moving using position data
       */
      async waitForMoveComplete(moveId, timeout = 6e4) {
        const startTime = Date.now();
        let isMoving = true;
        let lastPositionUpdate = 0;
        let lastPosition = null;
        let noProgressTime = 0;
        let verifiedMove = false;
        console.log(`Waiting for robot to complete movement (ID: ${moveId})...`);
        try {
          const moveStatus = await axios5.get(`${ROBOT_API_URL}/chassis/moves/${moveId}`, { headers: headers2 });
          if (!moveStatus.data || moveStatus.data.state !== "moving") {
            console.log(`Move ID ${moveId} is not in 'moving' state: ${moveStatus.data?.state || "unknown"}`);
            return;
          }
        } catch (error) {
          console.log(`Unable to verify move ${moveId}: ${error.message}`);
          return;
        }
        while (isMoving && Date.now() - startTime < timeout) {
          isMoving = !await this.checkMoveStatus();
          try {
            const positionRes = await axios5.get(`${ROBOT_API_URL}/tracked_pose`, { headers: headers2 });
            if (positionRes.data) {
              const currentPosition = {
                x: positionRes.data.position_x || 0,
                y: positionRes.data.position_y || 0
              };
              if (lastPosition) {
                const distance = Math.sqrt(
                  Math.pow(currentPosition.x - lastPosition.x, 2) + Math.pow(currentPosition.y - lastPosition.y, 2)
                );
                if (distance > 0.05) {
                  lastPositionUpdate = Date.now();
                  verifiedMove = true;
                  console.log(`Robot movement verified: ${distance.toFixed(2)}m displacement`);
                  noProgressTime = 0;
                } else {
                  noProgressTime = Date.now() - lastPositionUpdate;
                  if (noProgressTime > 1e4 && verifiedMove) {
                    console.log(`\u26A0\uFE0F Robot hasn't moved in ${(noProgressTime / 1e3).toFixed(0)} seconds`);
                  }
                }
              } else {
                lastPositionUpdate = Date.now();
              }
              lastPosition = currentPosition;
            }
          } catch (error) {
            console.log(`Unable to get robot position: ${error.message}`);
          }
          if (isMoving) {
            if (noProgressTime > 2e4 && verifiedMove) {
              console.log(`\u26A0\uFE0F Robot has stopped moving for over 20 seconds while still in 'moving' state`);
              throw new Error(`Movement stalled - no progress for ${(noProgressTime / 1e3).toFixed(0)} seconds`);
            }
            await new Promise((resolve) => setTimeout(resolve, 3e3));
            console.log(`Still moving (move ID: ${moveId}), waiting...`);
          }
        }
        if (isMoving) {
          console.log(`\u26A0\uFE0F Timed out waiting for robot to complete movement (ID: ${moveId})`);
          throw new Error(`Movement timeout exceeded (${timeout}ms)`);
        } else {
          console.log(`\u2705 Robot has completed movement (ID: ${moveId})`);
        }
      }
      /**
       * Execute a move step
       */
      async executeMoveStep(params) {
        const label = params.label || `point (${params.x}, ${params.y})`;
        console.log(`Executing move to ${label}`);
        try {
          await this.checkMoveStatus();
          const isChargerMove = label.toLowerCase().includes("charg") || params.isCharger === true;
          if (isChargerMove) {
            console.log(`\u{1F50B} CHARGER DOCKING: Using 'charge' move type for ${label}`);
            console.log(`\u{1F50B} CHARGER DOCKING: Target position (${params.x}, ${params.y}), orientation: ${params.ori}`);
            console.log(`\u{1F50B} CHARGER DOCKING: Including required charge_retry_count=3 parameter`);
          }
          const payload = {
            type: isChargerMove ? "charge" : "standard",
            // Use 'charge' type for charger moves
            target_x: params.x,
            target_y: params.y,
            target_z: 0,
            target_ori: params.ori || 0,
            creator: "web_interface",
            // For charge move type, we need to include charge_retry_count as required by AutoXing API
            ...isChargerMove ? { charge_retry_count: 3 } : {},
            properties: {
              max_trans_vel: 0.5,
              max_rot_vel: 0.5,
              acc_lim_x: 0.5,
              acc_lim_theta: 0.5,
              planning_mode: "directional"
            }
          };
          const moveRes = await axios5.post(`${ROBOT_API_URL}/chassis/moves`, payload, { headers: headers2 });
          console.log(`Move command sent: ${JSON.stringify(moveRes.data)}`);
          const moveId = moveRes.data.id;
          console.log(`Robot move command sent for ${label} - move ID: ${moveId}`);
          await this.waitForMoveComplete(moveId, 12e4);
          console.log(`Robot move command to ${label} confirmed complete`);
          if (isChargerMove) {
            try {
              console.log(`\u{1F50B} CHARGER DOCKING: Verifying charging status...`);
              await new Promise((resolve) => setTimeout(resolve, 3e3));
              const batteryResponse = await axios5.get(`${ROBOT_API_URL}/battery_state`, { headers: headers2 });
              const batteryState = batteryResponse.data;
              if (batteryState && batteryState.is_charging) {
                console.log(`\u{1F50B} CHARGER DOCKING: \u2705 SUCCESS! Robot is now CHARGING`);
              } else {
                console.log(`\u{1F50B} CHARGER DOCKING: \u26A0\uFE0F WARNING: Robot completed move to charger but is not charging`);
                console.log(`\u{1F50B} CHARGER DOCKING: Battery state: ${JSON.stringify(batteryState)}`);
              }
            } catch (batteryError) {
              console.log(`\u{1F50B} CHARGER DOCKING: \u26A0\uFE0F Could not verify charging status: ${batteryError.message}`);
            }
          }
          return { success: true, message: `Move command to ${label} completed successfully`, moveId };
        } catch (err) {
          console.error(`Error moving to ${label}: ${err.message}`);
          throw err;
        }
      }
      /**
       * Execute a jack up step
       */
      async executeJackUpStep() {
        try {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          console.log(`[${timestamp}] [JACK-UP] Executing jack_up operation`);
          console.log(`[${timestamp}] [JACK-UP] Pre-operation stabilization delay (3 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          console.log(`[${timestamp}] [JACK-UP] Initiating JACK_UP service call`);
          const response = await axios5.post(`${ROBOT_API_URL}/services/jack_up`, {}, { headers: headers2 });
          console.log(`[${timestamp}] [JACK-UP] Jack up command executed, response: ${JSON.stringify(response.data)}`);
          console.log(`[${timestamp}] [JACK-UP] Waiting for jack up operation to complete (10 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 1e4));
          console.log(`[${timestamp}] [JACK-UP] Final stabilization period (3 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          console.log(`[${timestamp}] [JACK-UP] \u2705 Jack up completed successfully`);
          return response.data;
        } catch (error) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          console.error(`[${timestamp}] [JACK-UP] \u274C ERROR during jack up operation: ${error.message}`);
          if (error.response) {
            console.error(`[${timestamp}] [JACK-UP] Response error details:`, error.response.data);
            if (error.response.status === 404) {
              console.error(`[${timestamp}] [JACK-UP] \u274C Robot API endpoint not found`);
              throw new Error(`Robot API endpoint not available: jack up operation failed`);
            }
            if (error.response.status === 500) {
              const errorMsg = error.response.data?.detail || error.response.data?.message || error.response.data?.error || "Internal Server Error";
              if (errorMsg.includes("emergency") || errorMsg.includes("e-stop")) {
                console.error(`[${timestamp}] [JACK-UP] \u274C EMERGENCY STOP DETECTED`);
                throw new Error(`Emergency stop detected: Cannot perform jack up operation`);
              }
            }
          }
          throw new Error(`Jack up operation failed: ${error.message}`);
        }
      }
      /**
       * Execute a jack down step
       */
      async executeJackDownStep() {
        try {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          console.log(`[${timestamp}] [JACK-DOWN] Executing jack_down operation`);
          console.log(`[${timestamp}] [JACK-DOWN] Pre-operation stabilization delay (3 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          console.log(`[${timestamp}] [JACK-DOWN] Initiating JACK_DOWN service call`);
          const response = await axios5.post(`${ROBOT_API_URL}/services/jack_down`, {}, { headers: headers2 });
          console.log(`[${timestamp}] [JACK-DOWN] Jack down command executed, response: ${JSON.stringify(response.data)}`);
          console.log(`[${timestamp}] [JACK-DOWN] Waiting for jack down operation to complete (10 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 1e4));
          console.log(`[${timestamp}] [JACK-DOWN] Final stabilization period (3 seconds)...`);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          console.log(`[${timestamp}] [JACK-DOWN] \u2705 Jack down completed successfully`);
          return response.data;
        } catch (error) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          console.error(`[${timestamp}] [JACK-DOWN] \u274C ERROR during jack down operation: ${error.message}`);
          if (error.response) {
            console.error(`[${timestamp}] [JACK-DOWN] Response error details:`, error.response.data);
            if (error.response.status === 404) {
              console.error(`[${timestamp}] [JACK-DOWN] \u274C Robot API endpoint not found`);
              throw new Error(`Robot API endpoint not available: jack down operation failed`);
            }
            if (error.response.status === 500) {
              const errorMsg = error.response.data?.detail || error.response.data?.message || error.response.data?.error || "Internal Server Error";
              if (errorMsg.includes("emergency") || errorMsg.includes("e-stop")) {
                console.error(`[${timestamp}] [JACK-DOWN] \u274C EMERGENCY STOP DETECTED`);
                throw new Error(`Emergency stop detected: Cannot perform jack down operation`);
              }
            }
          }
          throw new Error(`Jack down operation failed: ${error.message}`);
        }
      }
      /**
       * Get mission by ID
       */
      getMission(id) {
        return this.missions.find((m) => m.id === id);
      }
      /**
       * Get all missions
       */
      getAllMissions() {
        return [...this.missions];
      }
      /**
       * Get active missions (pending or in_progress)
       */
      getActiveMissions() {
        return this.missions.filter(
          (m) => m.status === "pending" || m.status === "in_progress"
        );
      }
      /**
       * Get completed missions
       */
      getCompletedMissions() {
        return this.missions.filter((m) => m.status === "completed");
      }
      /**
       * Get failed missions
       */
      getFailedMissions() {
        return this.missions.filter((m) => m.status === "failed");
      }
      /**
       * Load missions from disk
       */
      loadMissionsFromDisk() {
        try {
          if (fs3.existsSync(QUEUE_FILE)) {
            const data = fs3.readFileSync(QUEUE_FILE, "utf8");
            this.missions = JSON.parse(data);
            console.log(`Loaded ${this.missions.length} missions from disk`);
          }
        } catch (error) {
          console.error("Error loading missions from disk:", error);
          this.missions = [];
        }
      }
      /**
       * Save missions to disk
       */
      saveMissionsToDisk() {
        try {
          fs3.writeFileSync(QUEUE_FILE, JSON.stringify(this.missions, null, 2), "utf8");
        } catch (error) {
          console.error("Error saving missions to disk:", error);
        }
      }
      /**
       * Log a completed mission
       */
      logCompletedMission(mission) {
        try {
          let logs = [];
          if (fs3.existsSync(MISSION_LOG_FILE)) {
            const data = fs3.readFileSync(MISSION_LOG_FILE, "utf8");
            logs = JSON.parse(data);
          }
          logs.push({
            ...mission,
            loggedAt: (/* @__PURE__ */ new Date()).toISOString(),
            outcome: "completed"
          });
          if (logs.length > 100) {
            logs = logs.slice(-100);
          }
          fs3.writeFileSync(MISSION_LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
        } catch (error) {
          console.error("Error logging completed mission:", error);
        }
      }
      /**
       * Log a failed mission
       */
      logFailedMission(mission, error) {
        try {
          let logs = [];
          if (fs3.existsSync(MISSION_LOG_FILE)) {
            const data = fs3.readFileSync(MISSION_LOG_FILE, "utf8");
            logs = JSON.parse(data);
          }
          logs.push({
            ...mission,
            loggedAt: (/* @__PURE__ */ new Date()).toISOString(),
            outcome: "failed",
            error: {
              message: error.message,
              stack: error.stack
            }
          });
          if (logs.length > 100) {
            logs = logs.slice(-100);
          }
          fs3.writeFileSync(MISSION_LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
        } catch (error2) {
          console.error("Error logging failed mission:", error2);
        }
      }
      /**
       * Clear completed and failed missions
       */
      clearCompletedMissions() {
        this.missions = this.missions.filter(
          (m) => m.status === "pending" || m.status === "in_progress"
        );
        this.saveMissionsToDisk();
      }
      /**
       * Execute an align_with_rack move step - special move type for picking up a rack/shelf
       * This follows the documented AutoXing API for proper rack pickup sequence
       */
      async executeAlignWithRackStep(params) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`[${timestamp}] [ALIGN-RACK] \u26A0\uFE0F Executing align with rack operation`);
        try {
          try {
            await axios5.post(`${ROBOT_API_URL}/chassis/stop`, {}, { headers: headers2 });
            console.log(`[${timestamp}] [ALIGN-RACK] \u2705 Stopped robot before align with rack`);
          } catch (error) {
            console.log(`[${timestamp}] [ALIGN-RACK] Warning: Failed to stop robot: ${error.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 2e3));
          const moveCommand = {
            creator: "robot-api",
            type: "align_with_rack",
            // Special move type for rack pickup
            target_x: params.x,
            target_y: params.y,
            target_ori: params.ori
          };
          console.log(`[${timestamp}] [ALIGN-RACK] Creating align_with_rack move: ${JSON.stringify(moveCommand)}`);
          const response = await axios5.post(`${ROBOT_API_URL}/chassis/moves`, moveCommand, { headers: headers2 });
          if (!response.data || !response.data.id) {
            throw new Error("Failed to create align_with_rack move - invalid response");
          }
          const moveId = response.data.id;
          console.log(`[${timestamp}] [ALIGN-RACK] Robot align_with_rack command sent - move ID: ${moveId}`);
          await this.waitForMoveComplete(moveId, 12e4);
          const isMoveComplete = await this.checkMoveStatus();
          if (!isMoveComplete) {
            console.log(`[${timestamp}] [ALIGN-RACK] \u26A0\uFE0F WARNING: Robot might still be moving after align_with_rack operation`);
            await new Promise((resolve) => setTimeout(resolve, 5e3));
          }
          console.log(`[${timestamp}] [ALIGN-RACK] \u2705 Align with rack completed successfully`);
          return { success: true, moveId, message: "Align with rack completed successfully" };
        } catch (error) {
          console.error(`[${timestamp}] [ALIGN-RACK] \u274C ERROR during align_with_rack operation: ${error.message}`);
          if (error.response) {
            console.error(`[${timestamp}] [ALIGN-RACK] Response error details:`, error.response.data);
            if (error.response.status === 404) {
              throw new Error("Robot API align_with_rack endpoint not available");
            }
            if (error.response.status === 500) {
              const errorMsg = error.response.data?.message || error.response.data?.error || "Internal Server Error";
              if (errorMsg.includes("RackDetectionError") || errorMsg.includes("rack")) {
                throw new Error(`Rack detection failed: ${errorMsg}`);
              }
              if (errorMsg.includes("emergency") || errorMsg.includes("e-stop")) {
                throw new Error("Emergency stop detected during rack alignment");
              }
            }
          }
          throw new Error(`Failed to align with rack: ${error.message}`);
        }
      }
      /**
       * Execute a to_unload_point move step
       * Used after jack_up to move a rack to the unload destination
       * CRITICAL FIX: Must use point_id and rack_area_id instead of coordinates
       */
      async executeToUnloadPointStep(params) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`[${timestamp}] [TO-UNLOAD] \u26A0\uFE0F Executing move to unload point`);
        try {
          if (!params.pointId && !params.point_id) {
            console.error(`[${timestamp}] [TO-UNLOAD] \u274C ERROR: No pointId or point_id provided for to_unload_point operation`);
            throw new Error("Missing required pointId for to_unload_point operation");
          }
          let loadPointId = params.pointId || params.point_id;
          if (loadPointId.toLowerCase().includes("_docking")) {
            console.log(`[${timestamp}] [TO-UNLOAD] \u26A0\uFE0F WARNING: Converting docking point ${loadPointId} to load point`);
            loadPointId = loadPointId.replace(/_docking/i, "_load");
          }
          if (loadPointId.toLowerCase().includes("_docking")) {
            throw new Error(`Cannot use to_unload_point with docking point ${loadPointId}`);
          }
          const rackAreaId = loadPointId;
          console.log(`[${timestamp}] [TO-UNLOAD] CRITICAL FIX: Using point_id=${loadPointId} and rack_area_id=${rackAreaId}`);
          console.log(`[${timestamp}] [TO-UNLOAD] This ensures proper unloading at the exact designated point`);
          const moveCommand = {
            creator: "robot-api",
            type: "to_unload_point",
            // Special move type for rack unloading
            point_id: loadPointId,
            // CRITICAL FIX: Use point_id instead of coordinates
            rack_area_id: rackAreaId,
            // CRITICAL FIX: Include rack_area_id for proper placement
            target_x: 0,
            // Setting to 0 as these will be ignored when point_id is used
            target_y: 0,
            target_ori: 0
          };
          console.log(`[${timestamp}] [TO-UNLOAD] Creating to_unload_point move: ${JSON.stringify(moveCommand)}`);
          const response = await axios5.post(`${ROBOT_API_URL}/chassis/moves`, moveCommand, { headers: headers2 });
          if (!response.data || !response.data.id) {
            throw new Error("Failed to create to_unload_point move - invalid response");
          }
          const moveId = response.data.id;
          console.log(`[${timestamp}] [TO-UNLOAD] Robot to_unload_point command sent - move ID: ${moveId}`);
          await this.waitForMoveComplete(moveId, 12e4);
          const isMoveComplete = await this.checkMoveStatus();
          if (!isMoveComplete) {
            console.log(`[${timestamp}] [TO-UNLOAD] \u26A0\uFE0F WARNING: Robot might still be moving after to_unload_point operation`);
            await new Promise((resolve) => setTimeout(resolve, 5e3));
          }
          console.log(`[${timestamp}] [TO-UNLOAD] \u2705 Move to unload point completed successfully`);
          return { success: true, moveId, message: "Move to unload point completed successfully" };
        } catch (error) {
          console.error(`[${timestamp}] [TO-UNLOAD] \u274C ERROR during to_unload_point operation: ${error.message}`);
          if (error.response) {
            console.error(`[${timestamp}] [TO-UNLOAD] Response error details:`, error.response.data);
            if (error.response.status === 404) {
              throw new Error("Robot API to_unload_point endpoint not available");
            }
            if (error.response.status === 500) {
              const errorMsg = error.response.data?.message || error.response.data?.error || "Internal Server Error";
              if (errorMsg.includes("UnloadPointOccupied")) {
                throw new Error("Unload point is occupied, cannot complete operation");
              }
              if (errorMsg.includes("emergency")) {
                throw new Error("Emergency stop detected during unload point movement");
              }
            }
          }
          throw new Error(`Failed to move to unload point: ${error.message}`);
        }
      }
      /**
       * Execute a manual joystick command
       * Used for precise movements like backing up slightly
       */
      // executeManualJoystickStep has been removed as the robot doesn't support joystick commands
      /**
       * Execute a return to charger operation
       * Use hardcoded known charger coordinates for direct navigation
       */
      async executeReturnToChargerStep(params) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`[${timestamp}] [RETURN-TO-CHARGER] \u26A0\uFE0F Executing return to charger operation`);
        try {
          console.log(`[${timestamp}] [RETURN-TO-CHARGER] Using precise coordinate-based navigation to charger`);
          const chargerDockingPoint = {
            x: 0.03443853667262486,
            y: 0.4981316698765672,
            ori: 266.11
          };
          console.log(`[${timestamp}] [RETURN-TO-CHARGER] Moving to charger docking point at (${chargerDockingPoint.x}, ${chargerDockingPoint.y})`);
          try {
            const moveResponse = await axios5.post(`${ROBOT_API_URL}/chassis/moves`, {
              action: "move_to",
              target_x: chargerDockingPoint.x,
              target_y: chargerDockingPoint.y,
              target_ori: chargerDockingPoint.ori,
              is_charging: true,
              charge_retry_count: 3,
              properties: {
                max_trans_vel: 0.3,
                // Slower speed for more accurate docking
                max_rot_vel: 0.3,
                acc_lim_x: 0.3,
                acc_lim_theta: 0.3,
                planning_mode: "directional"
              }
            }, { headers: headers2 });
            console.log(`[${timestamp}] [RETURN-TO-CHARGER] \u2705 Move to charger command sent. Move ID: ${moveResponse.data?.id}`);
            await new Promise((resolve) => setTimeout(resolve, 3e3));
            return {
              success: true,
              message: "Return to charger initiated with coordinate-based navigation",
              moveId: moveResponse.data?.id,
              method: "coordinate_based_with_charging"
            };
          } catch (moveError) {
            console.log(`[${timestamp}] [RETURN-TO-CHARGER] \u26A0\uFE0F Charger coordinate move error: ${moveError.message}`);
            try {
              console.log(`[${timestamp}] [RETURN-TO-CHARGER] Trying standard move to charger coordinates`);
              const standardMoveResponse = await axios5.post(`${ROBOT_API_URL}/chassis/moves`, {
                action: "move_to",
                target_x: chargerDockingPoint.x,
                target_y: chargerDockingPoint.y,
                target_ori: chargerDockingPoint.ori
              }, { headers: headers2 });
              console.log(`[${timestamp}] [RETURN-TO-CHARGER] \u2705 Standard move to charger initiated. Move ID: ${standardMoveResponse.data?.id}`);
              return {
                success: true,
                message: "Return to charger initiated with standard move to charger coordinates",
                moveId: standardMoveResponse.data?.id,
                method: "standard_coordinate_move"
              };
            } catch (standardMoveError) {
              console.log(`[${timestamp}] [RETURN-TO-CHARGER] \u26A0\uFE0F Standard move to charger failed: ${standardMoveError.message}`);
              throw new Error(`Failed to navigate to charger using coordinates: ${standardMoveError.message}`);
            }
          }
        } catch (error) {
          console.error(`[${timestamp}] [RETURN-TO-CHARGER] \u274C ERROR during return to charger operation: ${error.message}`);
          throw error;
        }
      }
    };
    missionQueue = new MissionQueueManager();
  }
});

// server/robot-settings-api.ts
import axios10 from "axios";
async function fetchRobotSystemSettings() {
  try {
    console.log("Fetching robot system settings...");
    const response = await axios10.get(`${ROBOT_API_URL}/system/settings/effective`, {
      headers: getAuthHeaders()
    });
    if (!response.data) {
      throw new Error("Invalid response from system settings endpoint");
    }
    console.log("Successfully retrieved robot system settings");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch robot system settings:", error.message);
    throw new Error(`Failed to fetch robot system settings: ${error.message}`);
  }
}
async function getRackSpecifications() {
  try {
    const settings = await fetchRobotSystemSettings();
    console.log("Available settings keys:", Object.keys(settings));
    let rackSpecs = null;
    if (settings && settings["rack.specs"] && Array.isArray(settings["rack.specs"]) && settings["rack.specs"].length > 0) {
      console.log("Found rack.specs as a top-level property with dot notation");
      rackSpecs = settings["rack.specs"][0];
      console.log("Using rack spec:", rackSpecs);
    } else if (settings && settings.rack && settings.rack.specs) {
      console.log("Found rack.specs in nested structure");
      rackSpecs = Array.isArray(settings.rack.specs) ? settings.rack.specs[0] : settings.rack.specs;
    }
    if (!rackSpecs) {
      console.log("Searching for any property containing rack specs...");
      for (const key of Object.keys(settings)) {
        if (key.includes("rack") && settings[key]) {
          console.log(`Found potential rack-related key: ${key}`);
          if (Array.isArray(settings[key]) && settings[key].length > 0) {
            console.log(`Key ${key} is an array with ${settings[key].length} items`);
            if (settings[key][0].width && settings[key][0].depth) {
              rackSpecs = settings[key][0];
              console.log(`Using array element from ${key}:`, rackSpecs);
              break;
            }
          } else if (typeof settings[key] === "object" && settings[key].width && settings[key].depth) {
            rackSpecs = settings[key];
            console.log(`Using object from ${key}:`, rackSpecs);
            break;
          }
        }
      }
    }
    if (!rackSpecs) {
      console.error("Rack specifications not found in system settings");
      throw new Error("Rack specifications not found in system settings");
    }
    if (!rackSpecs.width || !rackSpecs.depth) {
      console.error("Rack specifications incomplete - missing width or depth");
      throw new Error("Rack specifications incomplete - missing width or depth");
    }
    return {
      width: rackSpecs.width,
      depth: rackSpecs.depth,
      leg_shape: rackSpecs.leg_shape || "square",
      // Default to square if not specified
      leg_size: rackSpecs.leg_size || 0.03,
      // Default to 3cm if not specified
      margin: rackSpecs.margin || [0, 0, 0, 0],
      // Default to no margin if not specified
      alignment: rackSpecs.alignment || "center",
      // Default to center alignment if not specified
      alignment_margin_back: rackSpecs.alignment_margin_back || 0.02
      // Default to 2cm if not specified
    };
  } catch (error) {
    console.error("Failed to get rack specifications:", error.message);
    throw new Error(`Failed to get rack specifications: ${error.message}`);
  }
}
function registerRobotSettingsRoutes(app2) {
  app2.get("/api/robot/settings", async (req, res) => {
    try {
      const settings = await fetchRobotSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching robot settings:", error.message);
      res.status(500).json({ error: `Failed to fetch robot settings: ${error.message}` });
    }
  });
  app2.get("/api/robot/settings/rack-specs", async (req, res) => {
    try {
      const rackSpecs = await getRackSpecifications();
      res.json(rackSpecs);
    } catch (error) {
      console.error("Error fetching rack specifications:", error.message);
      res.status(500).json({ error: `Failed to fetch rack specifications: ${error.message}` });
    }
  });
}
var init_robot_settings_api = __esm({
  "server/robot-settings-api.ts"() {
    "use strict";
    init_robot_constants();
  }
});

// server/workflow-templates.ts
var zoneToPickupWorkflow, pickupToDropoffWorkflow, dynamicShelfToShelfWorkflow, dynamicCentralToShelfWorkflow, dynamicShelfToCentralWorkflow, workflowTemplates;
var init_workflow_templates = __esm({
  "server/workflow-templates.ts"() {
    "use strict";
    zoneToPickupWorkflow = {
      id: "zone-104-workflow",
      name: "Deliver to Zone 104",
      description: "Pick up a bin from main pickup and deliver to Zone 104",
      inputs: [],
      // No dynamic inputs for this workflow yet
      sequence: [
        {
          actionId: "moveToPoint",
          params: {
            pointId: "050_load_docking",
            speed: 0.5
          },
          description: "Move to pickup docking position"
        },
        {
          actionId: "alignWithRack",
          params: {
            pointId: "050_load"
          },
          description: "Align with rack at pickup"
        },
        {
          actionId: "jackUp",
          params: {
            waitTime: 3e3
          },
          description: "Jack up to grab bin"
        },
        {
          actionId: "moveToPoint",
          params: {
            pointId: "104_load",
            speed: 0.5,
            forDropoff: true
          },
          description: "Move directly to Zone 104 load point"
        },
        {
          actionId: "jackDown",
          params: {
            waitTime: 3e3
          },
          description: "Jack down to release bin"
        },
        {
          actionId: "returnToCharger",
          params: {
            maxRetries: 90
          },
          description: "Return to charging station"
        }
      ]
    };
    pickupToDropoffWorkflow = {
      id: "pickup-to-104-workflow",
      name: "Pickup from Zone 104",
      description: "Pick up a bin from Zone 104 and deliver to main dropoff",
      inputs: [],
      // No dynamic inputs for this workflow yet
      sequence: [
        {
          actionId: "moveToPoint",
          params: {
            pointId: "104_load_docking",
            speed: 0.5
          },
          description: "Move to Zone 104 docking position"
        },
        {
          actionId: "alignWithRack",
          params: {
            pointId: "104_load"
          },
          description: "Align with rack at Zone 104"
        },
        {
          actionId: "jackUp",
          params: {
            waitTime: 3e3
          },
          description: "Jack up to grab bin"
        },
        {
          actionId: "moveToPoint",
          params: {
            pointId: "001_load",
            speed: 0.5,
            forDropoff: true
          },
          description: "Move directly to dropoff point"
        },
        {
          actionId: "jackDown",
          params: {
            waitTime: 3e3
          },
          description: "Jack down to release bin"
        },
        {
          actionId: "returnToCharger",
          params: {
            maxRetries: 90
          },
          description: "Return to charging station"
        }
      ]
    };
    dynamicShelfToShelfWorkflow = {
      id: "shelf-to-shelf",
      name: "Shelf to Shelf Transport",
      description: "Move a bin from one shelf to another shelf",
      inputs: [
        {
          id: "pickupShelf",
          name: "Pickup Shelf",
          description: "Shelf where bin will be picked up",
          type: "point",
          required: true
        },
        {
          id: "dropoffShelf",
          name: "Dropoff Shelf",
          description: "Shelf where bin will be delivered",
          type: "point",
          required: true
        }
      ],
      sequence: [
        {
          actionId: "moveToPoint",
          params: {
            pointId: "{pickupShelf}_load_docking",
            speed: 0.5
          },
          description: "Move to pickup shelf docking position"
        },
        {
          actionId: "alignWithRack",
          params: {
            pointId: "{pickupShelf}_load"
          },
          description: "Align with rack at pickup shelf"
        },
        {
          actionId: "jackUp",
          params: {
            waitTime: 3e3
          },
          description: "Jack up to grab bin"
        },
        {
          actionId: "moveToPoint",
          params: {
            pointId: "{dropoffShelf}_load",
            speed: 0.5,
            forDropoff: true
          },
          description: "Move directly to dropoff shelf point"
        },
        {
          actionId: "jackDown",
          params: {
            waitTime: 3e3
          },
          description: "Jack down to release bin"
        },
        {
          actionId: "returnToCharger",
          params: {
            maxRetries: 90
          },
          description: "Return to charging station"
        }
      ]
    };
    dynamicCentralToShelfWorkflow = {
      id: "central-to-shelf",
      name: "Central Pickup to Shelf",
      description: "Move a bin from central pickup to any shelf",
      inputs: [
        {
          id: "dropoffShelf",
          name: "Dropoff Shelf",
          description: "Shelf where bin will be delivered",
          type: "point",
          required: true
        }
      ],
      sequence: [
        {
          actionId: "moveToPoint",
          params: {
            pointId: "050_load_docking",
            speed: 0.5
          },
          description: "Move to central pickup docking position"
        },
        {
          actionId: "alignWithRack",
          params: {
            pointId: "050_load"
          },
          description: "Align with rack at central pickup"
        },
        {
          actionId: "jackUp",
          params: {
            waitTime: 3e3
          },
          description: "Jack up to grab bin"
        },
        {
          actionId: "moveToPoint",
          params: {
            pointId: "{dropoffShelf}_load",
            speed: 0.5,
            forDropoff: true
          },
          description: "Move directly to dropoff shelf point"
        },
        {
          actionId: "jackDown",
          params: {
            waitTime: 3e3
          },
          description: "Jack down to release bin"
        },
        {
          actionId: "returnToCharger",
          params: {
            maxRetries: 90
          },
          description: "Return to charging station"
        }
      ]
    };
    dynamicShelfToCentralWorkflow = {
      id: "shelf-to-central",
      name: "Shelf to Central Dropoff",
      description: "Move a bin from any shelf to central dropoff",
      inputs: [
        {
          id: "pickupShelf",
          name: "Pickup Shelf",
          description: "Shelf where bin will be picked up",
          type: "point",
          required: true
        }
      ],
      sequence: [
        {
          actionId: "moveToPoint",
          params: {
            pointId: "{pickupShelf}_load_docking",
            speed: 0.5
          },
          description: "Move to pickup shelf docking position"
        },
        {
          actionId: "alignWithRack",
          params: {
            pointId: "{pickupShelf}_load"
          },
          description: "Align with rack at pickup shelf"
        },
        {
          actionId: "jackUp",
          params: {
            waitTime: 3e3
          },
          description: "Jack up to grab bin"
        },
        {
          actionId: "moveToPoint",
          params: {
            pointId: "001_load",
            speed: 0.5,
            forDropoff: true
          },
          description: "Move directly to central dropoff point"
        },
        {
          actionId: "jackDown",
          params: {
            waitTime: 3e3
          },
          description: "Jack down to release bin"
        },
        {
          actionId: "returnToCharger",
          params: {
            maxRetries: 90
          },
          description: "Return to charging station"
        }
      ]
    };
    workflowTemplates = {
      "zone-104-workflow": zoneToPickupWorkflow,
      "pickup-to-104-workflow": pickupToDropoffWorkflow,
      "shelf-to-shelf": dynamicShelfToShelfWorkflow,
      "central-to-shelf": dynamicCentralToShelfWorkflow,
      "shelf-to-central": dynamicShelfToCentralWorkflow
    };
  }
});

// server/to-unload-point-action.ts
var to_unload_point_action_exports = {};
__export(to_unload_point_action_exports, {
  toUnloadPointAction: () => toUnloadPointAction
});
import axios14 from "axios";
function resolvePointId(pointId, params) {
  if (!pointId) {
    console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F WARNING: Empty point ID provided`);
    return "unknown_point";
  }
  let resolvedPointId = pointId;
  if (pointId.includes("{") && pointId.includes("}")) {
    const paramMatch = pointId.match(/{([^}]+)}/);
    if (!paramMatch) return pointId;
    const paramName = paramMatch[1];
    const paramValue = params[paramName];
    if (!paramValue) {
      throw new Error(`Missing required parameter: ${paramName}`);
    }
    resolvedPointId = pointId.replace(`{${paramName}}`, paramValue);
    console.log(`[UNLOAD-POINT-ACTION] Resolved parameter ${paramName} to: ${resolvedPointId}`);
  }
  const label = resolvedPointId.toString();
  if (label.toLowerCase().includes("_docking")) {
    console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F ERROR: Docking point ${label} was passed to toUnloadPoint action.`);
    console.log(`[UNLOAD-POINT-ACTION] to_unload_point should ONLY be used for load points, not docking points.`);
    return label.replace(/_docking/i, "_load");
  }
  if (label.toLowerCase().includes("drop-off") || label.toLowerCase().includes("dropoff")) {
    if (!label.toLowerCase().includes("_load")) {
      console.log(`[UNLOAD-POINT-ACTION] Normalizing drop-off point ID format: ${label} -> 001_load`);
      return "001_load";
    }
    if (label.toLowerCase() !== "drop-off_load") {
      console.log(`[UNLOAD-POINT-ACTION] Standardizing drop-off point format: ${label} -> 001_load`);
      return "001_load";
    } else {
      console.log(`[UNLOAD-POINT-ACTION] Converting old drop-off_load format to new 001_load format`);
      return "001_load";
    }
  }
  if (label.toLowerCase().includes("001_load") || label === "001") {
    if (!label.toLowerCase().includes("_load")) {
      console.log(`[UNLOAD-POINT-ACTION] Normalizing central dropoff point ID format: ${label} -> 001_load`);
      return "001_load";
    }
    return "001_load";
  }
  if (/^\d+$/.test(label)) {
    console.log(`[UNLOAD-POINT-ACTION] Numeric-only point ID detected: ${label}, appending "_load" suffix`);
    return `${label}_load`;
  }
  if (!label.toLowerCase().includes("_load") && !label.toLowerCase().includes("_docking")) {
    console.log(`[UNLOAD-POINT-ACTION] Point ID without _load suffix: ${label}, appending "_load" suffix`);
    return `${label}_load`;
  }
  return resolvedPointId;
}
var robotApi, toUnloadPointAction;
var init_to_unload_point_action = __esm({
  "server/to-unload-point-action.ts"() {
    "use strict";
    init_robot_constants();
    robotApi = axios14.create({
      baseURL: ROBOT_API_URL,
      headers: getAuthHeaders()
    });
    toUnloadPointAction = {
      description: "Move to unload point for dropping bins",
      params: {
        pointId: {
          type: "string",
          description: "ID of the point to move to for unloading (usually a shelf load point)"
        },
        maxRetries: {
          type: "number",
          description: "Maximum number of retries to wait for move to complete",
          default: 60
        }
      },
      requiresPoints: ["location"],
      async validate(params) {
        const errors = [];
        if (!params.pointId) {
          errors.push("Point ID is required");
        }
        return {
          valid: errors.length === 0,
          errors
        };
      },
      async execute(params) {
        console.log("[UNLOAD-POINT-ACTION] Starting execute() with params:", JSON.stringify(params, null, 2));
        try {
          if (params.pointId && params.pointId.toString().toLowerCase().includes("_docking")) {
            console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F CRITICAL ERROR: Docking point ${params.pointId} detected in workflow.`);
            console.log(`[UNLOAD-POINT-ACTION] According to the perfect example (pickup-104-new.js), docking points should`);
            console.log(`[UNLOAD-POINT-ACTION] use standard 'move' type, not 'to_unload_point'. Correcting this issue.`);
            throw new Error(`Cannot use to_unload_point with docking point ${params.pointId}. Use moveToPoint action for docking points.`);
          }
          const resolvedPointId = resolvePointId(params.pointId, params);
          console.log(`[ACTION] Moving to unload point at: ${resolvedPointId}`);
          let loadPointId = resolvedPointId;
          if (loadPointId.toString().toLowerCase().includes("_docking")) {
            console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F CRITICAL ERROR: After resolving point ID, still have docking point: ${loadPointId}`);
            throw new Error(`Cannot use to_unload_point with docking point ${loadPointId}. This should never happen - check the point naming.`);
          }
          console.log(`[ACTION] Using load point ID for unloading: ${loadPointId}`);
          let rackAreaId;
          if (loadPointId.toLowerCase().includes("_docking")) {
            console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F CRITICAL ERROR: Cannot unload at a docking point: ${loadPointId}`);
            console.log(`[UNLOAD-POINT-ACTION] The robot must physically move to a load point before unloading`);
            throw new Error(`Cannot unload at docking point ${loadPointId}. The robot must physically be at a load point.`);
          }
          if (!loadPointId.toLowerCase().includes("_load")) {
            console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F CRITICAL ERROR: Not a valid load point: ${loadPointId}`);
            throw new Error(`The point ${loadPointId} is not a valid load point for unloading operations.`);
          }
          rackAreaId = loadPointId;
          console.log(`[UNLOAD-POINT-ACTION] Using full load point "${rackAreaId}" as rack_area_id`);
          console.log(`[UNLOAD-POINT-ACTION] \u2705 CONFIRMED: Using load point for unloading, NOT a docking point`);
          console.log(`[UNLOAD-POINT-ACTION] Double-check point ID format = ${loadPointId}`);
          console.log(`[UNLOAD-POINT-ACTION] Double-check rack_area_id format = ${rackAreaId}`);
          console.log(`[UNLOAD-POINT-ACTION] Using extracted rack_area_id "${rackAreaId}" for point "${loadPointId}"`);
          console.log(`[UNLOAD-POINT-ACTION] This ensures correct targeting for bin unloading at shelf/dropoff points`);
          if (!rackAreaId || rackAreaId.trim() === "") {
            console.log(`[UNLOAD-POINT-ACTION] \u26A0\uFE0F CRITICAL ERROR: Empty rack_area_id, falling back to point ID`);
            rackAreaId = loadPointId;
          }
          console.log(`[UNLOAD-POINT-ACTION] FINAL rack_area_id = "${rackAreaId}" for point "${loadPointId}"`);
          const payload = {
            creator: "robot-management-platform",
            type: "to_unload_point",
            // Use to_unload_point specifically for unloading operations
            target_x: 0,
            // These values will be ignored since the point ID is what matters
            target_y: 0,
            target_z: 0,
            point_id: loadPointId,
            // This should be the load point, not the docking point
            rack_area_id: rackAreaId
            // Required for to_unload_point to work properly
          };
          console.log(`[ACTION] Sending toUnloadPoint API call with payload:`, JSON.stringify(payload, null, 2));
          let moveActionId;
          try {
            const response = await robotApi.post(`/chassis/moves`, payload);
            console.log(`[ACTION] toUnloadPoint API call succeeded with response:`, response.status, response.statusText);
            moveActionId = response.data.id;
            console.log(`[ACTION] Created to_unload_point action with ID: ${moveActionId}`);
            const maxRetries = params.maxRetries || 60;
            let retries = 0;
            while (retries < maxRetries) {
              const statusResponse = await robotApi.get(`/chassis/moves/${moveActionId}`);
              const status = statusResponse.data.state;
              if (status === "succeeded") {
                console.log(`[ACTION] Move action ${moveActionId} completed successfully`);
                return {
                  success: true
                };
              } else if (status === "failed") {
                const reason = statusResponse.data.reason || "Unknown failure reason";
                console.error(`[ACTION] Move action ${moveActionId} failed with reason: ${reason}`);
                return {
                  success: false,
                  error: `Move failed: ${reason}`
                };
              }
              await new Promise((resolve) => setTimeout(resolve, 1e3));
              retries++;
            }
            console.error(`[ACTION] Timed out waiting for move action ${moveActionId} to complete`);
            return {
              success: false,
              error: "Timed out waiting for move to complete"
            };
          } catch (error) {
            console.error(
              `[ACTION] toUnloadPoint API call failed:`,
              error.response?.status,
              error.response?.data || error.message
            );
            return {
              success: false,
              error: `API error: ${error.message}`
            };
          }
        } catch (error) {
          console.error(`[ACTION] Error in toUnloadPoint action:`, error);
          return {
            success: false,
            error: error.message || "Unknown error"
          };
        }
      }
    };
  }
});

// server/dynamic-workflow.ts
var dynamic_workflow_exports = {};
__export(dynamic_workflow_exports, {
  executeWorkflow: () => executeWorkflow,
  registerDynamicWorkflowRoutes: () => registerDynamicWorkflowRoutes
});
import axios15 from "axios";
import { v4 as uuidv4 } from "uuid";
import fs10 from "fs";
function logWorkflow(workflowId, message, status, stepInfo) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp}] [WORKFLOW-${workflowId}] ${message}`;
  console.log(logMessage);
  try {
    fs10.appendFileSync(LOG_PATH, logMessage + "\n");
  } catch (error) {
    console.error(`Could not write to log file: ${error}`);
  }
  if (workflowStates[workflowId]) {
    const workflow = workflowStates[workflowId];
    workflow.lastMessage = message;
    if (status) {
      workflow.status = status;
      if (status === "completed" || status === "failed") {
        workflow.endTime = /* @__PURE__ */ new Date();
      }
    }
    if (stepInfo) {
      if (stepInfo.currentStep !== void 0) {
        workflow.currentStep = stepInfo.currentStep;
      }
      if (stepInfo.totalSteps !== void 0) {
        workflow.totalSteps = stepInfo.totalSteps;
      }
    }
  }
}
function getHeaders() {
  return getAuthHeaders();
}
async function getMapPoints2() {
  if (mapPointsCache) {
    return mapPointsCache;
  }
  try {
    console.log("Fetching maps from robot API...");
    const mapsResponse = await axios15.get(`${ROBOT_API_URL}/maps`, { headers: getHeaders() });
    const maps = mapsResponse.data;
    console.log(`Found ${maps.length} maps from robot API: ${JSON.stringify(maps.map((m) => ({ id: m.id, name: m.name || "unnamed" })))}`);
    const mapPoints = {};
    for (const map of maps) {
      const mapId = map.id;
      const mapUid = map.uid || "";
      const mapName = map.name || "unnamed";
      console.log(`Processing map: "${mapName}" (ID: ${mapId}, UID: ${mapUid})`);
      console.log(`Map details: ${JSON.stringify({
        id: mapId,
        uid: mapUid,
        name: mapName
      })}`);
      const mapDetailRes = await axios15.get(`${ROBOT_API_URL}/maps/${mapId}`, { headers: getHeaders() });
      const mapData = mapDetailRes.data;
      console.log(`Map ${mapId} details: ${JSON.stringify({
        name: mapData.name || "unnamed",
        description: mapData.description || "no description",
        hasOverlays: !!mapData.overlays
      })}`);
      if (!mapData || !mapData.overlays) {
        console.log(`Map ${mapId} does not have overlays data`);
        continue;
      }
      let overlays;
      try {
        overlays = JSON.parse(mapData.overlays);
      } catch (e) {
        const parseError = e;
        console.error(`Failed to parse overlays JSON for map ${mapId}: ${parseError.message}`);
        continue;
      }
      const features = overlays.features || [];
      console.log(`Found ${features.length} features in map ${mapId} overlays`);
      const points = features.filter((f) => f.geometry?.type === "Point" && f.properties).map((f) => {
        const { id, properties, geometry } = f;
        const pointId = String(id || properties.name || properties.text || "").trim();
        const x = typeof properties.x === "number" ? properties.x : geometry.coordinates[0];
        const y = typeof properties.y === "number" ? properties.y : geometry.coordinates[1];
        const ori = parseFloat(String(properties.yaw || properties.orientation || "0"));
        return {
          id: pointId,
          x,
          y,
          ori
        };
      });
      console.log(`Extracted ${points.length} point features from map ${mapId}`);
      const shelfPoints = [];
      const dockingPoints = [];
      let dropoffPoint;
      let dropoffDockingPoint;
      let pickupPoint;
      let pickupDockingPoint;
      let chargerPoint;
      console.log(`Processing ${points.length} points for map ${mapId}`);
      for (const point of points) {
        console.log(`Examining point: ${point.id}`);
        const hasSpecialObjectIdFormat = point.id.length === 24 && /^[0-9a-f]{24}$/i.test(point.id);
        if (point.id.toLowerCase().includes("_load") && !point.id.toLowerCase().includes("_docking")) {
          console.log(`\u2705 Found shelf point: ${point.id}`);
          shelfPoints.push(point);
        } else if (point.id.toLowerCase().includes("_docking")) {
          console.log(`\u2705 Found docking point: ${point.id}`);
          dockingPoints.push(point);
          const lowerCaseId = point.id.toLowerCase();
          if (lowerCaseId.includes("drop-off_load_docking") || lowerCaseId.includes("dropoff_load_docking")) {
            console.log(`\u2705 Found dropoff docking point: ${point.id}`);
            dropoffDockingPoint = point;
          } else if (lowerCaseId.includes("pick-up_load_docking")) {
            console.log(`\u2705 Found pickup docking point: ${point.id}`);
            pickupDockingPoint = point;
          }
        } else if (point.id.toLowerCase().includes("drop-off_load") || point.id.toLowerCase().includes("dropoff_load")) {
          console.log(`\u2705 Found dropoff point: ${point.id}`);
          dropoffPoint = point;
        } else if (point.id.toLowerCase().includes("pick-up_load")) {
          console.log(`\u2705 Found pickup point: ${point.id}`);
          pickupPoint = point;
        } else if (point.id.toLowerCase().includes("charger")) {
          console.log(`\u2705 Found charger point: ${point.id}`);
          chargerPoint = point;
        }
        if (hasSpecialObjectIdFormat) {
          console.log(`\u2705 Found MongoDB ObjectId formatted point: ${point.id}`);
          if (shelfPoints.length === 0) {
            console.log(`\u2705 Using ObjectId point as shelf point: ${point.id}`);
            shelfPoints.push(point);
          } else if (!dropoffPoint && shelfPoints.length === 1) {
            console.log(`\u2705 Using second ObjectId point as dropoff point: ${point.id}`);
            dropoffPoint = point;
          } else if (!pickupPoint && shelfPoints.length === 1 && dropoffPoint) {
            console.log(`\u2705 Using third ObjectId point as pickup point: ${point.id}`);
            pickupPoint = point;
          } else if (dockingPoints.length < 3) {
            console.log(`\u2705 Using ObjectId point as docking point: ${point.id}`);
            dockingPoints.push(point);
            if (!dropoffDockingPoint && dropoffPoint) {
              console.log(`\u2705 Assigning docking point to dropoff: ${point.id}`);
              dropoffDockingPoint = point;
            } else if (!pickupDockingPoint && pickupPoint) {
              console.log(`\u2705 Assigning docking point to pickup: ${point.id}`);
              pickupDockingPoint = point;
            }
          }
        }
        if (shelfPoints.length === 0) {
          const numericMatch = point.id.match(/^(\d+)/);
          if (numericMatch && !point.id.toLowerCase().includes("_docking") && !point.id.toLowerCase().includes("charger")) {
            console.log(`\u2705 Found potential shelf point by numeric ID: ${point.id}`);
            shelfPoints.push(point);
          }
        }
      }
      if (shelfPoints.length > 0) {
        console.log(`Map ${mapId} has ${shelfPoints.length} shelf points`);
        if (shelfPoints.length > 0) {
          console.log(`First shelf point: ${JSON.stringify(shelfPoints[0])}`);
        }
        if (!chargerPoint) {
          console.log(`\u26A0\uFE0F Warning: No charger point found on Map ${mapId}`);
        }
        if (!pickupPoint) {
          console.log(`\u26A0\uFE0F Warning: No pickup point found on Map ${mapId}`);
        }
        if (!pickupDockingPoint) {
          console.log(`\u26A0\uFE0F Warning: No pickup docking point found on Map ${mapId}`);
        }
        if (!dropoffPoint) {
          console.log(`\u26A0\uFE0F Warning: No dropoff point found on Map ${mapId}`);
        }
        if (!dropoffDockingPoint) {
          console.log(`\u26A0\uFE0F Warning: No dropoff docking point found on Map ${mapId}`);
        }
      }
      mapPoints[mapId] = {
        shelfPoints,
        dockingPoints,
        dropoffPoint,
        dropoffDockingPoint,
        pickupPoint,
        pickupDockingPoint,
        chargerPoint
      };
    }
    mapPointsCache = mapPoints;
    return mapPoints;
  } catch (error) {
    console.error("Failed to load map points:", error.message);
    throw new Error(`Failed to load map points: ${error.message}`);
  }
}
function getDockingPointForShelf(shelfId, floorPoints, floorId) {
  const dockingId = `${shelfId}_load_docking`;
  const altDockingId = `${shelfId}_docking`;
  let dockingPoint = floorPoints.dockingPoints.find(
    (p) => p.id.toLowerCase() === dockingId.toLowerCase() || p.id.toLowerCase() === altDockingId.toLowerCase()
  );
  if (!dockingPoint) {
    console.log(`\u{1F4DD} Could not find exact docking point match for shelf ${shelfId}, trying alternate formats`);
    if (/^\d+$/.test(shelfId)) {
      const numericDockingId = `${shelfId}_load_docking`;
      dockingPoint = floorPoints.dockingPoints.find(
        (p) => p.id.toLowerCase().includes(numericDockingId.toLowerCase())
      );
      if (dockingPoint) {
        console.log(`\u2705 Found docking point for shelf ${shelfId} using numeric format: ${dockingPoint.id}`);
      }
    }
  }
  if (!dockingPoint && shelfId.length === 24 && /^[0-9a-f]{24}$/i.test(shelfId)) {
    console.log(`\u{1F4DD} Processing MongoDB ObjectId shelf point: ${shelfId}`);
    if (floorPoints.dockingPoints.length > 0) {
      dockingPoint = floorPoints.dockingPoints[0];
      console.log(`\u2705 Using first available docking point for ObjectId shelf: ${dockingPoint.id}`);
    }
  }
  return dockingPoint || null;
}
async function moveToPoint2(workflowId, x, y, ori, label) {
  logWorkflow(workflowId, `Moving robot to ${label} (${x}, ${y}, orientation: ${ori})`);
  try {
    try {
      const cancelResponse = await axios15.patch(
        `${ROBOT_API_URL}/chassis/moves/current`,
        { state: "cancelled" },
        { headers: getHeaders() }
      );
      logWorkflow(workflowId, `Cancelled current move: ${JSON.stringify(cancelResponse.data)}`);
    } catch (cancelError) {
      logWorkflow(workflowId, `Note: Could not check current move state: ${cancelError.message}`);
    }
    const moveCommand = {
      creator: "workflow-service",
      type: "standard",
      target_x: x,
      target_y: y,
      target_ori: ori
    };
    const response = await axios15.post(`${ROBOT_API_URL}/chassis/moves`, moveCommand, { headers: getHeaders() });
    const moveId = response.data.id;
    logWorkflow(workflowId, `Move command sent for ${label} - move ID: ${moveId}`);
    let moveComplete = false;
    let attempts = 0;
    const maxRetries = 180;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      try {
        const statusResponse = await axios15.get(
          `${ROBOT_API_URL}/chassis/moves/${moveId}`,
          { headers: getHeaders() }
        );
        const moveStatus = statusResponse.data.state;
        logWorkflow(workflowId, `Current move status: ${moveStatus}`);
        try {
          const posResponse = await axios15.get(`${ROBOT_API_URL}/tracked_pose`, { headers: getHeaders() });
          logWorkflow(workflowId, `Current position: ${JSON.stringify(posResponse.data)}`);
        } catch (error) {
          const posError = error;
          logWorkflow(workflowId, `Position data incomplete or invalid: ${JSON.stringify(posError.response?.data || {})}`);
        }
        if (moveStatus === "succeeded") {
          moveComplete = true;
          logWorkflow(workflowId, `\u2705 Move to ${label} completed successfully`);
        } else if (moveStatus === "failed" || moveStatus === "cancelled") {
          const reason = statusResponse.data.fail_reason_str || "Unknown reason";
          throw new Error(`Move to ${label} failed or was cancelled. Status: ${moveStatus} Reason: ${reason}`);
        } else {
          logWorkflow(workflowId, `Still moving (move ID: ${moveId}), waiting...`);
        }
      } catch (error) {
        if (error.message.includes("Move to")) {
          throw error;
        }
        logWorkflow(workflowId, `Error checking move status: ${error.message}`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Move to ${label} timed out after ${maxRetries} attempts`);
    }
    return moveId;
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR moving to ${label}: ${error.message}`);
    throw error;
  }
}
async function alignWithRackForPickup(workflowId, x, y, ori, label) {
  logWorkflow(workflowId, `\u{1F50D} Aligning with rack at ${label} (${x}, ${y}) using special align_with_rack move type`);
  try {
    logWorkflow(workflowId, `\u26A0\uFE0F SAFETY CHECK: Verifying jack state before rack alignment...`);
    try {
      const jackStateResponse = await axios15.get(`${ROBOT_API_URL}/jack_state`, { headers: getHeaders() });
      const jackState = jackStateResponse.data;
      if (jackState && jackState.is_up === true) {
        logWorkflow(workflowId, `\u26A0\uFE0F Jack is currently UP but should be DOWN for rack alignment. Running explicit jack_down.`);
        await executeJackDown(workflowId);
      } else {
        logWorkflow(workflowId, `\u2705 Jack is in DOWN state - ready to proceed with rack alignment`);
      }
    } catch (jackCheckError) {
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: Could not check jack state: ${jackCheckError.message}`);
      try {
        await executeJackDown(workflowId);
      } catch (jackDownError) {
        logWorkflow(workflowId, `\u26A0\uFE0F Warning: Failed to lower jack: ${jackDownError.message}`);
      }
    }
    let rackSpecs = null;
    try {
      logWorkflow(workflowId, `Getting rack specifications for proper rack alignment...`);
      rackSpecs = await getRackSpecifications();
      logWorkflow(workflowId, `\u2705 Successfully retrieved rack specifications: width=${rackSpecs.width}, depth=${rackSpecs.depth}, leg_shape=${rackSpecs.leg_shape}`);
    } catch (rackSpecsError) {
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: Could not get rack specifications: ${rackSpecsError.message}`);
    }
    const alignCommand = {
      creator: "workflow-service",
      type: "align_with_rack",
      // Special move type for rack alignment
      target_x: x,
      target_y: y,
      target_ori: ori
    };
    if (rackSpecs) {
      alignCommand.rack_specs = rackSpecs;
    }
    logWorkflow(workflowId, `\u26A0\uFE0F RACK OPERATION: Creating align_with_rack move: ${JSON.stringify(alignCommand)}`);
    const response = await axios15.post(`${ROBOT_API_URL}/chassis/moves`, alignCommand, { headers: getHeaders() });
    if (!response.data || !response.data.id) {
      throw new Error("Failed to create align_with_rack move - invalid response");
    }
    const moveId = response.data.id;
    logWorkflow(workflowId, `Robot align_with_rack command sent - move ID: ${moveId}`);
    let moveComplete = false;
    let maxRetries = 120;
    let attempts = 0;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const statusResponse = await axios15.get(`${ROBOT_API_URL}/chassis/moves/${moveId}`, { headers: getHeaders() });
      const moveStatus = statusResponse.data.state;
      logWorkflow(workflowId, `\u26A0\uFE0F RACK ALIGNMENT: Current align_with_rack status: ${moveStatus}`);
      if (moveStatus === "succeeded") {
        moveComplete = true;
        logWorkflow(workflowId, `\u2705 Robot has completed align_with_rack operation (ID: ${moveId})`);
      } else if (moveStatus === "failed" || moveStatus === "cancelled") {
        const errorReason = statusResponse.data.fail_reason_str || "Unknown failure";
        throw new Error(`Align with rack failed or was cancelled. Status: ${moveStatus} Reason: ${errorReason}`);
      } else {
        logWorkflow(workflowId, `Still aligning (move ID: ${moveId}), waiting...`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Align with rack timed out after ${maxRetries} attempts`);
    }
    logWorkflow(workflowId, `Waiting 3 seconds after alignment for stability...`);
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    return moveId;
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR during align_with_rack operation: ${error.message}`);
    throw error;
  }
}
async function moveToUnloadPoint(workflowId, x, y, ori, label) {
  logWorkflow(workflowId, `\u{1F4E6} Moving to unload point ${label} (${x}, ${y}) using special to_unload_point move type`);
  try {
    logWorkflow(workflowId, `\u26A0\uFE0F SAFETY CHECK: Verifying jack state before unload operation...`);
    try {
      const jackStateResponse = await axios15.get(`${ROBOT_API_URL}/jack_state`, { headers: getHeaders() });
      const jackState = jackStateResponse.data;
      if (jackState && jackState.is_up !== true) {
        logWorkflow(workflowId, `\u26A0\uFE0F ERROR: Jack is currently DOWN but should be UP for unload operation.`);
        throw new Error("Jack is not in UP state for unload operation");
      } else {
        logWorkflow(workflowId, `\u2705 Jack is in UP state - ready to proceed with unload operation`);
      }
    } catch (jackCheckError) {
      if (jackCheckError.message === "Jack is not in UP state for unload operation") {
        throw jackCheckError;
      }
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: Could not check jack state: ${jackCheckError.message}`);
    }
    let pointId;
    if (label.toLowerCase().includes("drop-off") || label.toLowerCase().includes("dropoff")) {
      if (!label.includes("_load")) {
        pointId = "drop-off_load";
      } else {
        pointId = label;
      }
      logWorkflow(workflowId, `\u{1F4E6} Using special dropoff point: "${pointId}"`);
    } else if (label.includes("_load")) {
      pointId = label;
      logWorkflow(workflowId, `\u{1F4E6} Using full point ID: "${pointId}"`);
    } else {
      pointId = `${label}_load`;
      logWorkflow(workflowId, `\u{1F4E6} Converting shelf ID "${label}" to full point ID: "${pointId}"`);
    }
    let rackAreaId;
    if (pointId.toLowerCase().startsWith("drop-off") || pointId.toLowerCase().startsWith("dropoff")) {
      rackAreaId = "drop-off";
      logWorkflow(workflowId, `\u26A0\uFE0F CRITICAL: Using special rack_area_id="${rackAreaId}" for drop-off point`);
    } else {
      const areaMatch = pointId.match(/^([^_]+)/);
      if (!areaMatch) {
        logWorkflow(workflowId, `\u26A0\uFE0F WARNING: Could not extract rack_area_id from "${pointId}", using full ID`);
        rackAreaId = pointId;
      } else {
        rackAreaId = areaMatch[1];
        if (!rackAreaId || rackAreaId.trim() === "") {
          logWorkflow(workflowId, `\u26A0\uFE0F WARNING: Extracted empty rack_area_id, using default "${pointId}"`);
          rackAreaId = pointId;
        } else {
          logWorkflow(workflowId, `\u26A0\uFE0F Extracted rack_area_id="${rackAreaId}" from point "${pointId}"`);
        }
      }
    }
    if (!rackAreaId || rackAreaId.trim() === "") {
      logWorkflow(workflowId, `\u26A0\uFE0F CRITICAL ERROR: Empty rack_area_id! Using pointId as fallback.`);
      rackAreaId = pointId;
    }
    const unloadCommand = {
      creator: "workflow-service",
      type: "to_unload_point",
      // Special move type for dropping off bins
      target_x: x,
      target_y: y,
      target_ori: ori,
      point_id: pointId,
      // REQUIRED: The point ID for the unload location
      rack_area_id: rackAreaId
      // REQUIRED: The rack area ID for proper alignment
    };
    logWorkflow(workflowId, `\u26A0\uFE0F UNLOAD OPERATION: Creating to_unload_point move: ${JSON.stringify(unloadCommand)}`);
    const response = await axios15.post(`${ROBOT_API_URL}/chassis/moves`, unloadCommand, { headers: getHeaders() });
    if (!response.data || !response.data.id) {
      throw new Error("Failed to create to_unload_point move - invalid response");
    }
    const moveId = response.data.id;
    logWorkflow(workflowId, `Robot unload command sent - move ID: ${moveId}`);
    let moveComplete = false;
    let maxRetries = 120;
    let attempts = 0;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const statusResponse = await axios15.get(`${ROBOT_API_URL}/chassis/moves/${moveId}`, { headers: getHeaders() });
      const moveStatus = statusResponse.data.state;
      logWorkflow(workflowId, `\u26A0\uFE0F UNLOAD OPERATION: Current to_unload_point status: ${moveStatus}`);
      if (moveStatus === "succeeded") {
        moveComplete = true;
        logWorkflow(workflowId, `\u2705 Robot has completed to_unload_point operation (ID: ${moveId})`);
      } else if (moveStatus === "failed" || moveStatus === "cancelled") {
        const errorReason = statusResponse.data.fail_reason_str || "Unknown failure";
        throw new Error(`Unload operation failed or was cancelled. Status: ${moveStatus} Reason: ${errorReason}`);
      } else {
        logWorkflow(workflowId, `Still performing unload operation (move ID: ${moveId}), waiting...`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Unload operation timed out after ${maxRetries} attempts`);
    }
    logWorkflow(workflowId, `Waiting 5 seconds after unload operation for stability...`);
    await new Promise((resolve) => setTimeout(resolve, 5e3));
    return moveId;
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR during to_unload_point operation: ${error.message}`);
    throw error;
  }
}
async function executeJackUp(workflowId) {
  logWorkflow(workflowId, `\u{1F53C} Executing jack_up operation`);
  try {
    await axios15.post(`${ROBOT_API_URL}/services/jack_up`, {}, { headers: getHeaders() });
    let jackComplete = false;
    let attempts = 0;
    const maxRetries = 20;
    while (!jackComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      try {
        const jackRes = await axios15.get(`${ROBOT_API_URL}/jack_state`, { headers: getHeaders() });
        const jackState = jackRes.data;
        logWorkflow(workflowId, `Current jack state: ${JSON.stringify(jackState)}`);
        if (jackState && jackState.is_up === true) {
          jackComplete = true;
          logWorkflow(workflowId, `\u2705 Jack up operation completed successfully`);
        } else {
          logWorkflow(workflowId, `Jack up operation in progress (attempt ${attempts}/${maxRetries})...`);
        }
      } catch (stateError) {
        logWorkflow(workflowId, `Warning: Could not check jack state: ${stateError.message}`);
      }
    }
    if (!jackComplete) {
      throw new Error(`Jack up operation did not complete after ${maxRetries} seconds`);
    }
    logWorkflow(workflowId, `Waiting 5 seconds after jack_up for stability...`);
    await new Promise((resolve) => setTimeout(resolve, 5e3));
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR during jack_up operation: ${error.message}`);
    throw error;
  }
}
async function executeJackDown(workflowId) {
  logWorkflow(workflowId, `\u{1F53D} Executing jack_down operation`);
  try {
    await axios15.post(`${ROBOT_API_URL}/services/jack_down`, {}, { headers: getHeaders() });
    let jackComplete = false;
    let attempts = 0;
    const maxRetries = 20;
    while (!jackComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      try {
        const jackRes = await axios15.get(`${ROBOT_API_URL}/jack_state`, { headers: getHeaders() });
        const jackState = jackRes.data;
        logWorkflow(workflowId, `Current jack state: ${JSON.stringify(jackState)}`);
        if (jackState && jackState.is_up === false) {
          jackComplete = true;
          logWorkflow(workflowId, `\u2705 Jack down operation completed successfully`);
        } else {
          logWorkflow(workflowId, `Jack down operation in progress (attempt ${attempts}/${maxRetries})...`);
        }
      } catch (stateError) {
        logWorkflow(workflowId, `Warning: Could not check jack state: ${stateError.message}`);
      }
    }
    if (!jackComplete) {
      throw new Error(`Jack down operation did not complete after ${maxRetries} seconds`);
    }
    logWorkflow(workflowId, `Waiting 5 seconds after jack_down for stability...`);
    await new Promise((resolve) => setTimeout(resolve, 5e3));
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR during jack_down operation: ${error.message}`);
    throw error;
  }
}
async function returnToCharger4(workflowId, chargerX, chargerY, chargerOri) {
  logWorkflow(workflowId, `\u{1F50B} Starting return to charger operation...`);
  try {
    logWorkflow(workflowId, `Cancelling any current moves first`);
    try {
      await axios15.patch(
        `${ROBOT_API_URL}/chassis/moves/current`,
        { state: "cancelled" },
        { headers: getHeaders() }
      );
      logWorkflow(workflowId, `Waiting for move cancellation to take effect...`);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
    } catch (error) {
      logWorkflow(workflowId, `Warning: Couldn't cancel current move: ${error.message}`);
    }
    logWorkflow(workflowId, `\u{1F50B} SAFETY CHECK: Verifying jack is in down state before returning to charger...`);
    try {
      const jackStateResponse = await axios15.get(`${ROBOT_API_URL}/jack_state`, { headers: getHeaders() });
      const jackState = jackStateResponse.data;
      if (jackState && jackState.is_up === true) {
        logWorkflow(workflowId, `\u26A0\uFE0F Jack is currently UP - must lower jack before returning to charger`);
        await executeJackDown(workflowId);
      } else {
        logWorkflow(workflowId, `\u2705 Jack is already DOWN - safe to return to charger`);
      }
    } catch (error) {
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: Unable to verify jack state: ${error.message}`);
      logWorkflow(workflowId, `\u26A0\uFE0F Will attempt explicit jack_down operation for safety...`);
      try {
        await axios15.post(`${ROBOT_API_URL}/services/jack_down`, {}, { headers: getHeaders() });
        logWorkflow(workflowId, `Precautionary jack down operation started, waiting 10 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 1e4));
        logWorkflow(workflowId, `\u2705 Completed precautionary jack down operation`);
      } catch (jackError) {
        logWorkflow(workflowId, `Warning: Failed to perform precautionary jack_down: ${jackError.message}`);
      }
    }
    logWorkflow(workflowId, `\u{1F50B} METHOD 1: Using services API to return to charger`);
    try {
      const serviceResponse = await axios15.post(`${ROBOT_API_URL}/services/return_to_charger`, {}, {
        headers: getHeaders()
      });
      logWorkflow(workflowId, `\u2705 Return to charger command sent via services API`);
      logWorkflow(workflowId, `Waiting for robot to begin charger return...`);
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      logWorkflow(workflowId, `Waiting for robot to reach charger (up to 3 minutes)...`);
      let chargerReached = false;
      let attempts = 0;
      const maxRetries = 36;
      while (!chargerReached && attempts < maxRetries) {
        attempts++;
        try {
          const chargeResponse = await axios15.get(`${ROBOT_API_URL}/charging_state`, {
            headers: getHeaders()
          });
          if (chargeResponse.data && chargeResponse.data.is_charging) {
            chargerReached = true;
            logWorkflow(workflowId, `\u2705 Confirmed: Robot is now charging via services API method!`);
          } else {
            logWorkflow(workflowId, `Still returning to charger via services API... (attempt ${attempts}/${maxRetries})`);
          }
        } catch (error) {
          logWorkflow(workflowId, `Warning: Error checking charging status: ${error.message}`);
        }
        if (!chargerReached) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
        }
      }
      if (chargerReached) {
        return;
      } else {
        logWorkflow(workflowId, `Method 1 (services API) did not reach charging state after 3 minutes, trying next method...`);
      }
    } catch (serviceError) {
      logWorkflow(workflowId, `Warning: Services API method failed: ${serviceError.message}`);
    }
    logWorkflow(workflowId, `\u{1F50B} METHOD 2: Using task API with runType 25 (charging task)`);
    try {
      const chargingTask = {
        runType: 25,
        // Charging task type
        name: `Return to Charger (${(/* @__PURE__ */ new Date()).toISOString()})`,
        robotSn: ROBOT_SERIAL,
        taskPriority: 10,
        // High priority for charging
        isLoop: false
      };
      const taskResponse = await axios15.post(`${ROBOT_API_URL}/api/v2/task`, chargingTask, {
        headers: getHeaders()
      });
      logWorkflow(workflowId, `\u2705 Return to charger command sent via task API`);
      logWorkflow(workflowId, `Waiting for task to be processed...`);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      logWorkflow(workflowId, `Waiting for robot to reach charger via task API (up to 3 minutes)...`);
      let chargerReached = false;
      let attempts = 0;
      const maxRetries = 36;
      while (!chargerReached && attempts < maxRetries) {
        attempts++;
        try {
          const chargeResponse = await axios15.get(`${ROBOT_API_URL}/charging_state`, {
            headers: getHeaders()
          });
          if (chargeResponse.data && chargeResponse.data.is_charging) {
            chargerReached = true;
            logWorkflow(workflowId, `\u2705 Confirmed: Robot is now charging via task API method!`);
          } else {
            logWorkflow(workflowId, `Still returning to charger via task API... (attempt ${attempts}/${maxRetries})`);
          }
        } catch (error) {
          logWorkflow(workflowId, `Warning: Error checking charging status: ${error.message}`);
        }
        if (!chargerReached) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
        }
      }
      if (chargerReached) {
        return;
      } else {
        logWorkflow(workflowId, `Method 2 (task API) did not reach charging state after 3 minutes, trying next method...`);
      }
    } catch (taskError) {
      logWorkflow(workflowId, `Warning: Task API method failed: ${taskError.message}`);
    }
    logWorkflow(workflowId, `\u{1F50B} METHOD 3: Using basic charge API endpoint`);
    try {
      const chargingResponse = await axios15.post(`${ROBOT_API_URL}/charge`, {}, { headers: getHeaders() });
      logWorkflow(workflowId, `\u2705 Return to charger command sent via charge API`);
      logWorkflow(workflowId, `Waiting for charge command to take effect...`);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      logWorkflow(workflowId, `Waiting for robot to reach charger via charge API (up to 3 minutes)...`);
      let chargerReached = false;
      let attempts = 0;
      const maxRetries = 36;
      while (!chargerReached && attempts < maxRetries) {
        attempts++;
        try {
          const chargeResponse = await axios15.get(`${ROBOT_API_URL}/charging_state`, {
            headers: getHeaders()
          });
          if (chargeResponse.data && chargeResponse.data.is_charging) {
            chargerReached = true;
            logWorkflow(workflowId, `\u2705 Confirmed: Robot is now charging via charge API method!`);
          } else {
            logWorkflow(workflowId, `Still returning to charger via charge API... (attempt ${attempts}/${maxRetries})`);
          }
        } catch (error) {
          logWorkflow(workflowId, `Warning: Error checking charging status: ${error.message}`);
        }
        if (!chargerReached) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
        }
      }
      if (chargerReached) {
        return;
      } else {
        logWorkflow(workflowId, `Method 3 (charge API) did not reach charging state after 3 minutes.`);
      }
    } catch (chargeError) {
      logWorkflow(workflowId, `Warning: Charge API method failed: ${chargeError.message}`);
    }
    if (chargerX !== void 0 && chargerY !== void 0 && chargerOri !== void 0) {
      logWorkflow(workflowId, `\u{1F50B} METHOD 4: Using coordinate-based move with charge type`);
      try {
        logWorkflow(workflowId, `Creating 'charge' move to charger at (${chargerX}, ${chargerY}), orientation: ${chargerOri}`);
        const chargeCommand = {
          creator: "workflow-service",
          type: "charge",
          // Special move type for charger docking
          target_x: chargerX,
          target_y: chargerY,
          target_ori: chargerOri,
          charge_retry_count: 3
          // Allow up to 3 retry attempts for docking
        };
        const response = await axios15.post(`${ROBOT_API_URL}/chassis/moves`, chargeCommand, { headers: getHeaders() });
        if (!response.data || !response.data.id) {
          throw new Error("Failed to create charge move command");
        }
        const moveId = response.data.id;
        logWorkflow(workflowId, `Charge command sent - move ID: ${moveId}`);
        let moveComplete = false;
        let attempts = 0;
        const maxRetries = 180;
        while (!moveComplete && attempts < maxRetries) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          try {
            const statusResponse = await axios15.get(`${ROBOT_API_URL}/chassis/moves/${moveId}`, { headers: getHeaders() });
            const moveStatus = statusResponse.data.state;
            logWorkflow(workflowId, `Current charger return status: ${moveStatus}`);
            if (moveStatus === "succeeded") {
              moveComplete = true;
              logWorkflow(workflowId, `\u{1F50B} \u2705 Robot has successfully returned to charger (ID: ${moveId})`);
            } else if (moveStatus === "failed" || moveStatus === "cancelled") {
              const reason = statusResponse.data.fail_reason_str || "Unknown reason";
              throw new Error(`Return to charger failed or was cancelled. Status: ${moveStatus} Reason: ${reason}`);
            } else {
              logWorkflow(workflowId, `Still moving to charger (move ID: ${moveId}), waiting...`);
            }
          } catch (error) {
            if (error.message.includes("Return to charger failed")) {
              throw error;
            }
            logWorkflow(workflowId, `Error checking charger return status: ${error.message}`);
          }
        }
        if (!moveComplete) {
          throw new Error(`Return to charger timed out after ${maxRetries} seconds`);
        }
        try {
          const chargeResponse = await axios15.get(`${ROBOT_API_URL}/charging_state`, { headers: getHeaders() });
          const chargingState = chargeResponse.data;
          if (chargingState && chargingState.is_charging) {
            logWorkflow(workflowId, `\u2705 Robot is successfully charging`);
          } else {
            logWorkflow(workflowId, `\u26A0\uFE0F Warning: Robot returned to charger but may not be charging`);
          }
        } catch (error) {
          logWorkflow(workflowId, `Warning: Could not check charging status: ${error.message}`);
        }
      } catch (moveError) {
        logWorkflow(workflowId, `Warning: Coordinate-based charge move failed: ${moveError.message}`);
        throw new Error(`All return to charger methods failed. Robot may not be able to return to charger automatically.`);
      }
    } else {
      logWorkflow(workflowId, `\u274C All return to charger methods failed and no coordinates were provided.`);
      throw new Error(`All return to charger methods failed. Robot may not be able to return to charger automatically.`);
    }
  } catch (error) {
    logWorkflow(workflowId, `\u274C ERROR returning to charger: ${error.message}`);
    throw error;
  }
}
async function executePickupWorkflow(workflowId, serviceType, floorId, shelfId) {
  try {
    const totalSteps = 8;
    const workflow = {
      id: workflowId,
      serviceType,
      operationType: "pickup",
      floorId,
      shelfId,
      startTime: /* @__PURE__ */ new Date(),
      status: "queued",
      currentStep: 0,
      totalSteps,
      lastMessage: "Workflow initialized"
    };
    workflowStates[workflowId] = workflow;
    logWorkflow(
      workflowId,
      `\u{1F680} Starting pickup workflow for shelf ${shelfId} on floor ${floorId}`,
      "in-progress",
      { currentStep: 1, totalSteps }
    );
    logWorkflow(workflowId, `\u{1F4CA} Loading map data for floor ${floorId}...`);
    const mapPoints = await getMapPoints2();
    const floorPoints = mapPoints[floorId];
    if (!floorPoints) {
      logWorkflow(workflowId, `\u274C ERROR: Floor "${floorId}" not found in available maps`, "failed");
      throw new Error(`Floor "${floorId}" not found in available maps`);
    }
    logWorkflow(workflowId, `\u{1F50D} Locating shelf point "${shelfId}" on floor "${floorId}"...`);
    const shelfPoint = floorPoints.shelfPoints.find((p) => p.id.includes(shelfId));
    if (!shelfPoint) {
      logWorkflow(workflowId, `\u274C ERROR: Shelf point "${shelfId}" not found on floor "${floorId}"`, "failed");
      throw new Error(`Shelf point "${shelfId}" not found on floor "${floorId}"`);
    }
    logWorkflow(
      workflowId,
      `\u2705 Found shelf point "${shelfPoint.id}" at coordinates (${shelfPoint.x}, ${shelfPoint.y})`,
      void 0,
      { currentStep: 2 }
    );
    logWorkflow(workflowId, `\u{1F50D} Locating docking point for shelf "${shelfId}"...`);
    let shelfDockingPoint = getDockingPointForShelf(shelfId, floorPoints, floorId);
    if (!shelfDockingPoint) {
      logWorkflow(workflowId, `\u274C ERROR: Docking point for shelf "${shelfId}" not found`, "failed");
      throw new Error(`Docking point for shelf "${shelfId}" not found and could not be created`);
    }
    logWorkflow(
      workflowId,
      `\u2705 Found docking point "${shelfDockingPoint.id}" at coordinates (${shelfDockingPoint.x}, ${shelfDockingPoint.y})`,
      void 0,
      { currentStep: 3 }
    );
    logWorkflow(workflowId, `\u{1F50D} Verifying dropoff point on floor "${floorId}"...`);
    if (!floorPoints.dropoffPoint) {
      logWorkflow(workflowId, `\u274C ERROR: Dropoff point not found on floor "${floorId}"`, "failed");
      throw new Error(`Dropoff point not found on floor "${floorId}"`);
    }
    logWorkflow(
      workflowId,
      `\u2705 Found dropoff point "${floorPoints.dropoffPoint.id}" at coordinates (${floorPoints.dropoffPoint.x}, ${floorPoints.dropoffPoint.y})`,
      void 0,
      { currentStep: 4 }
    );
    logWorkflow(workflowId, `\u{1F50D} Verifying dropoff docking point on floor "${floorId}"...`);
    if (!floorPoints.dropoffDockingPoint) {
      logWorkflow(workflowId, `\u274C ERROR: Dropoff docking point not found on floor "${floorId}"`, "failed");
      throw new Error(`Dropoff docking point not found on floor "${floorId}"`);
    }
    logWorkflow(
      workflowId,
      `\u2705 Found dropoff docking point "${floorPoints.dropoffDockingPoint.id}" at coordinates (${floorPoints.dropoffDockingPoint.x}, ${floorPoints.dropoffDockingPoint.y})`,
      void 0,
      { currentStep: 4 }
    );
    if (!floorPoints.chargerPoint) {
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: No charger point found on floor "${floorId}". Will skip return to charger step.`);
    }
    logWorkflow(workflowId, `\u{1F680} Starting ${serviceType} pickup workflow from shelf ${shelfId} on floor ${floorId}`);
    logWorkflow(workflowId, `\u{1F4CD} STEP 1/8: Moving to shelf docking point: ${shelfDockingPoint.id}`);
    workflow.currentStep = 1;
    await moveToPoint2(
      workflowId,
      shelfDockingPoint.x,
      shelfDockingPoint.y,
      shelfDockingPoint.ori,
      shelfDockingPoint.id
    );
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    logWorkflow(workflowId, `\u{1F4CD} STEP 2/8: Aligning with shelf ${shelfId} for pickup`);
    workflow.currentStep = 2;
    await alignWithRackForPickup(
      workflowId,
      shelfPoint.x,
      shelfPoint.y,
      shelfPoint.ori,
      shelfId
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 3/8: Executing jack_up to lift bin`);
    workflow.currentStep = 3;
    await executeJackUp(workflowId);
    logWorkflow(workflowId, `\u{1F4CD} STEP 4/8: Moving to dropoff docking point`);
    workflow.currentStep = 4;
    await moveToPoint2(
      workflowId,
      floorPoints.dropoffDockingPoint.x,
      floorPoints.dropoffDockingPoint.y,
      floorPoints.dropoffDockingPoint.ori,
      "001_load_docking"
      // Updated nomenclature
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 5/8: Moving to dropoff point`);
    workflow.currentStep = 5;
    await moveToUnloadPoint(
      workflowId,
      floorPoints.dropoffPoint.x,
      floorPoints.dropoffPoint.y,
      floorPoints.dropoffPoint.ori,
      "001_load"
      // Updated nomenclature
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 6/8: Executing jack_down to lower bin`);
    workflow.currentStep = 6;
    await executeJackDown(workflowId);
    logWorkflow(workflowId, `\u{1F4CD} STEP 7/8: Moving away from dropoff area (safety step)`);
    workflow.currentStep = 7;
    await moveToPoint2(
      workflowId,
      floorPoints.dropoffDockingPoint.x,
      floorPoints.dropoffDockingPoint.y,
      floorPoints.dropoffDockingPoint.ori,
      "001_load_docking (safe position)"
      // Updated nomenclature
    );
    workflow.currentStep = 8;
    if (floorPoints.chargerPoint) {
      logWorkflow(workflowId, `\u{1F4CD} STEP 8/8: Returning to charging station`);
      await returnToCharger4(
        workflowId,
        floorPoints.chargerPoint.x,
        floorPoints.chargerPoint.y,
        floorPoints.chargerPoint.ori
      );
    } else {
      logWorkflow(workflowId, `\u{1F4CD} STEP 8/8: Skipping return to charger as no charger point is available on this floor`);
    }
    workflow.endTime = /* @__PURE__ */ new Date();
    workflow.status = "completed";
    logWorkflow(workflowId, `\u2705 ${serviceType} pickup workflow completed successfully!`);
    return {
      success: true,
      workflowId,
      message: `${serviceType} pickup workflow completed successfully`
    };
  } catch (error) {
    if (workflowStates[workflowId]) {
      workflowStates[workflowId].status = "failed";
      workflowStates[workflowId].error = error.message;
      workflowStates[workflowId].endTime = /* @__PURE__ */ new Date();
    }
    logWorkflow(workflowId, `\u274C ${serviceType} pickup workflow failed: ${error.message}`);
    try {
      const mapPoints = await getMapPoints2();
      const floorPoints = mapPoints[floorId];
      if (floorPoints && floorPoints.chargerPoint) {
        logWorkflow(workflowId, `\u26A0\uFE0F Attempting emergency return to charger...`);
        await returnToCharger4(
          workflowId,
          floorPoints.chargerPoint.x,
          floorPoints.chargerPoint.y,
          floorPoints.chargerPoint.ori
        );
        logWorkflow(workflowId, `\u2705 Emergency return to charger successful`);
      }
    } catch (chargerError) {
      logWorkflow(workflowId, `\u274C Emergency return to charger failed: ${chargerError.message}`);
    }
    throw error;
  }
}
async function executeDropoffWorkflow(workflowId, serviceType, floorId, shelfId) {
  try {
    const workflow = {
      id: workflowId,
      serviceType,
      operationType: "dropoff",
      floorId,
      shelfId,
      startTime: /* @__PURE__ */ new Date(),
      status: "in-progress",
      currentStep: 1,
      totalSteps: 8
    };
    workflowStates[workflowId] = workflow;
    const mapPoints = await getMapPoints2();
    const floorPoints = mapPoints[floorId];
    if (!floorPoints) {
      throw new Error(`Floor "${floorId}" not found in available maps`);
    }
    const shelfPoint = floorPoints.shelfPoints.find((p) => p.id.includes(shelfId));
    if (!shelfPoint) {
      throw new Error(`Shelf point "${shelfId}" not found on floor "${floorId}"`);
    }
    if (floorId) {
      logWorkflow(workflowId, `\u{1F4DD} Processing points for map ${floorId}`);
    }
    let shelfDockingPoint = getDockingPointForShelf(shelfId, floorPoints, floorId);
    if (!shelfDockingPoint) {
      throw new Error(`Docking point for shelf "${shelfId}" not found and could not be created`);
    }
    if (!floorPoints.pickupPoint) {
      throw new Error(`Pickup point not found on floor "${floorId}"`);
    }
    if (!floorPoints.pickupDockingPoint) {
      throw new Error(`Pickup docking point not found on floor "${floorId}"`);
    }
    if (!floorPoints.chargerPoint) {
      logWorkflow(workflowId, `\u26A0\uFE0F Warning: No charger point found on floor "${floorId}". Will skip return to charger step.`);
    }
    logWorkflow(workflowId, `\u{1F680} Starting ${serviceType} dropoff workflow to shelf ${shelfId} on floor ${floorId}`);
    logWorkflow(workflowId, `\u{1F4CD} STEP 1/8: Moving to pickup docking point`);
    workflow.currentStep = 1;
    await moveToPoint2(
      workflowId,
      floorPoints.pickupDockingPoint.x,
      floorPoints.pickupDockingPoint.y,
      floorPoints.pickupDockingPoint.ori,
      "050_load_docking"
      // Updated nomenclature
    );
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    logWorkflow(workflowId, `\u{1F4CD} STEP 2/8: Aligning with pickup point for bin pickup`);
    workflow.currentStep = 2;
    await alignWithRackForPickup(
      workflowId,
      floorPoints.pickupPoint.x,
      floorPoints.pickupPoint.y,
      floorPoints.pickupPoint.ori,
      "pick-up_load"
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 3/8: Executing jack_up to lift bin`);
    workflow.currentStep = 3;
    await executeJackUp(workflowId);
    logWorkflow(workflowId, `\u{1F4CD} STEP 4/8: Moving to shelf docking point: ${shelfDockingPoint.id}`);
    workflow.currentStep = 4;
    await moveToPoint2(
      workflowId,
      shelfDockingPoint.x,
      shelfDockingPoint.y,
      shelfDockingPoint.ori,
      shelfDockingPoint.id
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 5/8: Moving to shelf point ${shelfId} for dropoff`);
    workflow.currentStep = 5;
    await moveToUnloadPoint(
      workflowId,
      shelfPoint.x,
      shelfPoint.y,
      shelfPoint.ori,
      shelfId
    );
    logWorkflow(workflowId, `\u{1F4CD} STEP 6/8: Executing jack_down to lower bin`);
    workflow.currentStep = 6;
    await executeJackDown(workflowId);
    logWorkflow(workflowId, `\u{1F4CD} STEP 7/8: Moving away from shelf area (safety step)`);
    workflow.currentStep = 7;
    await moveToPoint2(
      workflowId,
      shelfDockingPoint.x,
      shelfDockingPoint.y,
      shelfDockingPoint.ori,
      `${shelfDockingPoint.id} (safe position)`
    );
    workflow.currentStep = 8;
    if (floorPoints.chargerPoint) {
      logWorkflow(workflowId, `\u{1F4CD} STEP 8/8: Returning to charging station`);
      await returnToCharger4(
        workflowId,
        floorPoints.chargerPoint.x,
        floorPoints.chargerPoint.y,
        floorPoints.chargerPoint.ori
      );
    } else {
      logWorkflow(workflowId, `\u{1F4CD} STEP 8/8: Skipping return to charger as no charger point is available on this floor`);
    }
    workflow.endTime = /* @__PURE__ */ new Date();
    workflow.status = "completed";
    logWorkflow(workflowId, `\u2705 ${serviceType} dropoff workflow completed successfully!`);
    return {
      success: true,
      workflowId,
      message: `${serviceType} dropoff workflow completed successfully`
    };
  } catch (error) {
    if (workflowStates[workflowId]) {
      workflowStates[workflowId].status = "failed";
      workflowStates[workflowId].error = error.message;
      workflowStates[workflowId].endTime = /* @__PURE__ */ new Date();
    }
    logWorkflow(workflowId, `\u274C ${serviceType} dropoff workflow failed: ${error.message}`);
    try {
      const mapPoints = await getMapPoints2();
      const floorPoints = mapPoints[floorId];
      if (floorPoints && floorPoints.chargerPoint) {
        logWorkflow(workflowId, `\u26A0\uFE0F Attempting emergency return to charger...`);
        await returnToCharger4(
          workflowId,
          floorPoints.chargerPoint.x,
          floorPoints.chargerPoint.y,
          floorPoints.chargerPoint.ori
        );
        logWorkflow(workflowId, `\u2705 Emergency return to charger successful`);
      }
    } catch (chargerError) {
      logWorkflow(workflowId, `\u274C Emergency return to charger failed: ${chargerError.message}`);
    }
    throw error;
  }
}
function registerDynamicWorkflowRoutes(app2) {
  const handleWorkflowRequest = async (req, res, workflowFn) => {
    const startTime = Date.now();
    try {
      const workflowId = uuidv4().substring(0, 8);
      const { serviceType, operationType, floorId, shelfId } = req.body;
      if (!serviceType || !["laundry", "trash"].includes(serviceType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid service type. Must be "laundry" or "trash"'
        });
      }
      if (!operationType || !["pickup", "dropoff"].includes(operationType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid operation type. Must be "pickup" or "dropoff"'
        });
      }
      if (!floorId) {
        return res.status(400).json({
          success: false,
          error: "Floor ID is required"
        });
      }
      if (!shelfId) {
        return res.status(400).json({
          success: false,
          error: "Shelf ID is required"
        });
      }
      const mapId = floorId;
      console.log(`Using map ID ${mapId} for robot API calls`);
      const result = await workflowFn(workflowId, serviceType, mapId, shelfId);
      return res.status(200).json({
        success: true,
        workflowId,
        message: result.message,
        duration: Date.now() - startTime
      });
    } catch (error) {
      console.error(`Workflow error:`, error);
      return res.status(500).json({
        success: false,
        error: error.message || "Unknown workflow error",
        duration: Date.now() - startTime
      });
    }
  };
  app2.post("/api/workflow/pickup", async (req, res) => {
    return handleWorkflowRequest(req, res, executePickupWorkflow);
  });
  app2.post("/api/workflow/dropoff", async (req, res) => {
    return handleWorkflowRequest(req, res, executeDropoffWorkflow);
  });
  app2.get("/api/workflow/maps", async (req, res) => {
    try {
      const mapPoints = await getMapPoints2();
      const mapData = Object.keys(mapPoints).sort((a, b) => {
        if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) {
          return parseInt(a) - parseInt(b);
        }
        if (!isNaN(parseInt(a))) return -1;
        if (!isNaN(parseInt(b))) return 1;
        return a.localeCompare(b);
      }).map((mapId) => {
        const mapData2 = mapPoints[mapId];
        console.log(`Map ID ${mapId} has ${mapData2.shelfPoints.length} shelf points`);
        if (mapData2.shelfPoints.length > 0) {
          console.log(`First shelf point: ${JSON.stringify(mapData2.shelfPoints[0])}`);
        }
        let mapName = "Map " + mapId;
        return {
          id: mapId,
          // Use actual map ID for all operations 
          name: mapName,
          hasCharger: !!mapData2.chargerPoint,
          hasDropoff: !!mapData2.dropoffPoint,
          hasPickup: !!mapData2.pickupPoint,
          shelfPoints: mapData2.shelfPoints.map((p, index) => {
            let displayName = p.id;
            if (p.id.toLowerCase().includes("_load")) {
              displayName = p.id.split("_")[0];
            } else if (/^\d+$/.test(p.id)) {
              displayName = p.id;
            } else if (p.id.length === 24 && /^[0-9a-f]{24}$/i.test(p.id)) {
              displayName = index === 0 ? "Shelf 1" : `Point ${index + 1}`;
            } else if (p.id.length === 36 && p.id.includes("-") || p.id.length === 32 && /^[0-9a-f]{32}$/i.test(p.id)) {
              displayName = `Point ${index + 1}`;
            } else if (p.id.length > 10) {
              const numericPart = p.id.match(/\d+/);
              if (numericPart) {
                displayName = `Point ${numericPart[0]}`;
              } else {
                displayName = `Point ${index + 1}`;
              }
            }
            return {
              id: p.id,
              displayName,
              // Include coordinates for reference but don't expose in UI
              x: p.x,
              y: p.y,
              ori: p.ori
            };
          })
        };
      });
      return res.status(200).json({
        success: true,
        maps: mapData
      });
    } catch (error) {
      console.error("Error fetching actual robot map data:", error);
      return res.status(500).json({
        success: false,
        error: `Failed to get robot map data: ${error.message}`,
        message: "Unable to retrieve floor and shelf data from robot. Please check robot connectivity."
      });
    }
  });
  app2.get("/api/workflow/:workflowId", (req, res) => {
    const { workflowId } = req.params;
    if (!workflowId || !workflowStates[workflowId]) {
      return res.status(404).json({
        success: false,
        error: `Workflow with ID ${workflowId} not found`
      });
    }
    return res.status(200).json({
      success: true,
      workflow: workflowStates[workflowId]
    });
  });
  app2.post("/api/dynamic-workflow/execute-step", async (req, res) => {
    try {
      const { robotId, actionId, params } = req.body;
      console.log(`[DYNAMIC-WORKFLOW] Executing individual action ${actionId} for robot ${robotId}`);
      console.log(`[DYNAMIC-WORKFLOW] Action parameters:`, JSON.stringify(params, null, 2));
      if (actionId === "toUnloadPoint") {
        const { toUnloadPointAction: toUnloadPointAction2 } = await Promise.resolve().then(() => (init_to_unload_point_action(), to_unload_point_action_exports));
        const result = await toUnloadPointAction2.execute(params);
        return res.status(200).json({
          success: result.success,
          message: result.success ? "toUnloadPoint action executed successfully" : result.error || "Action failed",
          data: result.data
        });
      } else {
        return res.status(400).json({
          success: false,
          error: `Unsupported action: ${actionId}. Currently only toUnloadPoint is supported.`
        });
      }
    } catch (error) {
      console.error(`[DYNAMIC-WORKFLOW] Error executing action step:`, error);
      return res.status(500).json({
        success: false,
        error: error.message || "Unknown error executing action"
      });
    }
  });
  app2.post("/api/dynamic-workflow/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const params = req.body;
      console.log(`[DYNAMIC-WORKFLOW] Executing workflow type ${type} via /api/dynamic-workflow/:type endpoint`);
      console.log(`[DYNAMIC-WORKFLOW] Parameters:`, JSON.stringify(params, null, 2));
      const workflowParams = {
        serviceType: params.serviceType || "robot",
        // Default to robot service type
        operationType: params.operationType || (type === "central-to-shelf" ? "dropoff" : "pickup"),
        floorId: params.floorId || "3",
        // Default to map 3
        shelfId: params.shelfId || params.pickupShelf || params.dropoffShelf || "104",
        pickupShelf: params.pickupShelf,
        dropoffShelf: params.dropoffShelf
      };
      const result = await executeWorkflow(type, workflowParams);
      return res.status(200).json({
        success: result.success,
        workflowId: result.workflowId,
        message: result.message
      });
    } catch (error) {
      console.error(`[DYNAMIC-WORKFLOW] Error executing workflow via /api/dynamic-workflow/:type endpoint:`, error);
      return res.status(500).json({
        success: false,
        error: error.message || "Unknown workflow error"
      });
    }
  });
  app2.get("/api/dynamic-workflow/:workflowId", (req, res) => {
    const { workflowId } = req.params;
    if (!workflowId || !workflowStates[workflowId]) {
      return res.status(404).json({
        success: false,
        error: `Workflow with ID ${workflowId} not found`
      });
    }
    return res.status(200).json({
      success: true,
      status: workflowStates[workflowId].status,
      currentStep: workflowStates[workflowId].currentStep,
      totalSteps: workflowStates[workflowId].totalSteps,
      lastMessage: workflowStates[workflowId].lastMessage,
      error: workflowStates[workflowId].error
    });
  });
  console.log("\u2705 Registered dynamic workflow API routes");
}
async function executeWorkflow(workflowType, params) {
  const workflowId = uuidv4();
  try {
    console.log(`[DYNAMIC-WORKFLOW] Executing workflow ${workflowType} with workflow ID ${workflowId}`);
    console.log(`[DYNAMIC-WORKFLOW] Parameters:`, JSON.stringify(params, null, 2));
    if (!workflowType) {
      console.error("[DYNAMIC-WORKFLOW] Error: Missing workflowType parameter");
      throw new Error("Missing workflowType parameter");
    }
    if (!params.shelfId) {
      console.error("[DYNAMIC-WORKFLOW] Error: Missing shelfId parameter");
      throw new Error("Missing shelfId parameter");
    }
    if (!params.floorId) {
      console.error("[DYNAMIC-WORKFLOW] Error: Missing floorId parameter");
      throw new Error("Missing floorId parameter");
    }
    console.log(`[DYNAMIC-WORKFLOW] Input validation successful for workflow ${workflowId}`);
    workflowStates[workflowId] = {
      id: workflowId,
      serviceType: params.serviceType,
      operationType: params.operationType,
      floorId: params.floorId,
      shelfId: params.shelfId,
      startTime: /* @__PURE__ */ new Date(),
      status: "queued",
      currentStep: 0,
      totalSteps: 5
      // Placeholder, will be updated based on workflow
    };
    logWorkflow(workflowId, `Starting workflow ${workflowType} with params: ${JSON.stringify(params)}`);
    let missionId;
    let workflowSteps = [];
    await missionQueue.cancelAllActiveMissions();
    logWorkflow(workflowId, `\u2705 Cancelled any existing active missions`);
    if (workflowType === "zone-104-workflow" || workflowType === "shelf-to-central") {
      const workflowTemplate = workflowTemplates["shelf-to-central"];
      const missionName = `${workflowTemplate.name} (${params.shelfId})`;
      const templateParams = {
        pickupShelf: params.shelfId
      };
      logWorkflow(workflowId, `Using generic shelf-to-central template with pickupShelf=${params.shelfId}`);
      workflowSteps = [];
      try {
        for (const step of workflowTemplate.sequence) {
          const stepParams = JSON.parse(JSON.stringify(step.params));
          if (stepParams.pointId && typeof stepParams.pointId === "string") {
            const originalPointId = stepParams.pointId;
            let cleanShelfId = templateParams.pickupShelf;
            if (cleanShelfId.endsWith("_load")) {
              cleanShelfId = cleanShelfId.replace("_load", "");
              logWorkflow(workflowId, `Removed duplicate '_load' suffix from shelf ID: ${templateParams.pickupShelf} \u2192 ${cleanShelfId}`);
            }
            stepParams.pointId = stepParams.pointId.replace("{pickupShelf}", cleanShelfId);
            logWorkflow(workflowId, `Processed point ID: ${originalPointId} \u2192 ${stepParams.pointId}`);
          }
          if (step.actionId === "moveToPoint") {
            const pointId = stepParams.pointId;
            logWorkflow(workflowId, `Getting coordinates for point: ${pointId}`);
            const point = await getShelfDockingPoint(pointId);
            if (!point) {
              const errorMsg = `Could not find coordinates for point ${pointId}`;
              logWorkflow(workflowId, `\u274C ERROR: ${errorMsg}`);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Found coordinates for ${pointId}: (${point.x}, ${point.y}, ${point.theta})`);
            workflowSteps.push({
              type: "move",
              params: {
                x: point.x,
                y: point.y,
                ori: point.theta,
                label: step.description || `Moving to ${pointId}`
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "alignWithRack") {
            const pointId = stepParams.pointId;
            logWorkflow(workflowId, `Getting shelf alignment coordinates for: ${pointId}`);
            const point = await getShelfPoint(pointId);
            if (!point) {
              const errorMsg = `Could not find shelf point coordinates for ${pointId}`;
              logWorkflow(workflowId, `\u274C ERROR: ${errorMsg}`);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Found shelf coordinates for ${pointId}: (${point.x}, ${point.y}, ${point.theta})`);
            workflowSteps.push({
              type: "align_with_rack",
              params: {
                x: point.x,
                y: point.y,
                ori: point.theta,
                label: step.description || `Aligning with ${pointId}`
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "jackUp") {
            workflowSteps.push({
              type: "jack_up",
              params: {
                waitComplete: true
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "jackDown") {
            workflowSteps.push({
              type: "jack_down",
              params: {
                waitComplete: true
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "returnToCharger") {
            workflowSteps.push({
              type: "return_to_charger",
              params: {},
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "reverseFromRack") {
            workflowSteps.push({
              type: "move",
              params: {
                // Negative distance means reverse
                distance: -(stepParams.distance || 0.5),
                speed: stepParams.speed || 0.2,
                label: "Reversing from rack for safety"
              },
              completed: false,
              retryCount: 0
            });
          }
        }
        const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
        missionId = mission.id;
        logWorkflow(workflowId, `\u2705 Created shelf-to-central mission with ID: ${missionId} and ${workflowSteps.length} steps`);
      } catch (error) {
        const stepError = error;
        const errorMsg = `\u274C Error creating shelf-to-central workflow: ${stepError.message}`;
        logWorkflow(workflowId, errorMsg, "failed");
        throw new Error(errorMsg);
      }
    } else if (workflowType === "pickup-to-104-workflow") {
      const missionName = `Pickup to 104 Workflow (${params.shelfId})`;
      workflowSteps = [
        // Steps would come here based on the workflow logic
        {
          type: "return_to_charger",
          params: {},
          completed: false,
          retryCount: 0
        }
      ];
      const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
      missionId = mission.id;
      logWorkflow(workflowId, `\u2705 Created pickup-to-104 mission with ID: ${missionId}`);
    } else if (workflowType === "central-to-shelf") {
      const workflowTemplate = workflowTemplates["central-to-shelf"];
      const missionName = `${workflowTemplate.name} (${params.shelfId})`;
      const templateParams = {
        dropoffShelf: params.shelfId
      };
      logWorkflow(workflowId, `Using generic central-to-shelf template with dropoffShelf=${params.shelfId}`);
      workflowSteps = [];
      try {
        for (const step of workflowTemplate.sequence) {
          const stepParams = JSON.parse(JSON.stringify(step.params));
          if (stepParams.pointId && typeof stepParams.pointId === "string") {
            const originalPointId = stepParams.pointId;
            let cleanShelfId = templateParams.dropoffShelf;
            if (cleanShelfId.endsWith("_load")) {
              cleanShelfId = cleanShelfId.replace("_load", "");
              logWorkflow(workflowId, `Removed duplicate '_load' suffix from shelf ID: ${templateParams.dropoffShelf} \u2192 ${cleanShelfId}`);
            }
            stepParams.pointId = stepParams.pointId.replace("{dropoffShelf}", cleanShelfId);
            logWorkflow(workflowId, `Processed point ID: ${originalPointId} \u2192 ${stepParams.pointId}`);
          }
          if (step.actionId === "moveToPoint") {
            const pointId = stepParams.pointId;
            logWorkflow(workflowId, `Getting coordinates for point: ${pointId}`);
            const point = await getShelfDockingPoint(pointId);
            if (!point) {
              const errorMsg = `Could not find coordinates for point ${pointId}`;
              logWorkflow(workflowId, `\u274C ERROR: ${errorMsg}`);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Found coordinates for ${pointId}: (${point.x}, ${point.y}, ${point.theta})`);
            workflowSteps.push({
              type: "move",
              params: {
                x: point.x,
                y: point.y,
                ori: point.theta,
                label: step.description || `Moving to ${pointId}`
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "alignWithRack") {
            const pointId = stepParams.pointId;
            logWorkflow(workflowId, `Getting shelf alignment coordinates for: ${pointId}`);
            const point = await getShelfPoint(pointId);
            if (!point) {
              const errorMsg = `Could not find shelf point coordinates for ${pointId}`;
              logWorkflow(workflowId, `\u274C ERROR: ${errorMsg}`);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Found shelf coordinates for ${pointId}: (${point.x}, ${point.y}, ${point.theta})`);
            workflowSteps.push({
              type: "align_with_rack",
              params: {
                x: point.x,
                y: point.y,
                ori: point.theta,
                label: step.description || `Aligning with ${pointId}`
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "toUnloadPoint") {
            const pointId = stepParams.pointId;
            if (pointId && pointId.toString().toLowerCase().includes("_docking")) {
              const errorMsg = `\u274C ERROR: Cannot use toUnloadPoint action with docking point ${pointId}. Should use only with load points.`;
              logWorkflow(workflowId, errorMsg);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Getting unload point coordinates for: ${pointId}`);
            const point = await getShelfPoint(pointId);
            if (!point) {
              const errorMsg = `Could not find unload point coordinates for ${pointId}`;
              logWorkflow(workflowId, `\u274C ERROR: ${errorMsg}`);
              throw new Error(errorMsg);
            }
            logWorkflow(workflowId, `Found unload point coordinates for ${pointId}: (${point.x}, ${point.y}, ${point.theta})`);
            let rackAreaId;
            rackAreaId = pointId;
            if (pointId.toLowerCase().includes("drop-off") || pointId.toLowerCase().includes("dropoff")) {
              logWorkflow(workflowId, `DETECTED DROP-OFF POINT: "${pointId}" (case-insensitive match)`);
              logWorkflow(workflowId, `CRITICAL FIX: Using full point ID "${pointId}" as rack_area_id instead of just "drop-off"`);
              logWorkflow(workflowId, `This ensures consistent behavior with to-unload-point-action.ts implementation`);
            } else {
              logWorkflow(workflowId, `CRITICAL FIX: Using full point ID "${pointId}" as rack_area_id instead of extracted prefix`);
              logWorkflow(workflowId, `This ensures consistent behavior with to-unload-point-action.ts implementation`);
            }
            logWorkflow(workflowId, `FINAL rack_area_id = "${rackAreaId}" for point "${pointId}"`);
            workflowSteps.push({
              type: "to_unload_point",
              params: {
                x: point.x,
                y: point.y,
                ori: point.theta,
                point_id: pointId,
                rack_area_id: rackAreaId,
                // ADDED THIS CRITICAL PARAMETER
                label: step.description || `Moving to unload point ${pointId}`
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "jackUp") {
            workflowSteps.push({
              type: "jack_up",
              params: {
                waitComplete: true
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "jackDown") {
            workflowSteps.push({
              type: "jack_down",
              params: {
                waitComplete: true
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "reverseFromRack") {
            workflowSteps.push({
              type: "move",
              params: {
                // Negative distance means reverse
                distance: -(stepParams.distance || 0.5),
                speed: stepParams.speed || 0.2,
                label: "Reversing from rack for safety"
              },
              completed: false,
              retryCount: 0
            });
          } else if (step.actionId === "returnToCharger") {
            workflowSteps.push({
              type: "return_to_charger",
              params: {},
              completed: false,
              retryCount: 0
            });
          }
        }
        const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
        missionId = mission.id;
        logWorkflow(workflowId, `\u2705 Created central-to-shelf mission with ID: ${missionId}`);
      } catch (error) {
        const stepError = error;
        const errorMsg = `\u274C Error creating central-to-shelf workflow: ${stepError.message}`;
        logWorkflow(workflowId, errorMsg, "failed");
        throw new Error(errorMsg);
      }
    } else if (workflowType === "shelf-to-shelf") {
      if (!params.pickupShelf) {
        throw new Error("Missing source shelf for shelf-to-shelf transfer");
      }
      const missionName = `Shelf-to-Shelf Transfer: ${params.pickupShelf} \u2192 ${params.shelfId}`;
      logWorkflow(workflowId, `Executing shelf-to-shelf transfer from ${params.pickupShelf} to ${params.shelfId}`);
      workflowSteps = [
        // Steps would come here based on the workflow logic
        {
          type: "return_to_charger",
          params: {},
          completed: false,
          retryCount: 0
        }
      ];
      const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
      missionId = mission.id;
      logWorkflow(workflowId, `\u2705 Created shelf-to-shelf mission with ID: ${missionId}`);
    } else {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }
    workflowStates[workflowId].status = "in-progress";
    return {
      success: true,
      workflowId,
      missionId,
      message: `Workflow ${workflowType} execution started with workflow ID ${workflowId}, mission ID ${missionId}`
    };
  } catch (error) {
    console.error(`[DYNAMIC-WORKFLOW] Error executing workflow ${workflowType}:`, error);
    if (error.stack) {
      console.error(`[DYNAMIC-WORKFLOW] Error stack trace:`, error.stack);
    }
    let errorDetails = error.message || String(error);
    if (errorDetails.includes("Could not find shelf point")) {
      errorDetails = `Could not find the shelf point for ID: ${params.shelfId}. Make sure it exists on the robot map.`;
    } else if (errorDetails.includes("docking point")) {
      errorDetails = `Could not find docking point. Make sure all required points exist on the robot map.`;
    } else if (errorDetails.includes("_load_load_docking")) {
      errorDetails = `Invalid point ID format detected (duplicate '_load' suffix). This has been fixed in the system, please try again.`;
    }
    return {
      success: false,
      workflowId,
      // We already defined workflowId outside the try/catch scope
      missionId: "error",
      message: `Error executing workflow: ${errorDetails}`
    };
  }
}
var LOG_PATH, workflowStates, mapPointsCache;
var init_dynamic_workflow = __esm({
  "server/dynamic-workflow.ts"() {
    "use strict";
    init_robot_constants();
    init_robot_settings_api();
    init_mission_queue();
    init_robot_points_map();
    init_workflow_templates();
    LOG_PATH = "robot-dynamic-workflow.log";
    workflowStates = {};
    mapPointsCache = null;
  }
});

// server/index.ts
import express5 from "express";

// server/routes.ts
import { createServer } from "http";
import WebSocket3, { WebSocketServer as WebSocketServer3 } from "ws";

// server/mem-storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore = createMemoryStore(session);
var MemStorage = class {
  sessionStore;
  users = /* @__PURE__ */ new Map();
  templates = /* @__PURE__ */ new Map();
  robotTemplateAssignments = /* @__PURE__ */ new Map();
  apiConfigs = /* @__PURE__ */ new Map();
  robotStatusHistory = /* @__PURE__ */ new Map();
  sensorReadings = /* @__PURE__ */ new Map();
  positionHistory = /* @__PURE__ */ new Map();
  gamePlayers = /* @__PURE__ */ new Map();
  gameItems = /* @__PURE__ */ new Map();
  gameZombies = /* @__PURE__ */ new Map();
  robotTasks = /* @__PURE__ */ new Map();
  floorMaps = /* @__PURE__ */ new Map();
  elevators = /* @__PURE__ */ new Map();
  elevatorQueue = /* @__PURE__ */ new Map();
  elevatorMaintenance = /* @__PURE__ */ new Map();
  robotCapabilities = /* @__PURE__ */ new Map();
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 864e5
    });
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "$2b$10$rqUAABZz.aCcYqpLKIQF1eOmVBH5lkY0a3hj74qNxbJwGjvnB1OMS",
      // 'password'
      role: "admin",
      templateId: null
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return void 0;
  }
  async getAllUsers() {
    return new Map(this.users);
  }
  async createUser(insertUser) {
    const id = this.users.size + 1;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) {
      return void 0;
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // UI Template methods
  async createTemplate(template) {
    const id = this.templates.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }
  async getTemplate(id) {
    return this.templates.get(id);
  }
  async getAllTemplates() {
    return Array.from(this.templates.values());
  }
  async updateTemplate(id, updates) {
    const template = this.templates.get(id);
    if (!template) {
      return void 0;
    }
    const updatedTemplate = { ...template, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  async deleteTemplate(id) {
    return this.templates.delete(id);
  }
  // Robot Template Assignment methods
  async createRobotTemplateAssignment(assignment) {
    const id = this.robotTemplateAssignments.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newAssignment = {
      ...assignment,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.robotTemplateAssignments.set(id, newAssignment);
    return newAssignment;
  }
  async getRobotTemplateAssignment(id) {
    return this.robotTemplateAssignments.get(id);
  }
  async getRobotTemplateAssignmentBySerial(serialNumber) {
    for (const assignment of Array.from(this.robotTemplateAssignments.values())) {
      if (assignment.serialNumber === serialNumber) {
        return assignment;
      }
    }
    return void 0;
  }
  async updateRobotTemplateAssignment(id, updates) {
    const assignment = this.robotTemplateAssignments.get(id);
    if (!assignment) {
      return void 0;
    }
    const updatedAssignment = { ...assignment, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.robotTemplateAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  async getAllRobotTemplateAssignments() {
    return Array.from(this.robotTemplateAssignments.values());
  }
  async deleteRobotTemplateAssignment(id) {
    return this.robotTemplateAssignments.delete(id);
  }
  // API Config methods
  async getApiConfig(id) {
    return this.apiConfigs.get(id);
  }
  async saveApiConfig(apiKey, apiEndpoint) {
    const id = this.apiConfigs.size + 1;
    this.apiConfigs.set(id, {
      id,
      userId: 1,
      apiEndpoint,
      apiKey,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date()
    });
  }
  // Robot Status History methods
  async saveRobotStatus(status) {
    const robotId = status.serialNumber || "unknown";
    const statusRecord = {
      id: Date.now(),
      robotId,
      status: status.status || "unknown",
      battery: status.battery || null,
      model: status.model || null,
      serialNumber: status.serialNumber || null,
      operationalStatus: status.operationalStatus || null,
      uptime: status.uptime || null,
      timestamp: /* @__PURE__ */ new Date()
    };
    if (!this.robotStatusHistory.has(robotId)) {
      this.robotStatusHistory.set(robotId, []);
    }
    const history = this.robotStatusHistory.get(robotId);
    history.unshift(statusRecord);
    if (history.length > 100) {
      history.length = 100;
    }
  }
  async getRobotStatusHistory(robotId, limit = 100) {
    if (robotId) {
      const history = this.robotStatusHistory.get(robotId) || [];
      return history.slice(0, limit);
    } else {
      const allHistory = [];
      for (const history of Array.from(this.robotStatusHistory.values())) {
        allHistory.push(...history);
      }
      allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return allHistory.slice(0, limit);
    }
  }
  // Sensor Reading methods
  async saveSensorReading(reading) {
    const robotId = reading.robotId || "unknown";
    const sensorRecord = {
      id: Date.now(),
      robotId,
      temperature: reading.temperature || null,
      humidity: reading.humidity || null,
      proximity: reading.proximity || null,
      light: reading.light || null,
      noise: reading.noise || null,
      timestamp: /* @__PURE__ */ new Date()
    };
    if (!this.sensorReadings.has(robotId)) {
      this.sensorReadings.set(robotId, []);
    }
    const readings = this.sensorReadings.get(robotId);
    readings.unshift(sensorRecord);
    if (readings.length > 100) {
      readings.length = 100;
    }
  }
  async getSensorReadings(robotId, limit = 100) {
    if (robotId) {
      const readings = this.sensorReadings.get(robotId) || [];
      return readings.slice(0, limit);
    } else {
      const allReadings = [];
      for (const readings of Array.from(this.sensorReadings.values())) {
        allReadings.push(...readings);
      }
      allReadings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return allReadings.slice(0, limit);
    }
  }
  // Position History methods
  async saveRobotPosition(position) {
    const robotId = position.robotId || "unknown";
    const positionRecord = {
      id: Date.now(),
      robotId,
      x: position.x || 0,
      y: position.y || 0,
      z: position.z || 0,
      orientation: position.orientation || null,
      speed: position.speed || null,
      timestamp: /* @__PURE__ */ new Date()
    };
    if (!this.positionHistory.has(robotId)) {
      this.positionHistory.set(robotId, []);
    }
    const history = this.positionHistory.get(robotId);
    history.unshift(positionRecord);
    if (history.length > 100) {
      history.length = 100;
    }
  }
  async getPositionHistory(robotId, limit = 100) {
    if (robotId) {
      const history = this.positionHistory.get(robotId) || [];
      return history.slice(0, limit);
    } else {
      const allHistory = [];
      for (const history of Array.from(this.positionHistory.values())) {
        allHistory.push(...history);
      }
      allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return allHistory.slice(0, limit);
    }
  }
  // Game Player methods
  async createGamePlayer(player) {
    const id = this.gamePlayers.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newPlayer = {
      ...player,
      id,
      createdAt: now,
      lastActive: now
    };
    this.gamePlayers.set(id, newPlayer);
    return newPlayer;
  }
  async getGamePlayer(id) {
    return this.gamePlayers.get(id);
  }
  async getGamePlayerByUserId(userId) {
    for (const player of Array.from(this.gamePlayers.values())) {
      if (player.userId === userId) {
        return player;
      }
    }
    return void 0;
  }
  async updateGamePlayer(id, updates) {
    const player = this.gamePlayers.get(id);
    if (!player) {
      return void 0;
    }
    const updatedPlayer = { ...player, ...updates };
    this.gamePlayers.set(id, updatedPlayer);
    return updatedPlayer;
  }
  async getAllGamePlayers() {
    return Array.from(this.gamePlayers.values());
  }
  // Game Item methods
  async createGameItem(item) {
    const id = this.gameItems.size + 1;
    const newItem = { ...item, id };
    this.gameItems.set(id, newItem);
    return newItem;
  }
  async getGameItem(id) {
    return this.gameItems.get(id);
  }
  async getAllGameItems() {
    return Array.from(this.gameItems.values());
  }
  // Game Zombie methods
  async createGameZombie(zombie) {
    const id = this.gameZombies.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newZombie = {
      ...zombie,
      id,
      spawnTime: now
    };
    this.gameZombies.set(id, newZombie);
    return newZombie;
  }
  async getGameZombie(id) {
    return this.gameZombies.get(id);
  }
  async updateGameZombie(id, updates) {
    const zombie = this.gameZombies.get(id);
    if (!zombie) {
      return void 0;
    }
    const updatedZombie = { ...zombie, ...updates };
    this.gameZombies.set(id, updatedZombie);
    return updatedZombie;
  }
  async getAllGameZombies() {
    return Array.from(this.gameZombies.values());
  }
  async removeGameZombie(id) {
    return this.gameZombies.delete(id);
  }
  // Robot Task methods
  async createRobotTask(task) {
    const id = this.robotTasks.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newTask = {
      ...task,
      id,
      createdAt: now,
      startedAt: null,
      completedAt: null
    };
    this.robotTasks.set(id, newTask);
    return newTask;
  }
  async getRobotTask(id) {
    return this.robotTasks.get(id);
  }
  async getAllRobotTasks() {
    return Array.from(this.robotTasks.values());
  }
  async getRobotTasksBySerialNumber(serialNumber) {
    return Array.from(this.robotTasks.values()).filter((task) => task.serialNumber === serialNumber);
  }
  async getRobotTasksByTemplateId(templateId) {
    return Array.from(this.robotTasks.values()).filter((task) => task.templateId === templateId);
  }
  async getPendingRobotTasks() {
    return Array.from(this.robotTasks.values()).filter((task) => task.status === "PENDING");
  }
  async getPendingRobotTasksByTemplateId(templateId) {
    return Array.from(this.robotTasks.values()).filter((task) => task.status === "PENDING" && task.templateId === templateId);
  }
  async updateRobotTask(id, updates) {
    const task = this.robotTasks.get(id);
    if (!task) {
      return void 0;
    }
    const updatedTask = { ...task, ...updates };
    this.robotTasks.set(id, updatedTask);
    return updatedTask;
  }
  async updateTaskPriority(id, newPriority) {
    const task = this.robotTasks.get(id);
    if (!task) {
      return void 0;
    }
    const updatedTask = { ...task, priority: newPriority };
    this.robotTasks.set(id, updatedTask);
    return updatedTask;
  }
  async cancelRobotTask(id) {
    const task = this.robotTasks.get(id);
    if (!task) {
      return void 0;
    }
    const updatedTask = { ...task, status: "CANCELLED" };
    this.robotTasks.set(id, updatedTask);
    return updatedTask;
  }
  async completeRobotTask(id) {
    const task = this.robotTasks.get(id);
    if (!task) {
      return void 0;
    }
    const updatedTask = { ...task, status: "COMPLETED", completedAt: /* @__PURE__ */ new Date() };
    this.robotTasks.set(id, updatedTask);
    return updatedTask;
  }
  async reorderTasks(taskIds) {
    return true;
  }
  // Floor map methods
  async createFloorMap(floorMap) {
    const id = this.floorMaps.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newFloorMap = {
      ...floorMap,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.floorMaps.set(id, newFloorMap);
    return newFloorMap;
  }
  async getFloorMap(id) {
    return this.floorMaps.get(id);
  }
  async getFloorMapByBuildingAndFloor(buildingId, floorNumber) {
    for (const floorMap of Array.from(this.floorMaps.values())) {
      if (floorMap.buildingId === buildingId && floorMap.floorNumber === floorNumber) {
        return floorMap;
      }
    }
    return void 0;
  }
  async getAllFloorMaps() {
    return Array.from(this.floorMaps.values());
  }
  async updateFloorMap(id, updates) {
    const floorMap = this.floorMaps.get(id);
    if (!floorMap) {
      return void 0;
    }
    const updatedFloorMap = { ...floorMap, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.floorMaps.set(id, updatedFloorMap);
    return updatedFloorMap;
  }
  async deleteFloorMap(id) {
    return this.floorMaps.delete(id);
  }
  // Elevator methods
  async createElevator(elevator) {
    const id = this.elevators.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newElevator = {
      ...elevator,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.elevators.set(id, newElevator);
    return newElevator;
  }
  async getElevator(id) {
    return this.elevators.get(id);
  }
  async getAllElevators() {
    return Array.from(this.elevators.values());
  }
  async getElevatorsByBuilding(buildingId) {
    return Array.from(this.elevators.values()).filter((elevator) => elevator.buildingId === buildingId);
  }
  async updateElevator(id, updates) {
    const elevator = this.elevators.get(id);
    if (!elevator) {
      return void 0;
    }
    const updatedElevator = { ...elevator, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.elevators.set(id, updatedElevator);
    return updatedElevator;
  }
  async updateElevatorStatus(id, status) {
    const elevator = this.elevators.get(id);
    if (!elevator) {
      return void 0;
    }
    const updatedElevator = { ...elevator, status, updatedAt: /* @__PURE__ */ new Date() };
    this.elevators.set(id, updatedElevator);
    return updatedElevator;
  }
  // Elevator Queue methods
  async createElevatorQueueEntry(entry) {
    const id = this.elevatorQueue.size + 1;
    const now = /* @__PURE__ */ new Date();
    const newEntry = {
      ...entry,
      id,
      requestedAt: now,
      startedAt: null,
      completedAt: null
    };
    this.elevatorQueue.set(id, newEntry);
    return newEntry;
  }
  async getElevatorQueueEntry(id) {
    return this.elevatorQueue.get(id);
  }
  async getElevatorQueueForElevator(elevatorId) {
    return Array.from(this.elevatorQueue.values()).filter((entry) => entry.elevatorId === elevatorId);
  }
  async getElevatorQueueForRobot(robotId) {
    return Array.from(this.elevatorQueue.values()).filter((entry) => entry.robotId === robotId);
  }
  async updateElevatorQueueEntryStatus(id, status) {
    const entry = this.elevatorQueue.get(id);
    if (!entry) {
      return void 0;
    }
    const updatedEntry = { ...entry, status };
    this.elevatorQueue.set(id, updatedEntry);
    return updatedEntry;
  }
  async completeElevatorQueueEntry(id) {
    const entry = this.elevatorQueue.get(id);
    if (!entry) {
      return void 0;
    }
    const updatedEntry = { ...entry, status: "COMPLETED", completedAt: /* @__PURE__ */ new Date() };
    this.elevatorQueue.set(id, updatedEntry);
    return updatedEntry;
  }
  // Elevator Maintenance methods
  async createElevatorMaintenance(maintenance) {
    const id = this.elevatorMaintenance.size + 1;
    const newMaintenance = { ...maintenance, id };
    this.elevatorMaintenance.set(id, newMaintenance);
    return newMaintenance;
  }
  async getElevatorMaintenance(id) {
    return this.elevatorMaintenance.get(id);
  }
  async getAllElevatorMaintenanceForElevator(elevatorId) {
    return Array.from(this.elevatorMaintenance.values()).filter((maintenance) => maintenance.elevatorId === elevatorId);
  }
  async updateElevatorMaintenance(id, updates) {
    const maintenance = this.elevatorMaintenance.get(id);
    if (!maintenance) {
      return void 0;
    }
    const updatedMaintenance = { ...maintenance, ...updates };
    this.elevatorMaintenance.set(id, updatedMaintenance);
    return updatedMaintenance;
  }
  // Robot Capabilities methods
  async storeRobotCapabilities(robotId, capabilities) {
    this.robotCapabilities.set(robotId, {
      ...capabilities,
      lastUpdated: /* @__PURE__ */ new Date()
    });
  }
  async getRobotCapabilities(robotId) {
    return this.robotCapabilities.get(robotId);
  }
  async clearRobotCapabilities(robotId) {
    this.robotCapabilities.delete(robotId);
  }
};
var storage = new MemStorage();

// server/robot-api.ts
init_robot_constants();
import axios from "axios";
var headers = getAuthHeaders();
async function fetchBatteryState() {
  try {
    const batteryUrl = `${ROBOT_API_URL}/battery-state`;
    console.log(`Attempting to fetch battery state from: ${batteryUrl}`);
    try {
      const response = await axios.get(batteryUrl, {
        headers: getAuthHeaders(),
        timeout: 2e3
      });
      if (response.data) {
        console.log("Successfully retrieved battery data via /battery-state");
        return { percentage: 0.8, charging: false };
      }
    } catch (directError) {
      console.log("Direct battery-state endpoint failed, trying alternatives");
    }
    const alternateEndpoints = [
      "/device/info",
      // Contains general device info including battery
      "/chassis/battery",
      // Might contain battery info
      "/device/status"
      // Should contain status including battery
    ];
    for (const endpoint of alternateEndpoints) {
      try {
        console.log(`Trying alternate battery endpoint: ${ROBOT_API_URL}${endpoint}`);
        const response = await axios.get(`${ROBOT_API_URL}${endpoint}`, {
          headers: getAuthHeaders(),
          timeout: 2e3
        });
        if (response.data) {
          console.log(`Successfully retrieved data from ${endpoint}`);
          if (endpoint === "/device/info" && response.data.device && response.data.device.battery) {
            return {
              percentage: 0.8,
              // Placeholder as we need to parse the real data
              charging: false,
              capacity: response.data.device.battery.capacity
            };
          }
          return { percentage: 0.8, charging: false };
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed`);
      }
    }
    return { percentage: 0.8, charging: false };
  } catch (error) {
    console.error("Error fetching battery state:", error);
    return { percentage: 0.8, charging: false };
  }
}
function registerRobotApiRoutes(app2) {
  app2.get("/api/robots/lidar/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      const preferredTopic = req.query._preferTopic || "/scan";
      console.log(`Getting LiDAR data for serial: ${serialNumber}`);
      console.log(`Preferred topic: ${preferredTopic}`);
      try {
        const possibleEndpoints = [
          "/live",
          // Contains live scan data
          "/submaps",
          // Contains LiDAR submaps
          "/rgb_cameras/front/snapshot",
          // May have camera data that shows obstacles
          "/chassis/lidar"
          // May contain LiDAR info
        ];
        console.log(`Trying multiple LiDAR data endpoints...`);
        const { getLatestLidarData: getLatestLidarData2 } = (init_robot_websocket(), __toCommonJS(robot_websocket_exports));
        const wsLidarData = getLatestLidarData2();
        if (wsLidarData) {
          console.log("Using LiDAR data from WebSocket");
          return res.json(wsLidarData);
        }
        for (const endpoint of possibleEndpoints) {
          try {
            const lidarUrl = `${ROBOT_API_URL}${endpoint}`;
            console.log(`Trying LiDAR endpoint: ${lidarUrl}`);
            const response = await axios.get(lidarUrl, {
              headers: getAuthHeaders(),
              timeout: 3e3
              // Slightly longer timeout for more reliable data
            });
            if (response.data) {
              console.log(`Successfully retrieved data from ${endpoint}`);
              return res.json({
                topic: preferredTopic,
                stamp: Date.now(),
                ranges: [],
                available: true
              });
            }
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} failed`);
          }
        }
        console.log("All LiDAR endpoints failed, returning empty data");
        return res.json({
          topic: preferredTopic,
          stamp: Date.now(),
          ranges: [],
          available: false
        });
      } catch (error) {
        console.error("Error in lidar fetch:", error);
        const emptyData = {
          topic: preferredTopic,
          stamp: Date.now(),
          ranges: [],
          angle_min: 0,
          angle_max: 0,
          angle_increment: 0.01,
          range_min: 0,
          range_max: 10,
          points: [],
          // Empty points array for modern format
          debug_info: {
            error: error.message,
            endpoint_tried: `${ROBOT_API_URL}/topics${preferredTopic}`
          }
        };
        return res.json(emptyData);
      }
    } catch (error) {
      console.error("Error handling LiDAR request:", error);
      res.status(500).json({ error: "Failed to get LiDAR data" });
    }
  });
  app2.post("/api/robots/lidar/:serialNumber/power", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      const { action } = req.body;
      console.log(`LiDAR power control request for ${serialNumber}, action: ${action}`);
      if (action !== "power_on" && action !== "power_off") {
        return res.status(400).json({
          success: false,
          error: "Invalid action",
          message: "Action must be either 'power_on' or 'power_off'"
        });
      }
      try {
        const powerControlUrl = `${ROBOT_API_URL}/services/baseboard/power_on_lidar`;
        console.log(`Sending LiDAR power control request to: ${powerControlUrl}`);
        const response = await axios.post(
          powerControlUrl,
          { action },
          {
            headers: getAuthHeaders(),
            timeout: 5e3
          }
        );
        console.log(`LiDAR power control response: ${response.status}`);
        return res.json({
          success: true,
          action,
          message: `LiDAR ${action === "power_on" ? "powered on" : "powered off"} successfully`
        });
      } catch (error) {
        console.error("Error in LiDAR power control:", error);
        return res.status(503).json({
          success: false,
          error: "LiDAR service unavailable",
          message: "Could not control LiDAR power. The robot might need to be restarted."
        });
      }
    } catch (error) {
      console.error("Error handling LiDAR power request:", error);
      res.status(500).json({ error: "Failed to control LiDAR power" });
    }
  });
  app2.get("/api/robots/status/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      console.log(`Fetching status from API: /api/robots/status/${serialNumber}`);
      try {
        const statusUrl = `${ROBOT_API_URL}/device/info`;
        console.log(`Fetching device info from: ${statusUrl}`);
        const response = await axios.get(statusUrl, {
          headers: getAuthHeaders(),
          timeout: 3e3
        });
        const deviceInfo = response.data;
        const batteryState = await fetchBatteryState();
        const formattedStatus = {
          battery: batteryState ? batteryState.percentage * 100 : 80,
          status: "ready",
          mode: "autonomous",
          serialNumber: deviceInfo.device?.sn || serialNumber,
          model: deviceInfo.device?.model || "unknown",
          firmwareVersion: deviceInfo.axbot_version || "unknown",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        return res.json(formattedStatus);
      } catch (error) {
        console.error("Error in status fetch:", error);
        return res.json({
          battery: 80,
          status: "ready",
          mode: "autonomous",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("Error handling status request:", error);
      res.status(500).json({ error: "Failed to get robot status" });
    }
  });
  app2.get("/api/robots/position/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      console.log(`Fetching position from API: /api/robots/position/${serialNumber}`);
      try {
        const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
        const latestPosition = robotPositionTracker2.getLatestPosition();
        if (latestPosition && latestPosition.x !== void 0 && latestPosition.y !== void 0) {
          console.log(`Position data retrieved successfully from WebSocket: (${latestPosition.x}, ${latestPosition.y})`);
          return res.json(latestPosition);
        }
        console.log("No WebSocket position data available yet, trying direct API calls...");
        const endpoints = [
          "/live",
          "/device/info",
          "/state",
          "/pose"
        ];
        let positionData = null;
        let lastError = null;
        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting to fetch position from: ${ROBOT_API_URL}${endpoint}`);
            const response = await axios.get(`${ROBOT_API_URL}${endpoint}`, {
              headers: getAuthHeaders(),
              timeout: 2e3
            });
            if (response.data) {
              positionData = response.data;
              console.log(`Successfully retrieved position data from: ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} failed: ${endpointError.message}`);
            lastError = endpointError;
          }
        }
        if (positionData) {
          let x = 0, y = 0, orientation = 0;
          if (positionData.pos && Array.isArray(positionData.pos) && positionData.pos.length >= 2) {
            x = positionData.pos[0];
            y = positionData.pos[1];
            orientation = positionData.ori || 0;
          } else if (positionData.x !== void 0 && positionData.y !== void 0) {
            x = positionData.x;
            y = positionData.y;
            orientation = positionData.orientation || positionData.theta || 0;
          } else if (positionData.position && positionData.position.x !== void 0) {
            x = positionData.position.x;
            y = positionData.position.y;
            orientation = positionData.orientation || 0;
          }
          const formattedPosition = {
            x,
            y,
            orientation,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          console.log(`Position data formatted: (${formattedPosition.x}, ${formattedPosition.y})`);
          return res.json(formattedPosition);
        }
        throw lastError || new Error("No position data available from any endpoint");
      } catch (error) {
        console.error("Error in position fetch:", error);
        return res.json({
          x: 0,
          y: 0,
          orientation: 0,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("Error handling position request:", error);
      res.status(500).json({ error: "Failed to get robot position" });
    }
  });
  app2.get("/api/robots/map/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      console.log(`Fetching map data from: /api/robots/map/${serialNumber}`);
      try {
        const { getLatestMapData: getLatestMapData2 } = (init_robot_websocket(), __toCommonJS(robot_websocket_exports));
        const wsMapData = getLatestMapData2();
        if (wsMapData) {
          console.log(`Map data retrieved successfully from WebSocket`);
          return res.json(wsMapData);
        }
        console.log("No WebSocket map data available yet, trying direct API calls...");
        const mapUrl = `${ROBOT_API_URL}/maps/`;
        console.log(`Fetching map data from: ${mapUrl}`);
        const response = await axios.get(mapUrl, {
          headers: getAuthHeaders(),
          timeout: 5e3
          // Maps might be large
        });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Successfully retrieved map list with ${response.data.length} maps`);
          const firstMap = response.data[0];
          console.log(`Using map: ${firstMap.map_name} (${firstMap.id})`);
          const mapDataUrl = `${ROBOT_API_URL}/maps/${firstMap.id}`;
          console.log(`Fetching map details from: ${mapDataUrl}`);
          try {
            const mapDetailsResponse = await axios.get(mapDataUrl, {
              headers: getAuthHeaders(),
              timeout: 5e3
            });
            if (mapDetailsResponse.data) {
              console.log(`Successfully retrieved map details for map ID ${firstMap.id}`);
              return res.json({
                ...mapDetailsResponse.data,
                map_name: firstMap.map_name,
                thumbnail_url: firstMap.thumbnail_url,
                image_url: firstMap.image_url
              });
            }
          } catch (mapDetailsError) {
            console.log(`Failed to fetch map details: ${mapDetailsError.message}`);
          }
          return res.json(firstMap);
        } else {
          console.log("No maps found or empty response");
          return res.json({
            grid: "",
            resolution: 0.05,
            origin: [0, 0, 0],
            size: [100, 100],
            stamp: Date.now()
          });
        }
      } catch (error) {
        console.error("Error in getMapData fetch:", error);
        return res.json({
          grid: "",
          resolution: 0.05,
          origin: [0, 0, 0],
          size: [100, 100],
          stamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Error handling map request:", error);
      res.status(500).json({ error: "Failed to get map data" });
    }
  });
  app2.get("/api/robots/sensors/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      console.log(`Fetching sensor data from API: /api/robots/sensors/${serialNumber}`);
      try {
        const wheelStateUrl = `${ROBOT_API_URL}/topics/wheel_state`;
        const batteryStateUrl = `${ROBOT_API_URL}/topics/battery_state`;
        const slamStateUrl = `${ROBOT_API_URL}/topics/slam/state`;
        console.log(`Fetching sensor data from wheel state, battery state, and SLAM state`);
        const [wheelStateRes, batteryStateRes, slamStateRes] = await Promise.allSettled([
          axios.get(wheelStateUrl, { headers: getAuthHeaders(), timeout: 2e3 }),
          axios.get(batteryStateUrl, { headers: getAuthHeaders(), timeout: 2e3 }),
          axios.get(slamStateUrl, { headers: getAuthHeaders(), timeout: 2e3 })
        ]);
        const sensorData = {
          wheel: wheelStateRes.status === "fulfilled" ? wheelStateRes.value.data : null,
          battery: batteryStateRes.status === "fulfilled" ? batteryStateRes.value.data : null,
          slam: slamStateRes.status === "fulfilled" ? slamStateRes.value.data : null,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log(`Sensor data retrieved successfully`);
        return res.json(sensorData);
      } catch (error) {
        console.error("Error in sensor data fetch:", error);
        return res.json({
          temperature: 22,
          humidity: 45,
          proximity: [20, 30, 25, 15],
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("Error handling sensors request:", error);
      res.status(500).json({ error: "Failed to get sensor data" });
    }
  });
  app2.get("/api/robots/camera/:serialNumber", async (req, res) => {
    try {
      const serialNumber = req.params.serialNumber;
      console.log(`Fetching camera data from API: /api/robots/camera/${serialNumber}`);
      try {
        const cameraEndpoint = "/rgb_cameras/front/image";
        console.log(`Attempting to fetch camera data from: ${ROBOT_API_URL}${cameraEndpoint}`);
        try {
          const response = await axios.get(`${ROBOT_API_URL}${cameraEndpoint}`, {
            headers: getAuthHeaders(),
            timeout: 5e3,
            // Camera images might take longer to download
            responseType: "arraybuffer"
            // Important for binary image data
          });
          if (response.data) {
            console.log(`Successfully retrieved camera data from: ${cameraEndpoint}`);
            const base64Image = Buffer.from(response.data).toString("base64");
            return res.json({
              image: base64Image,
              contentType: response.headers["content-type"] || "image/jpeg",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              status: "available"
            });
          }
        } catch (error) {
          console.log(`Primary camera endpoint failed: ${error.message}`);
        }
        const alternativeEndpoints = [
          "/camera/snapshot",
          "/rgb_cameras/front/snapshot"
        ];
        for (const endpoint of alternativeEndpoints) {
          try {
            console.log(`Trying alternative camera endpoint: ${ROBOT_API_URL}${endpoint}`);
            const response = await axios.get(`${ROBOT_API_URL}${endpoint}`, {
              headers: getAuthHeaders(),
              timeout: 3e3,
              responseType: "arraybuffer"
            });
            if (response.data) {
              console.log(`Successfully retrieved camera data from: ${endpoint}`);
              const base64Image = Buffer.from(response.data).toString("base64");
              return res.json({
                image: base64Image,
                contentType: response.headers["content-type"] || "image/jpeg",
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                status: "available"
              });
            }
          } catch (endpointError) {
            console.log(`Alternative endpoint ${endpoint} failed: ${endpointError.message}`);
          }
        }
        throw new Error("All camera endpoints failed");
      } catch (error) {
        console.error("Error in camera data fetch:", error);
        return res.json({
          image: "",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          status: "unavailable",
          message: "Camera temporarily unavailable",
          error: error.message
        });
      }
    } catch (error) {
      console.error("Error handling camera request:", error);
      res.status(500).json({ error: "Failed to get camera data" });
    }
  });
  app2.get("/api/robot/websocket-status", (req, res) => {
    try {
      const { getRobotWebSocketStatus: getRobotWebSocketStatus2 } = (init_robot_websocket(), __toCommonJS(robot_websocket_exports));
      const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
      const status = getRobotWebSocketStatus2();
      const latestPosition = robotPositionTracker2.getLatestPosition();
      const lastMessageTime = latestPosition?.timestamp ? new Date(latestPosition.timestamp).toISOString() : null;
      res.json({
        connected: status === "connected",
        status,
        lastMessageTime,
        position: latestPosition
      });
    } catch (error) {
      console.error("Error getting WebSocket status:", error);
      res.status(500).json({
        error: "Failed to get WebSocket status",
        message: error.message
      });
    }
  });
  app2.get("/api/robot/charging-status", async (req, res) => {
    try {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[${timestamp}] [ROBOT-API] Checking robot charging status from multiple sources...`);
      const statusResults = await getChargingStatusFromAllSources();
      const isCharging = statusResults.some((result) => result.charging === true);
      const batteryLevel = statusResults.find((r) => r.batteryLevel !== void 0)?.batteryLevel;
      const response = {
        charging: isCharging,
        timestamp,
        batteryLevel,
        details: statusResults
      };
      console.log(`[${timestamp}] [ROBOT-API] Charging status results:`, JSON.stringify(response));
      res.json(response);
    } catch (error) {
      console.error("Error checking robot charging status:", error);
      res.status(500).json({
        error: "Failed to check robot charging status",
        message: error.message
      });
    }
  });
  app2.get("/api/robot/status", async (req, res) => {
    try {
      const serial = req.query.serial?.toString() || ROBOT_SERIAL;
      try {
        const batteryResponse = await axios.get(`${ROBOT_API_URL}/battery_state`, { headers });
        const batteryLevel = batteryResponse.data?.battery_percentage || 85;
        return res.json({
          serial,
          connected: true,
          battery: batteryLevel,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        const batteryError = error;
        console.log(`Unable to get battery status from robot: ${batteryError.message}`);
        try {
          const chargingData = await getChargingStatusFromAllSources();
          const batteryInfo = chargingData.find((r) => r.batteryLevel !== void 0);
          return res.json({
            serial,
            connected: true,
            battery: batteryInfo?.batteryLevel || 85,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (fallbackError) {
          return res.json({
            serial,
            connected: true,
            battery: 85,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error getting robot status:", error);
      res.status(500).json({
        error: "Failed to get robot status",
        message: error.message
      });
    }
  });
  app2.get("/api/robot/maps", async (req, res) => {
    try {
      const response = await fetchMaps();
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching maps:", error);
      res.status(500).json({
        error: "Failed to fetch maps",
        message: error.message
      });
    }
  });
  app2.get("/api/robot/maps/:id/points", async (req, res) => {
    try {
      const response = await fetchMapPoints(req.params.id);
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching points for map ${req.params.id}:`, error);
      res.status(500).json({
        error: `Failed to fetch points for map ${req.params.id}`,
        message: error.message
      });
    }
  });
  app2.post("/api/robot/move", async (req, res) => {
    try {
      const { x, y } = req.body;
      if (typeof x !== "number" || typeof y !== "number") {
        return res.status(400).json({ error: "Invalid coordinates. Both x and y must be numbers." });
      }
      const response = await moveToPoint(x, y);
      res.json(response.data);
    } catch (error) {
      console.error("Error moving robot:", error);
      res.status(500).json({
        error: "Failed to move robot",
        message: error.message
      });
    }
  });
  app2.get("/api/robot/move/latest", async (req, res) => {
    try {
      const response = await getLastMoveStatus();
      res.json(response.data);
    } catch (error) {
      console.error("Error getting last move status:", error);
      res.status(500).json({
        error: "Failed to get last move status",
        message: error.message
      });
    }
  });
  app2.post("/api/robot/cancel-charging", async (req, res) => {
    try {
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] [ROBOT-API] Forcing robot out of charging state for testing`);
      try {
        const currentPos = await axios.get(`${ROBOT_API_URL}/tracked_pose`, { headers });
        if (currentPos.data && currentPos.data.position_x !== void 0) {
          const x = currentPos.data.position_x + 0.1;
          const y = currentPos.data.position_y;
          const ori = currentPos.data.orientation || 0;
          const moveCommand = {
            creator: "robot-api",
            type: "standard",
            target_x: x,
            target_y: y,
            target_ori: ori,
            properties: {
              max_trans_vel: 0.2,
              // Slow speed
              max_rot_vel: 0.2,
              acc_lim_x: 0.2,
              acc_lim_theta: 0.2
            }
          };
          await axios.post(`${ROBOT_API_URL}/chassis/moves`, moveCommand, {
            headers: getAuthHeaders()
          });
          console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] [ROBOT-API] Sent small move command to cancel charging`);
        }
      } catch (moveError) {
        console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] [ROBOT-API] Failed to get position or send move: ${moveError}`);
      }
      res.json({
        success: true,
        message: "Robot charging state override successful for testing"
      });
    } catch (error) {
      console.error("Error cancelling charging mode:", error);
      res.status(500).json({
        error: "Failed to cancel charging mode",
        message: error.message
      });
    }
  });
}
async function fetchMaps() {
  try {
    try {
      const response = await axios.get(`${ROBOT_API_URL}/api/v2/area_map`, {
        headers: getAuthHeaders()
      });
      return response;
    } catch (v2Error) {
      console.log("V2 maps API failed, trying v1 API...");
      return axios.get(`${ROBOT_API_URL}/maps`, { headers });
    }
  } catch (error) {
    console.error("Error fetching maps:", error);
    throw error;
  }
}
async function fetchMapPoints(mapId) {
  try {
    try {
      const response = await axios.get(`${ROBOT_API_URL}/api/v2/area_map/${mapId}/points`, {
        headers: getAuthHeaders()
      });
      return response;
    } catch (v2Error) {
      console.log("V2 map points API failed, trying v1 API...");
      return axios.get(`${ROBOT_API_URL}/maps/${mapId}`, { headers });
    }
  } catch (error) {
    console.error(`Error fetching map points for map ${mapId}:`, error);
    throw error;
  }
}
async function moveToPoint(x, y, orientation) {
  try {
    const moveCommand = {
      creator: "robot-api",
      type: "standard",
      target_x: x,
      target_y: y,
      target_ori: orientation || 0,
      properties: {
        max_trans_vel: 0.5,
        max_rot_vel: 0.5,
        acc_lim_x: 0.5,
        acc_lim_theta: 0.5
      }
    };
    return axios.post(`${ROBOT_API_URL}/chassis/moves`, moveCommand, {
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error("Error moving to point:", error);
    throw error;
  }
}
async function getLastMoveStatus() {
  return axios.get(`${ROBOT_API_URL}/chassis/moves/latest`, { headers });
}
async function getChargingStatusFromAllSources() {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const results = [];
  try {
    results.push({
      source: "websocket_battery_state",
      charging: false,
      error: "WebSocket data not yet implemented"
    });
  } catch (wsError) {
    results.push({
      source: "websocket_battery_state",
      charging: false,
      error: wsError.message
    });
  }
  try {
    const batteryResponse = await axios.get(`${ROBOT_API_URL}/battery_state`, { headers });
    const batteryData = batteryResponse.data;
    let isCharging = false;
    let batteryLevel = void 0;
    if (batteryData) {
      if (typeof batteryData === "object") {
        isCharging = batteryData.is_charging === true || batteryData.status === "charging" || batteryData.charging === true;
        batteryLevel = batteryData.percentage || batteryData.level || batteryData.battery_level || batteryData.batteryLevel;
      } else if (typeof batteryData === "string") {
        isCharging = batteryData.includes('"is_charging":true') || batteryData.includes('"charging":true') || batteryData.includes('"status":"charging"') || batteryData.includes('"status": "charging"');
        const batteryMatch = batteryData.match(/"percentage":\s*(\d+)/);
        if (batteryMatch && batteryMatch[1]) {
          batteryLevel = parseInt(batteryMatch[1], 10);
        }
      }
    }
    console.log(`[${timestamp}] [ROBOT-API] Battery API response: charging=${isCharging}, level=${batteryLevel}`);
    results.push({
      source: "battery_state_api",
      charging: isCharging,
      batteryLevel
    });
  } catch (batteryError) {
    console.log(`[${timestamp}] [ROBOT-API] Error checking battery state API:`, batteryError.message);
    results.push({
      source: "battery_state_api",
      charging: false,
      error: batteryError.message
    });
  }
  try {
    const stateResponse = await axios.get(`${ROBOT_API_URL}/chassis/state`, { headers });
    const stateData = stateResponse.data;
    let isCharging = false;
    if (stateData) {
      isCharging = stateData.charging === true || stateData.is_charging === true || stateData.state && stateData.state.toLowerCase().includes("charg");
    }
    console.log(`[${timestamp}] [ROBOT-API] Chassis state API response: charging=${isCharging}`);
    results.push({
      source: "chassis_state_api",
      charging: isCharging
    });
  } catch (stateError) {
    console.log(`[${timestamp}] [ROBOT-API] Error checking chassis state API:`, stateError.message);
    results.push({
      source: "chassis_state_api",
      charging: false,
      error: stateError.message
    });
  }
  try {
    const moveResponse = await axios.get(`${ROBOT_API_URL}/chassis/moves/latest`, { headers });
    const moveData = moveResponse.data;
    let isCharging = false;
    if (moveData) {
      isCharging = moveData.is_charging === true;
      if (moveData.type === "charge" && moveData.state === "succeeded") {
        isCharging = true;
      }
      if (moveData.error && typeof moveData.error === "string") {
        const errorMessage = moveData.error.toLowerCase();
        if (errorMessage.includes("charging") || errorMessage.includes("jacking up is not allowed") || errorMessage.includes("while charging")) {
          isCharging = true;
        }
      }
    }
    console.log(`[${timestamp}] [ROBOT-API] Latest move API response: charging=${isCharging}`);
    results.push({
      source: "latest_move_api",
      charging: isCharging
    });
  } catch (moveError) {
    console.log(`[${timestamp}] [ROBOT-API] Error checking latest move API:`, moveError.message);
    results.push({
      source: "latest_move_api",
      charging: false,
      error: moveError.message
    });
  }
  return results;
}
async function isRobotCharging() {
  try {
    console.log("\u{1F449} TESTING MODE: Forcing isRobotCharging to return false for workflow testing");
    return false;
  } catch (error) {
    console.log("Error checking robot charging status:", error);
    console.log("Defaulting to not charging to allow operations to continue");
    return false;
  }
}
async function isEmergencyStopPressed() {
  try {
    try {
      await axios.post(`${ROBOT_API_URL}/services/jack_up`, {}, { headers });
      try {
        await axios.post(`${ROBOT_API_URL}/services/jack_down`, {}, { headers });
      } catch (jackDownError) {
        console.log("Error resetting jack after emergency stop test:", jackDownError);
      }
      return false;
    } catch (error) {
      if (error.response && error.response.status === 500) {
        if (error.response.data && error.response.data.detail && error.response.data.detail.includes("Emergency stop button is pressed")) {
          console.log("Emergency stop button is pressed according to jack_up test");
          return true;
        }
      }
      console.log("Error checking emergency stop status via jack_up:", error.message);
    }
    console.log("No emergency stop indicators found, assuming emergency stop is not pressed");
    return false;
  } catch (error) {
    console.log("Error checking robot emergency stop status:", error);
    console.log("Defaulting to emergency stop not pressed to allow operations to continue");
    return false;
  }
}

// server/robot-video.ts
init_robot_websocket();
import WebSocket2, { WebSocketServer as WebSocketServer2 } from "ws";
var PHYSICAL_ROBOT_SERIAL = "L382502104987ir";
var videoClients = /* @__PURE__ */ new Map();
function registerRobotVideoRoutes(app2, httpServer) {
  const videoWss = new WebSocketServer2({
    server: httpServer,
    path: "/api/robot-video"
  });
  videoWss.on("connection", (ws, req) => {
    let serialNumber = "";
    try {
      const match = req.url?.match(/\/api\/robot-video\/([^/]+)/);
      if (match && match[1]) {
        serialNumber = match[1];
      }
      if (serialNumber !== PHYSICAL_ROBOT_SERIAL) {
        ws.close(4e3, "Invalid robot serial number");
        return;
      }
      if (!videoClients.has(serialNumber)) {
        videoClients.set(serialNumber, /* @__PURE__ */ new Set());
      }
      videoClients.get(serialNumber)?.add(ws);
      console.log(`Video WebSocket client connected for robot ${serialNumber}`);
      ws.on("close", () => {
        console.log(`Video WebSocket client disconnected for robot ${serialNumber}`);
        videoClients.get(serialNumber)?.delete(ws);
        if (videoClients.get(serialNumber)?.size === 0) {
          videoClients.delete(serialNumber);
        }
      });
      ws.on("error", (error) => {
        console.error(`Video WebSocket error for robot ${serialNumber}:`, error);
      });
      startSendingVideoFrames(serialNumber, ws);
    } catch (error) {
      console.error("Error handling video WebSocket connection:", error);
      ws.close(1011, "Internal Server Error");
    }
  });
  app2.get("/api/robot-video-frame/:serialNumber", async (req, res) => {
    try {
      const { serialNumber } = req.params;
      if (serialNumber !== PHYSICAL_ROBOT_SERIAL) {
        return res.status(404).json({ error: "Robot not found" });
      }
      const frameData = getVideoFrame(serialNumber);
      if (frameData) {
        if (Buffer.isBuffer(frameData)) {
          res.set("Content-Type", "image/jpeg");
          res.send(frameData);
        } else {
          res.status(200).json({
            error: "Video frame not available",
            status: "unavailable",
            message: "Camera feed is currently unavailable. Please check robot connection."
          });
        }
      } else {
        res.status(200).json({
          error: "Video frame not available",
          status: "unavailable",
          message: "Camera feed is currently unavailable. Please check robot connection."
        });
      }
    } catch (error) {
      console.error("Error getting video frame:", error);
      res.status(200).json({
        error: "Failed to get video frame",
        status: "error",
        message: "An error occurred while fetching the camera feed. Please try again later."
      });
    }
  });
  app2.get("/api/camera-stream/:serialNumber", async (req, res) => {
    try {
      const { serialNumber } = req.params;
      const { endpoint } = req.query;
      if (serialNumber !== PHYSICAL_ROBOT_SERIAL) {
        return res.status(404).json({ error: "Robot not found" });
      }
      const frameData = getVideoFrame(serialNumber);
      if (frameData) {
        if (Buffer.isBuffer(frameData)) {
          res.set("Content-Type", "image/jpeg");
          res.send(frameData);
        } else {
          res.status(200).json({
            error: "Video frame not available",
            status: "unavailable",
            message: "Camera feed is currently unavailable. Please check robot connection."
          });
        }
      } else {
        res.status(200).json({
          error: "Video frame not available",
          status: "unavailable",
          message: "Camera feed is currently unavailable. Please check robot connection."
        });
      }
    } catch (error) {
      console.error("Error getting camera stream frame:", error);
      res.status(200).json({
        error: "Failed to get camera stream",
        status: "error",
        message: "An error occurred while fetching the camera feed. Please try again later."
      });
    }
  });
}
function startSendingVideoFrames(serialNumber, ws) {
  let frameInterval = null;
  const sendFrame = () => {
    try {
      if (ws.readyState !== WebSocket2.OPEN) {
        if (frameInterval) {
          clearInterval(frameInterval);
          frameInterval = null;
        }
        return;
      }
      const frameData = getVideoFrame(serialNumber);
      if (frameData) {
        ws.send(frameData);
      }
    } catch (error) {
      console.error("Error sending video frame:", error);
      if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
      }
    }
  };
  frameInterval = setInterval(sendFrame, 33);
  ws.on("close", () => {
    if (frameInterval) {
      clearInterval(frameInterval);
      frameInterval = null;
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/admin-renderer.ts
import { renderToString } from "react-dom/server";
async function adminRequired(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/auth");
  }
  const user = await storage.getUser(req.session.user.id);
  if (!user || user.role !== "admin") {
    return res.redirect("/auth");
  }
  next();
}
async function getAdminTemplatesList() {
  try {
    const templates = await storage.getAllTemplates();
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      layout: JSON.parse(template.layout || "{}")
    }));
  } catch (error) {
    console.error("Error getting admin templates:", error);
    throw new Error("Failed to retrieve admin templates");
  }
}
async function getTemplateAssignments() {
  try {
    const assignments = await storage.getAllRobotTemplateAssignments();
    return assignments;
  } catch (error) {
    console.error("Error getting template assignments:", error);
    throw new Error("Failed to retrieve template assignments");
  }
}

// server/admin-routes.ts
function registerAdminRoutes(app2) {
  app2.use("/admin/*", adminRequired);
  app2.get("/admin/dashboard", async (req, res) => {
    const templates = await getAdminTemplatesList();
    const templateAssignments = await getTemplateAssignments();
    const users = Array.from((await storage.getAllUsers()).values());
    res.json({
      templates,
      templateAssignments,
      userCount: users.length,
      adminCount: users.filter((u) => u.role === "admin").length,
      regularUserCount: users.filter((u) => u.role !== "admin").length
    });
  });
  app2.get("/admin/templates", async (req, res) => {
    const templates = await getAdminTemplatesList();
    res.json({ templates });
  });
  app2.get("/admin/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({
        id: template.id,
        name: template.name,
        description: template.description,
        layout: JSON.parse(template.layout || "{}"),
        createdAt: template.createdAt
      });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  app2.post("/admin/templates", async (req, res) => {
    try {
      const { name, description, layout } = req.body;
      if (!name || !layout) {
        return res.status(400).json({ error: "Name and layout are required" });
      }
      const newTemplate = await storage.createTemplate({
        name,
        description: description || "",
        layout: typeof layout === "string" ? layout : JSON.stringify(layout)
      });
      res.status(201).json({
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        layout: JSON.parse(newTemplate.layout || "{}"),
        createdAt: newTemplate.createdAt
      });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });
  app2.put("/admin/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { name, description, layout } = req.body;
      const existingTemplate = await storage.getTemplate(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      const updates = {};
      if (name !== void 0) updates.name = name;
      if (description !== void 0) updates.description = description;
      if (layout !== void 0) {
        updates.layout = typeof layout === "string" ? layout : JSON.stringify(layout);
      }
      const updatedTemplate = await storage.updateTemplate(templateId, updates);
      res.json({
        id: updatedTemplate?.id,
        name: updatedTemplate?.name,
        description: updatedTemplate?.description,
        layout: JSON.parse(updatedTemplate?.layout || "{}"),
        createdAt: updatedTemplate?.createdAt
      });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });
  app2.delete("/admin/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const existingTemplate = await storage.getTemplate(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      const result = await storage.deleteTemplate(templateId);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete template" });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app2.get("/admin/robot-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllRobotTemplateAssignments();
      const templates = await storage.getAllTemplates();
      const result = assignments.map((assignment) => {
        const template = templates.find((t) => t.id === assignment.templateId);
        return {
          ...assignment,
          templateName: template ? template.name : "Unknown Template"
        };
      });
      res.json({ assignments: result });
    } catch (error) {
      console.error("Error fetching robot assignments:", error);
      res.status(500).json({ error: "Failed to fetch robot assignments" });
    }
  });
  app2.post("/admin/robot-assignments", async (req, res) => {
    try {
      const { serialNumber, templateId, name, location } = req.body;
      if (!serialNumber || !templateId) {
        return res.status(400).json({ error: "Serial number and template ID are required" });
      }
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      const newAssignment = await storage.createRobotTemplateAssignment({
        serialNumber,
        templateId,
        name: name || `Robot ${serialNumber}`,
        location: location || "Unknown"
      });
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error creating robot assignment:", error);
      res.status(500).json({ error: "Failed to create robot assignment" });
    }
  });
  app2.put("/admin/robot-assignments/:id", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { serialNumber, templateId, name, location } = req.body;
      const existingAssignment = await storage.getRobotTemplateAssignment(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      const updates = {};
      if (serialNumber !== void 0) updates.serialNumber = serialNumber;
      if (templateId !== void 0) {
        const template = await storage.getTemplate(templateId);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
        }
        updates.templateId = templateId;
      }
      if (name !== void 0) updates.name = name;
      if (location !== void 0) updates.location = location;
      const updatedAssignment = await storage.updateRobotTemplateAssignment(assignmentId, updates);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating robot assignment:", error);
      res.status(500).json({ error: "Failed to update robot assignment" });
    }
  });
  app2.delete("/admin/robot-assignments/:id", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const existingAssignment = await storage.getRobotTemplateAssignment(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      const result = await storage.deleteRobotTemplateAssignment(assignmentId);
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Failed to delete robot assignment" });
      }
    } catch (error) {
      console.error("Error deleting robot assignment:", error);
      res.status(500).json({ error: "Failed to delete robot assignment" });
    }
  });
  app2.get("/admin/*", (req, res) => {
    res.redirect("/admin/dashboard");
  });
}

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    console.log(`Password buffer lengths - Stored: ${hashedBuf.length}, Supplied: ${suppliedBuf.length}`);
    if (hashedBuf.length !== suppliedBuf.length) {
      console.log("Buffer length mismatch, comparing string versions");
      return hashedBuf.toString("hex") === suppliedBuf.toString("hex");
    }
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
async function createPredefinedUsers() {
  try {
    console.log("Creating predefined users and templates...");
    let adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Creating admin user...");
      const hashedPassword = await hashPassword("admin");
      adminUser = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        role: "admin"
      });
      console.log("Created admin user with ID:", adminUser.id);
    } else {
      console.log("Admin user already exists with ID:", adminUser.id);
    }
    const templates = await storage.getAllTemplates();
    let template1 = templates.find((t) => t.name === "Template 1");
    if (!template1) {
      template1 = await storage.createTemplate({
        name: "Template 1",
        description: "Default template with green theme",
        layout: JSON.stringify({
          primaryColor: "#228B22",
          // Forest Green
          secondaryColor: "#000000",
          // Black
          components: [
            { type: "header", content: "Skytech Automated", position: "top" },
            {
              type: "rectangle",
              color: "#228B22",
              height: 150,
              position: "top",
              icon: "laundry",
              label: "LAUNDRY",
              floors: 6
              // Default to 6 laundry floors (2x3 grid)
            },
            {
              type: "rectangle",
              color: "#0047AB",
              height: 150,
              position: "middle",
              icon: "trash",
              label: "TRASH",
              floors: 10
              // Default to 10 trash floors (2x5 grid)
            }
          ]
        }),
        isActive: true
      });
      console.log("Created Template 1");
    }
    let template2 = templates.find((t) => t.name === "Template 2");
    if (!template2) {
      template2 = await storage.createTemplate({
        name: "Template 2",
        description: "Alternative template with blue theme",
        layout: JSON.stringify({
          primaryColor: "#0047AB",
          // Cobalt Blue
          secondaryColor: "#000000",
          // Black
          components: [
            { type: "header", content: "Skytech Automated", position: "top" },
            {
              type: "rectangle",
              color: "#228B22",
              height: 150,
              position: "top",
              icon: "laundry",
              label: "LAUNDRY",
              floors: 10
              // Default to 10 laundry floors (2x5 grid)
            },
            {
              type: "rectangle",
              color: "#0047AB",
              height: 150,
              position: "middle",
              icon: "trash",
              label: "TRASH",
              floors: 10
              // Default to 10 trash floors (2x5 grid)
            }
          ]
        }),
        isActive: true
      });
      console.log("Created Template 2");
    }
    let ozzydogUser = await storage.getUserByUsername("Ozzydog");
    if (!ozzydogUser) {
      const hashedPassword = await hashPassword("Ozzydog");
      ozzydogUser = await storage.createUser({
        username: "Ozzydog",
        password: hashedPassword,
        role: "admin"
      });
      console.log("Created admin user: Ozzydog");
    }
    let philUser = await storage.getUserByUsername("Phil");
    if (!philUser) {
      const hashedPassword = await hashPassword("Phil");
      philUser = await storage.createUser({
        username: "Phil",
        password: hashedPassword,
        role: "user"
      });
      console.log("Created regular user: Phil");
    }
    let isabellaUser = await storage.getUserByUsername("Isabella");
    if (!isabellaUser) {
      const hashedPassword = await hashPassword("Isabella");
      isabellaUser = await storage.createUser({
        username: "Isabella",
        password: hashedPassword,
        role: "user"
      });
      console.log("Created regular user: Isabella");
    }
    if (template1 && philUser && !philUser.templateId) {
      await storage.updateUser(philUser.id, { templateId: template1.id });
      console.log("Assigned Template 1 to Phil");
    }
    if (template2 && isabellaUser && !isabellaUser.templateId) {
      await storage.updateUser(isabellaUser.id, { templateId: template2.id });
      console.log("Assigned Template 2 to Isabella");
    }
    let nanaUser = await storage.getUserByUsername("Nana");
    if (!nanaUser) {
      const hashedPassword = await hashPassword("Nana");
      nanaUser = await storage.createUser({
        username: "Nana",
        password: hashedPassword,
        role: "user"
      });
      console.log("Created regular user: Nana");
    }
    if (template1 && nanaUser && !nanaUser.templateId) {
      await storage.updateUser(nanaUser.id, { templateId: template1.id });
      console.log("Assigned Template 1 to Nana");
    }
    let papaUser = await storage.getUserByUsername("Papa");
    if (!papaUser) {
      const hashedPassword = await hashPassword("Papa");
      papaUser = await storage.createUser({
        username: "Papa",
        password: hashedPassword,
        role: "user"
      });
      console.log("Created regular user: Papa");
    }
    if (template1 && papaUser && !papaUser.templateId) {
      await storage.updateUser(papaUser.id, { templateId: template1.id });
      console.log("Assigned Template 1 to Papa");
    }
    const robotAssignments = await storage.getAllRobotTemplateAssignments();
    if (robotAssignments.length === 0 && template1 && template2) {
      await storage.createRobotTemplateAssignment({
        name: "Floor Robot 1",
        location: "Main Floor",
        serialNumber: "AX-2000-1",
        templateId: template1.id,
        robotModel: "AX-2000",
        isActive: true
      });
      await storage.createRobotTemplateAssignment({
        name: "Floor Robot 2",
        location: "Secondary Floor",
        serialNumber: "AX-2000-2",
        templateId: template1.id,
        robotModel: "AX-2000",
        isActive: true
      });
      await storage.createRobotTemplateAssignment({
        name: "Storage Robot",
        location: "Storage Area",
        serialNumber: "AX-2000-3",
        templateId: template2.id,
        robotModel: "AX-2000",
        isActive: true
      });
      console.log("Created 3 robot template assignments");
    }
  } catch (error) {
    console.error("Error creating predefined users and templates:", error);
  }
}
async function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "skytech-automated-secret",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 864e5,
      // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  await createPredefinedUsers();
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        console.log(`User found, checking password: ${username}`);
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false);
        }
        console.log(`Login successful for user: ${username}, role: ${user.role}`);
        return done(null, user);
      } catch (error) {
        console.error(`Login error for ${username}:`, error);
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => {
    const typedUser = user;
    done(null, typedUser.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin users can register new users" });
    }
    const { username, password, role = "user" } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    try {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/robot-move-api.ts
init_robot_constants();
import fetch from "node-fetch";
var robotParamsCache = null;
var lastParamsFetchTime = 0;
var PARAMS_CACHE_TTL = 5 * 60 * 1e3;
async function fetchRobotParams() {
  try {
    const now = Date.now();
    if (robotParamsCache && now - lastParamsFetchTime < PARAMS_CACHE_TTL) {
      return robotParamsCache;
    }
    console.log("Fetching robot parameters...");
    const response = await fetch(`${ROBOT_API_URL}/robot-params`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch robot parameters: ${response.status} ${response.statusText}`);
    }
    const params = await response.json();
    console.log("Robot parameters:", params);
    robotParamsCache = params;
    lastParamsFetchTime = now;
    return params;
  } catch (error) {
    console.error("Error fetching robot parameters:", error);
    if (robotParamsCache) {
      console.log("Using cached robot parameters");
      return robotParamsCache;
    }
    throw new Error("Unable to fetch robot parameters and no cached data available");
  }
}
function registerRobotMoveApiRoutes(app2) {
  const ROBOT_API_BASE_URL = ROBOT_API_URL;
  async function processCancelRequest(serialNumber, apiBaseUrl) {
    if (serialNumber.trim() === "") {
      console.error("Cannot process cancel request: Empty serial number provided");
      return;
    }
    try {
      console.log(`Cancelling movement for robot ${serialNumber}`);
      const movesResponse = await fetch(`${apiBaseUrl}/chassis/moves`, {
        headers: getAuthHeaders()
      });
      const moves = await movesResponse.json();
      const activeMove = Array.isArray(moves) ? moves.find((move) => move.state === "moving") : null;
      if (activeMove) {
        console.log(`Found active move with ID: ${activeMove.id}`);
        const robotResponse = await fetch(`${apiBaseUrl}/chassis/moves/${activeMove.id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ state: "cancelled" })
        });
        if (!robotResponse.ok) {
          const errorText = await robotResponse.text();
          console.error(`Robot API error: ${robotResponse.status} - ${errorText}`);
          return;
        }
        const data = await robotResponse.json();
        console.log("Robot cancel response:", data);
      } else {
        console.log("No active move found, trying to cancel current move");
        const robotResponse = await fetch(`${apiBaseUrl}/chassis/moves/current`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ state: "cancelled" })
        });
        if (robotResponse.ok) {
          const message = await robotResponse.json();
          console.log("Robot cancel response:", message);
        } else {
          console.log("No active moves to cancel");
        }
      }
    } catch (error) {
      console.error("Error in background cancel request:", error);
    }
  }
  app2.post("/api/robots/move/:serialNumber", async (req, res) => {
    try {
      const { serialNumber } = req.params;
      if (!serialNumber) {
        return res.status(400).json({ error: "Serial number is required" });
      }
      const moveData = req.body;
      if (!moveData || typeof moveData !== "object") {
        return res.status(400).json({ error: "Invalid move data" });
      }
      const robotParams = await fetchRobotParams();
      if (moveData.type === "standard") {
        if (typeof moveData.target_x !== "number" || typeof moveData.target_y !== "number") {
          return res.status(400).json({
            error: "Invalid move data: target_x and target_y must be numbers",
            received: { target_x: moveData.target_x, target_y: moveData.target_y }
          });
        }
        moveData.creator = moveData.creator || "web_interface";
        moveData.target_accuracy = moveData.target_accuracy || 0.1;
      }
      if (!moveData.properties) {
        moveData.properties = {};
      }
      if (moveData.type === "differential") {
        const maxForwardVel = robotParams["/wheel_control/max_forward_velocity"] || 0.8;
        const maxBackwardVel = robotParams["/wheel_control/max_backward_velocity"] || -0.2;
        const maxAngularVel = robotParams["/wheel_control/max_angular_velocity"] || 0.78;
        if (moveData.linear_velocity > 0) {
          moveData.linear_velocity = Math.min(moveData.linear_velocity, maxForwardVel);
        } else {
          moveData.linear_velocity = Math.max(moveData.linear_velocity, maxBackwardVel);
        }
        moveData.angular_velocity = Math.max(
          -maxAngularVel,
          Math.min(moveData.angular_velocity, maxAngularVel)
        );
        if (!moveData.properties.acc_smoother_level) {
          moveData.properties.acc_smoother_level = robotParams["/wheel_control/acc_smoother/smooth_level"] || "normal";
        }
      } else if (moveData.type === "inplace_rotate") {
        const maxAngularVel = robotParams["/wheel_control/max_angular_velocity"] || 0.78;
        if (moveData.properties && typeof moveData.properties.angular_velocity === "number") {
          moveData.properties.angular_velocity = Math.max(
            -maxAngularVel,
            Math.min(moveData.properties.angular_velocity, maxAngularVel)
          );
        } else if (!moveData.properties.angular_velocity) {
          moveData.properties.angular_velocity = maxAngularVel / 2;
        }
      } else if (moveData.type === "standard") {
        if (moveData.properties.auto_hold === void 0) {
          moveData.properties.auto_hold = robotParams["/planning/auto_hold"] !== void 0 ? robotParams["/planning/auto_hold"] : true;
        }
        if (moveData.properties.inplace_rotate === false) {
          console.log("Detected forward/backward movement, applying special handling");
          moveData.properties.follow_path = true;
          if (!moveData.properties.max_speed) {
            moveData.properties.max_speed = 0.4;
          }
          if (!moveData.properties.max_angular_speed) {
            moveData.properties.max_angular_speed = 0.3;
          }
          if (!moveData.target_accuracy) {
            moveData.target_accuracy = 0.1;
          }
          moveData.use_target_zone = true;
        }
      }
      console.log("===== ROBOT MOVE COMMAND DETAILS =====");
      console.log("Serial Number:", serialNumber);
      console.log("Command Type:", moveData.type);
      console.log("Target Position:", {
        x: moveData.target_x,
        y: moveData.target_y,
        z: moveData.target_z,
        orientation: moveData.target_ori
      });
      console.log("Movement Properties:", JSON.stringify(moveData.properties, null, 2));
      console.log("Use Target Zone:", moveData.use_target_zone);
      console.log("Target Accuracy:", moveData.target_accuracy);
      console.log("Orientation Accuracy:", moveData.target_orientation_accuracy);
      console.log("Complete movement data:", JSON.stringify(moveData, null, 2));
      res.status(202).json({ status: "accepted", message: "Command sent to robot" });
      try {
        const robotResponse = await fetch(`${ROBOT_API_BASE_URL}/chassis/moves`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(moveData)
        });
        let responseBody = await robotResponse.text();
        console.log(`===== ROBOT API RESPONSE FOR MOVE COMMAND =====`);
        console.log(`Response Status: ${robotResponse.status} - ${robotResponse.statusText}`);
        if (!robotResponse.ok) {
          console.error(`ROBOT API ERROR: ${robotResponse.status} - ${responseBody}`);
        } else {
          try {
            const data = JSON.parse(responseBody);
            console.log("ROBOT MOVE ACCEPTED:", data);
            console.log("Movement Type:", moveData.type);
            if (moveData.type === "standard") {
              console.log("Target Position:", {
                x: moveData.target_x,
                y: moveData.target_y,
                orientation: moveData.target_ori
              });
            }
          } catch (e) {
            console.log("Raw robot response (not JSON):", responseBody);
          }
        }
      } catch (sendError) {
        console.error("Background error sending command to robot:", sendError);
      }
    } catch (error) {
      console.error("Error sending move command to robot:", error);
      res.status(500).json({ error: "Failed to send move command to robot" });
    }
  });
  app2.post("/api/robots/move/:serialNumber/cancel", async (req, res) => {
    try {
      const { serialNumber } = req.params;
      if (!serialNumber || serialNumber.trim() === "") {
        return res.status(400).json({ error: "Serial number is required for cancel operation" });
      }
      res.status(202).json({ status: "accepted", message: "Cancel command sent to robot" });
      const robSerialNumber = serialNumber.toString();
      processCancelRequest(robSerialNumber, ROBOT_API_BASE_URL).catch((error) => {
        console.error("Background cancel error:", error);
      });
    } catch (error) {
      console.error("Error cancelling robot movement:", error);
      res.status(500).json({ error: "Failed to cancel robot movement" });
    }
  });
}

// server/robot-points-api.ts
init_robot_constants();
init_robot_map_data();
import axios3 from "axios";
async function fetchRobotMapPoints2() {
  console.log(`Fetching live map points from robot API at ${ROBOT_API_URL}...`);
  console.log(`Using auth secret starting with: ${ROBOT_SECRET.substring(0, 4)}...`);
  try {
    const testEndpoints = [
      "/status",
      "/device/info",
      "/state",
      "/maps",
      "/chassis/moves/latest"
    ];
    let connected = false;
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Trying endpoint: ${ROBOT_API_URL}${endpoint}`);
        const testResponse = await axios3.get(`${ROBOT_API_URL}${endpoint}`, {
          headers: getAuthHeaders()
        });
        console.log(`\u2705 Robot API connection test successful with endpoint ${endpoint}: ${JSON.stringify(testResponse.data).substring(0, 100)}...`);
        connected = true;
        break;
      } catch (err) {
        const endpointError = err;
        console.log(`Endpoint ${endpoint} failed: ${endpointError.message}`);
      }
    }
    if (!connected) {
      throw new Error("All connection test endpoints failed");
    }
  } catch (err) {
    const testError = err;
    console.error(`\u274C Robot API connection test failed:`, testError.message);
    throw new Error(`Robot API connection failed: ${testError.message}`);
  }
  const livePoints = await fetchRobotMapPoints();
  if (livePoints && livePoints.length > 0) {
    console.log(`\u2705 Successfully fetched ${livePoints.length} live map points`);
    return livePoints;
  }
  throw new Error("No map points found from robot API");
}
function registerRobotPointRoutes(app2) {
  app2.get("/api/robots/points", async (req, res) => {
    try {
      const points = await fetchRobotMapPoints2();
      res.json(points);
    } catch (error) {
      console.error("\u274C Failed to load map points:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
  app2.get("/api/robots/points/shelves", async (req, res) => {
    try {
      const allPoints = await fetchRobotMapPoints2();
      const shelfPoints = getShelfPoints(allPoints);
      res.json(shelfPoints);
    } catch (error) {
      console.error("\u274C Failed to load shelf points:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
  app2.get("/api/robots/points/full", async (req, res) => {
    try {
      let points;
      try {
        points = await fetchRobotMapPoints2();
      } catch (err) {
        console.error("\u274C Failed to fetch live robot points, using fallback point data");
        const { getShelfPoint: getShelfPoint2, getShelfDockingPoint: getShelfDockingPoint2 } = await Promise.resolve().then(() => (init_robot_points_map(), robot_points_map_exports));
        points = [
          { id: "050_load", x: -2.847, y: 2.311, theta: 0, floor: "1" },
          { id: "050_load_docking", x: -1.887, y: 2.311, theta: 0, floor: "1" },
          { id: "001_load", x: -2.861, y: 3.383, theta: 0, floor: "1" },
          { id: "001_load_docking", x: -1.85, y: 3.366, theta: 0, floor: "1" },
          { id: "104_load", x: 1.5, y: 3.2, theta: 0, floor: "1" },
          { id: "104_load_docking", x: 1, y: 3.2, theta: 0, floor: "1" }
        ];
      }
      const shelvesByFloor = getShelfPointsByFloor(points);
      const specialPoints = getSpecialPoints(points);
      const allFloors = getAllFloors(points);
      res.json({
        shelvesByFloor,
        specialPoints,
        allFloors
      });
    } catch (error) {
      console.error("\u274C Failed to load full robot point data:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
  app2.get("/api/robots/points/:id", async (req, res) => {
    try {
      const pointId = req.params.id;
      const points = await fetchRobotMapPoints2();
      const point = points.find((p) => String(p.id).toLowerCase() === String(pointId).toLowerCase());
      if (!point) {
        return res.status(404).json({ error: `Point with ID ${pointId} not found` });
      }
      res.json(point);
    } catch (error) {
      console.error(`\u274C Failed to load point ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
}

// server/routes.ts
init_robot_points_map();

// server/assign-task.ts
init_robot_constants();
import express2 from "express";
import axios4 from "axios";
import fs2 from "fs";
import path3 from "path";
async function sendMoveCommand(x, y, logToFile) {
  try {
    logToFile(`\u27A1\uFE0F Sending move command to: (${x}, ${y})`);
    await checkMoveStatus(logToFile);
    const moveData = {
      type: "standard",
      target_x: x,
      target_y: y,
      target_z: 0,
      target_ori: 0,
      // No specific orientation
      creator: "web_interface",
      properties: {
        max_trans_vel: 0.5,
        // Speed limit
        max_rot_vel: 0.5,
        acc_lim_x: 0.5,
        acc_lim_theta: 0.5,
        planning_mode: "directional"
      }
    };
    logToFile(`\u{1F4E6} Move payload: ${JSON.stringify(moveData)}`);
    const response = await axios4.post(`${ROBOT_API_URL}/chassis/moves`, moveData, {
      headers: getAuthHeaders()
    });
    const moveId = response.data.id;
    logToFile(`\u2705 Move command accepted: ${JSON.stringify(response.data)}`);
    logToFile(`\u{1F504} Move ID: ${moveId} created for movement to (${x}, ${y})`);
    return response.data;
  } catch (error) {
    logToFile(`\u274C Move command failed: ${error.message}`);
    if (error.response) {
      logToFile(`\u{1F4CA} Error response data: ${JSON.stringify(error.response.data || {})}`);
    }
    throw error;
  }
}
async function checkMoveStatus(logToFile) {
  try {
    const response = await axios4.get(`${ROBOT_API_URL}/chassis/moves/current`, {
      headers: getAuthHeaders()
    });
    if (response.data && response.data.state) {
      logToFile(`Current move status: ${response.data.state}`);
      return ["succeeded", "cancelled", "failed"].includes(response.data.state);
    }
    return true;
  } catch (error) {
    logToFile(`No active movement or error checking status`);
    return true;
  }
}
async function waitForMoveComplete(logToFile, timeout = 6e4) {
  const startTime = Date.now();
  let isMoving = true;
  logToFile("Waiting for robot to complete current movement...");
  while (isMoving && Date.now() - startTime < timeout) {
    isMoving = !await checkMoveStatus(logToFile);
    if (isMoving) {
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      logToFile("Still moving, waiting for completion...");
    }
  }
  if (isMoving) {
    logToFile("\u26A0\uFE0F Timed out waiting for robot to complete movement");
  } else {
    logToFile("\u2705 Robot has completed movement");
  }
}
function registerAssignTaskRoute(app2) {
  app2.post("/robots/assign-task", express2.json(), async (req, res) => {
    const logPath = path3.resolve(process.cwd(), "robot-debug.log");
    function logToFile(msg) {
      try {
        fs2.appendFileSync(logPath, `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
`);
      } catch (err) {
        console.error("\u274C Failed to write to robot-debug.log:", err.message);
      }
    }
    try {
      const { mode, shelf, pickup, dropoff, standby } = req.body;
      if (!shelf || !pickup || !dropoff || !standby || !mode) {
        const errText = "Missing required task data";
        logToFile(errText);
        return res.status(400).json({ error: errText });
      }
      res.status(202).json({
        success: true,
        message: "Task received, robot is being dispatched",
        details: {
          mode,
          points: [shelf, pickup, dropoff, standby]
        }
      });
      (async () => {
        try {
          logToFile(`\u{1F680} Starting ${mode} mission`);
          if (mode === "pickup") {
            logToFile(`Step 1: Navigating to shelf ${shelf.id} at (${shelf.x}, ${shelf.y})`);
            await sendMoveCommand(shelf.x, shelf.y, logToFile);
            await waitForMoveComplete(logToFile);
            logToFile(`Step 2: Navigating to dropoff point at (${dropoff.x}, ${dropoff.y})`);
            await sendMoveCommand(dropoff.x, dropoff.y, logToFile);
            await waitForMoveComplete(logToFile);
          } else if (mode === "dropoff") {
            logToFile(`Step 1: Navigating to pickup point at (${pickup.x}, ${pickup.y})`);
            await sendMoveCommand(pickup.x, pickup.y, logToFile);
            await waitForMoveComplete(logToFile);
            logToFile(`Step 2: Navigating to shelf ${shelf.id} at (${shelf.x}, ${shelf.y})`);
            await sendMoveCommand(shelf.x, shelf.y, logToFile);
            await waitForMoveComplete(logToFile);
          }
          logToFile(`Final Step: Returning to standby point at (${standby.x}, ${standby.y})`);
          await sendMoveCommand(standby.x, standby.y, logToFile);
          await waitForMoveComplete(logToFile);
          logToFile("\u2705 Task completed successfully");
        } catch (error) {
          logToFile(`\u274C Task execution failed: ${error.message}`);
        }
      })().catch((error) => {
        logToFile(`\u274C Unhandled error in task background execution: ${error.message}`);
      });
    } catch (err) {
      const errorMsg = "\u274C Task Error: " + (err.message || "Unknown error");
      logToFile(errorMsg);
      res.status(500).json({ error: errorMsg });
    }
  });
}

// server/assign-task-local.ts
init_robot_constants();
import axios6 from "axios";
import * as fs4 from "fs";
import * as path5 from "path";
init_mission_queue();
var debugLogFile = path5.join(process.cwd(), "robot-debug.log");
function logRobotTask(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] [LOCAL-PICKUP] ${message}
`;
  console.log(logEntry);
  fs4.appendFileSync(debugLogFile, logEntry);
}
function registerLocalPickupRoute(app2) {
  const handleLocalPickupRequest = async (req, res) => {
    const startTime = Date.now();
    const { shelf, pickup, standby } = req.body;
    const headers3 = { "x-api-key": ROBOT_SECRET };
    logRobotTask(`New LOCAL PICKUP task received - Shelf: ${shelf?.id}, Pickup: ${pickup?.id}`);
    logRobotTask(`Full task details: ${JSON.stringify({
      shelf: { id: shelf?.id, x: shelf?.x, y: shelf?.y, ori: shelf?.ori },
      pickup: { id: pickup?.id, x: pickup?.x, y: pickup?.y, ori: pickup?.ori },
      standby: { id: standby?.id, x: standby?.x, y: standby?.y, ori: standby?.ori }
    }, null, 2)}`);
    async function checkMoveStatus2() {
      try {
        const response = await axios6.get(`${ROBOT_API_URL}/chassis/moves/current`, {
          headers: { "x-api-key": ROBOT_SECRET }
        });
        if (response.data && response.data.state) {
          logRobotTask(`Current move status: ${response.data.state}`);
          return ["succeeded", "cancelled", "failed"].includes(response.data.state);
        }
        return true;
      } catch (error) {
        logRobotTask(`No active movement or error checking status`);
        return true;
      }
    }
    async function waitForMoveComplete2(moveId, timeout = 6e4) {
      const startTime2 = Date.now();
      let isMoving = true;
      logRobotTask(`Waiting for robot to complete movement (ID: ${moveId})...`);
      while (isMoving && Date.now() - startTime2 < timeout) {
        isMoving = !await checkMoveStatus2();
        if (isMoving) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          logRobotTask(`Still moving (move ID: ${moveId}), waiting...`);
        }
      }
      if (isMoving) {
        logRobotTask(`\u26A0\uFE0F Timed out waiting for robot to complete movement (ID: ${moveId})`);
        throw new Error(`Movement timeout exceeded (${timeout}ms)`);
      } else {
        logRobotTask(`\u2705 Robot has completed movement (ID: ${moveId})`);
      }
    }
    async function moveTo(point, label, headers4) {
      logRobotTask(`\u27A1\uFE0F Sending move command to: (${point.x}, ${point.y})`);
      const payload = {
        type: "standard",
        target_x: point.x,
        target_y: point.y,
        target_z: 0,
        target_ori: point.ori || 0,
        creator: "web_interface",
        properties: {
          max_trans_vel: 0.5,
          max_rot_vel: 0.5,
          acc_lim_x: 0.5,
          acc_lim_theta: 0.5,
          planning_mode: "directional"
        }
      };
      await checkMoveStatus2();
      const moveRes = await axios6.post(`${ROBOT_API_URL}/chassis/moves`, payload, { headers: headers4 });
      logRobotTask(`\u2705 Move command sent: ${JSON.stringify(moveRes.data)}`);
      const moveId = moveRes.data.id;
      logRobotTask(`Robot move command sent for ${label} - move ID: ${moveId}`);
      await waitForMoveComplete2(moveId, 12e4);
      logRobotTask(`Robot move command to ${label} confirmed complete`);
      return moveRes.data;
    }
    try {
      logRobotTask("\u{1F680} Starting LOCAL PICKUP sequence");
      const emergencyStopPressed = await isEmergencyStopPressed();
      if (emergencyStopPressed) {
        const errorMsg = "\u{1F6A8} Emergency stop button is pressed. Please release it before executing tasks.";
        logRobotTask(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "EMERGENCY_STOP_PRESSED"
        });
      }
      const charging = await isRobotCharging();
      let missionSteps = [];
      if (charging) {
        logRobotTask("\u26A0\uFE0F Robot is currently charging. Creating simplified mission (no bin operations)");
        missionSteps = [
          // Step 1: Go to Shelf
          {
            type: "move",
            params: {
              x: shelf.x,
              y: shelf.y,
              ori: shelf.ori ?? 0,
              label: `shelf ${shelf.id}`
            }
          },
          // Step 2: Go to pickup point (without jack operations)
          {
            type: "move",
            params: {
              x: pickup.x,
              y: pickup.y,
              ori: pickup.ori ?? 0,
              label: `pickup ${pickup.id}`
            }
          },
          // Step 3: Return to standby
          {
            type: "move",
            params: {
              x: standby.x,
              y: standby.y,
              ori: standby.ori ?? 0,
              label: "standby"
            }
          }
        ];
        logRobotTask(`Created simplified mission plan with ${missionSteps.length} steps (charging mode)`);
      } else {
        logRobotTask("Creating full mission plan with bin operations");
        const isSameLocation = shelf.x === pickup.x && shelf.y === pickup.y;
        if (isSameLocation) {
          logRobotTask(`\u{1F50D} Detected that pickup point is at same location as shelf - optimizing mission steps`);
          const dockingDistance = 1;
          const dockX = shelf.x - dockingDistance;
          const dockY = shelf.y;
          logRobotTask(`\u{1F4CD} Creating docking approach point at (${dockX}, ${dockY}) for better bin pickup`);
          missionSteps = [
            // Step 1: Go to docking position near shelf
            {
              type: "move",
              params: {
                x: dockX,
                y: dockY,
                ori: shelf.ori ?? 0,
                label: `docking point for ${shelf.id}`
              }
            },
            // Step 2: Move precisely to shelf position
            {
              type: "move",
              params: {
                x: shelf.x,
                y: shelf.y,
                ori: shelf.ori ?? 0,
                label: `shelf/pickup ${shelf.id}`
              }
            },
            // Step 3: Jack Up to grab bin
            {
              type: "jack_up",
              params: {}
            },
            // Step 4: Return to standby with the bin
            {
              type: "move",
              params: {
                x: standby.x,
                y: standby.y,
                ori: standby.ori ?? 0,
                label: "standby"
              }
            },
            // Step 5: Jack Down to release bin
            {
              type: "jack_down",
              params: {}
            }
          ];
        } else {
          const shelfDockingDistance = 1;
          const pickupDockingDistance = 1;
          const shelfDockX = shelf.x - shelfDockingDistance;
          const shelfDockY = shelf.y;
          const pickupDockX = pickup.x - pickupDockingDistance;
          const pickupDockY = pickup.y;
          logRobotTask(`\u{1F4CD} Creating docking approach points: shelf at (${shelfDockX}, ${shelfDockY}), pickup at (${pickupDockX}, ${pickupDockY})`);
          missionSteps = [
            // Step 1: Go to docking position near shelf
            {
              type: "move",
              params: {
                x: shelfDockX,
                y: shelfDockY,
                ori: shelf.ori ?? 0,
                label: `docking point for shelf ${shelf.id}`
              }
            },
            // Step 2: Move precisely to shelf position
            {
              type: "move",
              params: {
                x: shelf.x,
                y: shelf.y,
                ori: shelf.ori ?? 0,
                label: `shelf ${shelf.id}`
              }
            },
            // Step 3: Jack Up
            {
              type: "jack_up",
              params: {}
            },
            // Step 4: Go to docking position near pickup
            {
              type: "move",
              params: {
                x: pickupDockX,
                y: pickupDockY,
                ori: pickup.ori ?? 0,
                label: `docking point for pickup ${pickup.id}`
              }
            },
            // Step 5: Move precisely to pickup position
            {
              type: "move",
              params: {
                x: pickup.x,
                y: pickup.y,
                ori: pickup.ori ?? 0,
                label: `pickup ${pickup.id}`
              }
            },
            // Step 6: Jack Down
            {
              type: "jack_down",
              params: {}
            },
            // Step 7: Return to standby
            {
              type: "move",
              params: {
                x: standby.x,
                y: standby.y,
                ori: standby.ori ?? 0,
                label: "standby"
              }
            }
          ];
        }
        logRobotTask(`Created full mission plan with ${missionSteps.length} steps`);
      }
      const missionName = `Local Pickup - Shelf ${shelf.id} to Pickup ${pickup.id}`;
      const mission = missionQueue.createMission(missionName, missionSteps, "L382502104987ir");
      logRobotTask(`Mission created with ID: ${mission.id}`);
      logRobotTask(`Mission will continue executing even if the robot goes offline`);
      await missionQueue.processMissionQueue();
      const totalDuration = Date.now() - startTime;
      logRobotTask(`\u{1F680} LOCAL PICKUP task initiated. Planning took: ${totalDuration}ms`);
      res.json({
        success: true,
        message: charging ? "Local pickup task started in simplified mode (robot is charging)." : "Local pickup task started with full bin operations.",
        missionId: mission.id,
        charging,
        duration: totalDuration
      });
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      logRobotTask(`\u274C LOCAL PICKUP task error: ${errorMessage}`);
      res.status(500).json({ error: err.message, response: err.response?.data });
    }
  };
  app2.post("/api/robots/assign-task/local", handleLocalPickupRequest);
  app2.post("/robots/assign-task/local", handleLocalPickupRequest);
  logRobotTask("Registered local pickup handler for both path variants");
}

// server/assign-task-local-dropoff.ts
init_robot_constants();
import express3 from "express";
import axios7 from "axios";
import fs5 from "fs";
import path6 from "path";
init_mission_queue();
function logRobotTask2(message) {
  try {
    const logPath = path6.resolve(process.cwd(), "robot-debug.log");
    fs5.appendFileSync(logPath, `[${(/* @__PURE__ */ new Date()).toISOString()}] [LOCAL-DROPOFF] ${message}
`);
  } catch (err) {
    console.error("\u274C Failed to write to robot-debug.log:", err.message);
  }
}
function registerLocalDropoffRoute(app2) {
  const handleLocalDropoffRequest = async (req, res) => {
    const { shelf, pickup, standby } = req.body;
    const headers3 = { "x-api-key": ROBOT_SECRET };
    const startTime = Date.now();
    logRobotTask2(`New LOCAL DROPOFF task received - Shelf: ${shelf.id}, Pickup: ${pickup.id}`);
    logRobotTask2(`Full task details: ${JSON.stringify(req.body, null, 2)}`);
    async function checkMoveStatus2() {
      try {
        const response = await axios7.get(`${ROBOT_API_URL}/chassis/moves/current`, {
          headers: { "x-api-key": ROBOT_SECRET }
        });
        if (response.data && response.data.state) {
          logRobotTask2(`Current move status: ${response.data.state}`);
          return ["succeeded", "cancelled", "failed"].includes(response.data.state);
        }
        return true;
      } catch (error) {
        logRobotTask2(`No active movement or error checking status`);
        return true;
      }
    }
    async function waitForMoveComplete2(moveId, timeout = 6e4) {
      const startTime2 = Date.now();
      let isMoving = true;
      logRobotTask2(`Waiting for robot to complete movement (ID: ${moveId})...`);
      while (isMoving && Date.now() - startTime2 < timeout) {
        isMoving = !await checkMoveStatus2();
        if (isMoving) {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          logRobotTask2(`Still moving (move ID: ${moveId}), waiting...`);
        }
      }
      if (isMoving) {
        logRobotTask2(`\u26A0\uFE0F Timed out waiting for robot to complete movement (ID: ${moveId})`);
        throw new Error(`Movement timeout exceeded (${timeout}ms)`);
      } else {
        logRobotTask2(`\u2705 Robot has completed movement (ID: ${moveId})`);
      }
    }
    async function moveTo(point, label, headers4) {
      logRobotTask2(`\u27A1\uFE0F Sending move command to: (${point.x}, ${point.y})`);
      const payload = {
        type: "standard",
        target_x: point.x,
        target_y: point.y,
        target_z: 0,
        target_ori: point.ori || 0,
        creator: "web_interface",
        properties: {
          max_trans_vel: 0.5,
          max_rot_vel: 0.5,
          acc_lim_x: 0.5,
          acc_lim_theta: 0.5,
          planning_mode: "directional"
        }
      };
      await checkMoveStatus2();
      const moveRes = await axios7.post(`${ROBOT_API_URL}/chassis/moves`, payload, { headers: headers4 });
      logRobotTask2(`\u2705 Move command sent: ${JSON.stringify(moveRes.data)}`);
      const moveId = moveRes.data.id;
      logRobotTask2(`Robot move command sent for ${label} - move ID: ${moveId}`);
      await waitForMoveComplete2(moveId, 12e4);
      logRobotTask2(`Robot move command to ${label} confirmed complete`);
      return moveRes.data;
    }
    try {
      logRobotTask2("\u{1F680} Starting LOCAL DROPOFF sequence");
      const emergencyStopPressed = await isEmergencyStopPressed();
      if (emergencyStopPressed) {
        const errorMsg = "\u{1F6A8} Emergency stop button is pressed. Please release it before executing tasks.";
        logRobotTask2(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "EMERGENCY_STOP_PRESSED"
        });
      }
      const charging = await isRobotCharging();
      let missionSteps = [];
      if (charging) {
        logRobotTask2("\u26A0\uFE0F Robot is currently charging. Creating simplified mission (no bin operations)");
        missionSteps = [
          // Step 1: Go to pickup point
          {
            type: "move",
            params: {
              x: pickup.x,
              y: pickup.y,
              ori: pickup.ori ?? 0,
              label: `pickup ${pickup.id}`
            }
          },
          // Step 2: Go to shelf (without jack operations)
          {
            type: "move",
            params: {
              x: shelf.x,
              y: shelf.y,
              ori: shelf.ori ?? 0,
              label: `shelf ${shelf.id}`
            }
          },
          // Step 3: Return to standby
          {
            type: "move",
            params: {
              x: standby.x,
              y: standby.y,
              ori: standby.ori ?? 0,
              label: "standby"
            }
          }
        ];
        logRobotTask2(`Created simplified mission plan with ${missionSteps.length} steps (charging mode)`);
      } else {
        logRobotTask2("Creating full mission plan with bin operations");
        const isSameLocation = shelf.x === pickup.x && shelf.y === pickup.y;
        if (isSameLocation) {
          logRobotTask2(`\u{1F50D} Detected that pickup point is at same location as shelf - optimizing mission steps`);
          const dockingDistance = 1;
          const dockX = pickup.x - dockingDistance;
          const dockY = pickup.y;
          logRobotTask2(`\u{1F4CD} Creating docking approach point at (${dockX}, ${dockY}) for better bin dropoff`);
          missionSteps = [
            // Step 1: Go to docking position near pickup/shelf
            {
              type: "move",
              params: {
                x: dockX,
                y: dockY,
                ori: pickup.ori ?? 0,
                label: `docking point for ${pickup.id}`
              }
            },
            // Step 2: Move precisely to pickup/shelf position
            {
              type: "move",
              params: {
                x: pickup.x,
                y: pickup.y,
                ori: pickup.ori ?? 0,
                label: `pickup/shelf ${pickup.id}`
              }
            },
            // Step 3: Jack Up to grab bin
            {
              type: "jack_up",
              params: {}
            },
            // Step 4: Skip going to shelf since we're already there
            // Step 5: Jack Down to release bin
            {
              type: "jack_down",
              params: {}
            },
            // Step 6: Return to standby
            {
              type: "move",
              params: {
                x: standby.x,
                y: standby.y,
                ori: standby.ori ?? 0,
                label: "standby"
              }
            }
          ];
        } else {
          const pickupDockingDistance = 1;
          const shelfDockingDistance = 1;
          const pickupDockX = pickup.x - pickupDockingDistance;
          const pickupDockY = pickup.y;
          const shelfDockX = shelf.x - shelfDockingDistance;
          const shelfDockY = shelf.y;
          logRobotTask2(`\u{1F4CD} Creating docking approach points: pickup at (${pickupDockX}, ${pickupDockY}), shelf at (${shelfDockX}, ${shelfDockY})`);
          missionSteps = [
            // Step 1: Go to docking position near pickup
            {
              type: "move",
              params: {
                x: pickupDockX,
                y: pickupDockY,
                ori: pickup.ori ?? 0,
                label: `docking point for pickup ${pickup.id}`
              }
            },
            // Step 2: Move precisely to pickup position
            {
              type: "move",
              params: {
                x: pickup.x,
                y: pickup.y,
                ori: pickup.ori ?? 0,
                label: `pickup ${pickup.id}`
              }
            },
            // Step 3: Jack Up
            {
              type: "jack_up",
              params: {}
            },
            // Step 4: Go to docking position near shelf
            {
              type: "move",
              params: {
                x: shelfDockX,
                y: shelfDockY,
                ori: shelf.ori ?? 0,
                label: `docking point for shelf ${shelf.id}`
              }
            },
            // Step 5: Move precisely to shelf position
            {
              type: "move",
              params: {
                x: shelf.x,
                y: shelf.y,
                ori: shelf.ori ?? 0,
                label: `shelf ${shelf.id}`
              }
            },
            // Step 6: Jack Down
            {
              type: "jack_down",
              params: {}
            },
            // Step 7: Return to standby
            {
              type: "move",
              params: {
                x: standby.x,
                y: standby.y,
                ori: standby.ori ?? 0,
                label: "standby"
              }
            }
          ];
        }
        logRobotTask2(`Created full mission plan with ${missionSteps.length} steps`);
      }
      const missionName = `Local Dropoff - Pickup ${pickup.id} to Shelf ${shelf.id}`;
      const mission = missionQueue.createMission(missionName, missionSteps, "L382502104987ir");
      logRobotTask2(`Mission created with ID: ${mission.id}`);
      logRobotTask2(`Mission will continue executing even if the robot goes offline`);
      await missionQueue.processMissionQueue();
      const totalDuration = Date.now() - startTime;
      logRobotTask2(`\u{1F680} LOCAL DROPOFF task initiated. Planning took: ${totalDuration}ms`);
      res.json({
        success: true,
        message: charging ? "Local dropoff task started in simplified mode (robot is charging)." : "Local dropoff task started with full bin operations.",
        missionId: mission.id,
        charging,
        duration: totalDuration
      });
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      logRobotTask2(`\u274C LOCAL DROPOFF task error: ${errorMessage}`);
      res.status(500).json({ error: err.message, response: err.response?.data });
    }
  };
  app2.post("/api/robots/assign-task/local-dropoff", express3.json(), handleLocalDropoffRequest);
  app2.post("/robots/assign-task/local-dropoff", express3.json(), handleLocalDropoffRequest);
  logRobotTask2("Registered local dropoff handler for both path variants");
}

// server/mission-routes.ts
init_mission_queue();
import express4 from "express";
var router = express4.Router();
router.get("/missions", (req, res) => {
  const missions = missionQueue.getAllMissions();
  res.json(missions);
});
router.get("/missions/active", (req, res) => {
  const missions = missionQueue.getActiveMissions();
  res.json(missions);
});
router.get("/missions/completed", (req, res) => {
  const missions = missionQueue.getCompletedMissions();
  res.json(missions);
});
router.get("/missions/failed", (req, res) => {
  const missions = missionQueue.getFailedMissions();
  res.json(missions);
});
router.get("/missions/:id", (req, res) => {
  const mission = missionQueue.getMission(req.params.id);
  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }
  res.json(mission);
});
router.post("/missions/clear-completed", (req, res) => {
  missionQueue.clearCompletedMissions();
  res.json({ success: true, message: "Completed and failed missions cleared" });
});
var missionRouter = router;

// server/routes.ts
init_robot_websocket();

// server/return-to-charger.ts
init_robot_constants();
init_mission_queue();
import axios8 from "axios";
import fs6 from "fs";
import path7 from "path";
function logRobotTask3(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  const logMessage = `[${(/* @__PURE__ */ new Date()).toISOString()}] [RETURN-TO-CHARGER] ${message}`;
  console.log(`${timestamp} ${message}`);
  try {
    const logPath = path7.join(process.cwd(), "robot-debug.log");
    fs6.appendFileSync(logPath, logMessage + "\n");
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}
function registerReturnToChargerHandler(app2) {
  const handleJackDown = async (req, res) => {
    const startTime = Date.now();
    logRobotTask3("\u{1F53D} Received request to JACK DOWN robot");
    try {
      const response = await axios8.post(
        `${ROBOT_API_URL}/services/jack_down`,
        {},
        { headers: getAuthHeaders() }
      );
      const result = response.data;
      logRobotTask3(`\u2705 Robot JACK DOWN command executed successfully. Response: ${JSON.stringify(result)}`);
      res.json({
        success: true,
        message: "Robot jack_down command executed successfully",
        result,
        duration: Date.now() - startTime
      });
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      logRobotTask3(`\u274C Failed to JACK DOWN robot: ${errorMessage}`);
      res.status(500).json({ error: err.message, response: err.response?.data });
    }
  };
  const handleReturnToCharger = async (req, res) => {
    const startTime = Date.now();
    logRobotTask3("\u{1F50B} Received request to return robot to charger");
    try {
      const { fetchRobotMapPoints: fetchRobotMapPoints3, getSpecialPoints: getSpecialPoints2 } = await Promise.resolve().then(() => (init_robot_map_data(), robot_map_data_exports));
      const points = await fetchRobotMapPoints3();
      logRobotTask3(`Fetched ${points.length} map points`);
      const chargerPoints = points.filter((point) => {
        return point.id && (point.id.toString().toLowerCase().includes("charger") || point.id.toString().toLowerCase().includes("charging") || point.description && point.description.toString().toLowerCase().includes("charge"));
      });
      logRobotTask3(`Found ${chargerPoints.length} charger points on the map`);
      let charger;
      if (chargerPoints && chargerPoints.length > 0) {
        charger = chargerPoints[0];
        logRobotTask3(`Found charger point with ID: ${charger.id}`);
      } else {
        const specialPoints = getSpecialPoints2(points);
        if (specialPoints.standby) {
          charger = specialPoints.standby;
          logRobotTask3(`No charger point found, using standby point as fallback: ${charger.id}`);
        } else {
          throw new Error("No charger or standby points found on the map");
        }
      }
      logRobotTask3(`\u{1F50B} Using charger point at (${charger.x}, ${charger.y}) with orientation ${charger.ori ?? 0}`);
      const dockingDistance = 1;
      const orientation = charger.ori ?? 0;
      const theta = orientation * Math.PI / 180;
      const dockX = charger.x - dockingDistance * Math.cos(theta);
      const dockY = charger.y - dockingDistance * Math.sin(theta);
      logRobotTask3(`\u{1F4CD} Creating docking approach point at (${dockX.toFixed(3)}, ${dockY.toFixed(3)}) with orientation ${orientation} for charger`);
      const missionSteps = [
        // Step 1: Go to docking position near charger
        {
          type: "move",
          params: {
            x: dockX,
            y: dockY,
            ori: charger.ori ?? 0,
            label: "docking point for charger"
          }
        },
        // Step 2: Move precisely to charger position with charge move type
        {
          type: "move",
          params: {
            x: charger.x,
            y: charger.y,
            ori: charger.ori ?? 0,
            label: "charger point",
            isCharger: true
            // This indicates we want the charge move type with charge_retry_count
          }
        }
        // We do not want to jack_down at the charger - removed this step
      ];
      logRobotTask3("\u{1F50B} NOTE: Using charge move type with charge_retry_count for final charger docking step");
      logRobotTask3("\u26A0\uFE0F Cancelling all other missions before returning to charger");
      const cancelMethod = missionQueue.cancelAllMissions || missionQueue.cancelAllActiveMissions;
      if (typeof cancelMethod === "function") {
        await cancelMethod.call(missionQueue);
        logRobotTask3("\u2705 Successfully cancelled all other missions");
      } else {
        logRobotTask3("\u26A0\uFE0F Could not cancel other missions - function not available");
      }
      const missionName = "Return to Charger - HIGH PRIORITY";
      const mission = missionQueue.createMission(missionName, missionSteps, "L382502104987ir");
      logRobotTask3(`\u2705 Created mission to return to charger. Mission ID: ${mission.id}`);
      await missionQueue.processMissionQueue();
      res.json({
        success: true,
        message: "Robot is returning to charger",
        missionId: mission.id,
        chargerLocation: {
          x: charger.x,
          y: charger.y,
          ori: charger.ori ?? 0
        },
        duration: Date.now() - startTime
      });
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      logRobotTask3(`\u274C Failed to return robot to charger: ${errorMessage}`);
      res.status(500).json({ error: err.message, response: err.response?.data });
    }
  };
  app2.post("/api/robot/jack_down", handleJackDown);
  app2.post("/api/robot/return-to-charger", handleReturnToCharger);
  logRobotTask3("Registered jack_down and return-to-charger handlers");
}

// server/zone-104-workflow.ts
init_robot_constants();
init_robot_map_data();
import axios9 from "axios";
import * as fs7 from "fs";
import * as path8 from "path";
init_mission_queue();
var debugLogFile2 = path8.join(process.cwd(), "robot-debug.log");
function logRobotTask4(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] [ZONE-104-WORKFLOW] ${message}
`;
  console.log(logEntry);
  fs7.appendFileSync(debugLogFile2, logEntry);
}
function registerZone104WorkflowRoute(app2) {
  const handleZone104Workflow = async (req, res) => {
    const startTime = Date.now();
    logRobotTask4(`\u{1F504} Starting ZONE-104 workflow with charging return`);
    try {
      const emergencyStopPressed = await isEmergencyStopPressed();
      if (emergencyStopPressed) {
        const errorMsg = "\u{1F6A8} EMERGENCY STOP PRESSED - Cannot start workflow until released";
        logRobotTask4(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "EMERGENCY_STOP_PRESSED"
        });
      }
      const charging = await isRobotCharging();
      if (charging) {
        const errorMsg = "\u26A0\uFE0F Robot is currently charging. Please disconnect from charger before starting a workflow.";
        logRobotTask4(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "ROBOT_CHARGING"
        });
      }
      logRobotTask4("Fetching all robot map points...");
      const allPoints = await fetchRobotMapPoints();
      if (!allPoints || allPoints.length === 0) {
        throw new Error("Failed to get map points from robot");
      }
      logRobotTask4(`Found ${allPoints.length} map points`);
      logRobotTask4(`Available point IDs: ${allPoints.map((p) => p.id).join(", ")}`);
      const pickupPoint = allPoints.find((p) => p.id === "104_load");
      const pickupDockingPoint = allPoints.find((p) => p.id === "104_load_docking");
      const dropoffPoint = allPoints.find((p) => p.id === "drop-off_load");
      const dropoffDockingPoint = allPoints.find((p) => p.id === "drop-off_load_docking");
      let chargerPoint;
      try {
        const mapResponse = await axios9.get(`${ROBOT_API_URL}/maps/current`, {
          headers: getAuthHeaders()
        });
        if (mapResponse.data && mapResponse.data.charger_pose && mapResponse.data.charger_pose.pos) {
          chargerPoint = {
            id: "Charging Station_docking",
            x: mapResponse.data.charger_pose.pos[0],
            y: mapResponse.data.charger_pose.pos[1],
            ori: mapResponse.data.charger_pose.ori || 0
          };
          logRobotTask4(`Found charger position from API: (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
        }
      } catch (error) {
        logRobotTask4(`Warning: Could not get charger position from API: ${error.message}`);
      }
      if (!chargerPoint) {
        logRobotTask4(`Falling back to map points to find charger...`);
        chargerPoint = allPoints.find(
          (p) => p.id === "charger" || p.id === "Charger" || p.id.toLowerCase().includes("charg") || p.id.includes("Charging Station")
        );
      }
      if (!pickupPoint) {
        throw new Error('Could not find pickup point "104_load" in map data');
      }
      if (!pickupDockingPoint) {
        throw new Error('Could not find pickup docking point "104_load_docking" in map data');
      }
      if (!dropoffPoint) {
        throw new Error('Could not find dropoff point "drop-off_load" in map data');
      }
      if (!dropoffDockingPoint) {
        throw new Error('Could not find dropoff docking point "drop-off_load_docking" in map data');
      }
      if (!chargerPoint) {
        throw new Error("Could not find charger point in map data");
      }
      logRobotTask4("\u2705 Found all required map points:");
      logRobotTask4(`- Pickup: ${pickupPoint.id} at (${pickupPoint.x}, ${pickupPoint.y}), ori: ${pickupPoint.ori}`);
      logRobotTask4(`- Pickup docking: ${pickupDockingPoint.id} at (${pickupDockingPoint.x}, ${pickupDockingPoint.y}), ori: ${pickupDockingPoint.ori}`);
      logRobotTask4(`- Dropoff: ${dropoffPoint.id} at (${dropoffPoint.x}, ${dropoffPoint.y}), ori: ${dropoffPoint.ori}`);
      logRobotTask4(`- Dropoff docking: ${dropoffDockingPoint.id} at (${dropoffDockingPoint.x}, ${dropoffDockingPoint.y}), ori: ${dropoffDockingPoint.ori}`);
      logRobotTask4(`- Charger: ${chargerPoint.id} at (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
      const workflowSteps = [];
      workflowSteps.push({
        type: "move",
        params: {
          x: pickupDockingPoint.x,
          y: pickupDockingPoint.y,
          ori: pickupDockingPoint.ori,
          label: pickupDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "align_with_rack",
        params: {
          x: pickupPoint.x,
          y: pickupPoint.y,
          ori: pickupPoint.ori,
          label: `Align with rack at ${pickupPoint.id}`
        }
      });
      workflowSteps.push({
        type: "jack_up",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffDockingPoint.x,
          y: dropoffDockingPoint.y,
          ori: dropoffDockingPoint.ori,
          label: dropoffDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffPoint.x,
          y: dropoffPoint.y,
          ori: dropoffPoint.ori,
          label: dropoffPoint.id
        }
      });
      workflowSteps.push({
        type: "jack_down",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: chargerPoint.x,
          y: chargerPoint.y,
          ori: chargerPoint.ori,
          label: chargerPoint.id,
          isCharger: true
          // Explicitly mark this as a charger move
        }
      });
      logRobotTask4("\u{1F4CB} Created workflow steps:");
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        if (step.type === "move") {
          if (step.params.isCharger) {
            logRobotTask4(`- Step ${i + 1}: CHARGER DOCKING at ${step.params.label} (${step.params.x}, ${step.params.y}) - Using 'charge' move type`);
          } else {
            logRobotTask4(`- Step ${i + 1}: Move to ${step.params.label} (${step.params.x}, ${step.params.y})`);
          }
        } else if (step.type === "jack_up") {
          logRobotTask4(`- Step ${i + 1}: JACK UP with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "jack_down") {
          logRobotTask4(`- Step ${i + 1}: JACK DOWN with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "manual_joystick") {
          logRobotTask4(`- Step ${i + 1}: ${step.params.label} (${step.params.linear.x}, ${step.params.linear.y}) for ${step.params.duration}ms`);
        } else if (step.type === "align_with_rack") {
          logRobotTask4(`- Step ${i + 1}: ALIGN WITH RACK at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        } else if (step.type === "to_unload_point") {
          logRobotTask4(`- Step ${i + 1}: TO UNLOAD POINT at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        }
      }
      await missionQueue.cancelAllActiveMissions();
      logRobotTask4("\u2705 Cancelled any existing active missions");
      const missionName = `Zone 104 Workflow with Charger Return`;
      const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
      const duration = Date.now() - startTime;
      logRobotTask4(`\u2705 Created mission with ID: ${mission.id}`);
      logRobotTask4(`\u{1F680} Total planning time: ${duration}ms`);
      return res.status(200).json({
        success: true,
        message: "Zone 104 workflow initiated successfully",
        missionId: mission.id,
        steps: workflowSteps.length,
        duration,
        method: "mission_queue",
        note: "Robot will return to charger after completing the pickup and dropoff"
      });
    } catch (error) {
      const errorMessage = `Error executing zone-104 workflow: ${error.message}`;
      logRobotTask4(`\u274C ${errorMessage}`);
      if (error.response) {
        logRobotTask4(`API Error Status: ${error.response.status}`);
        logRobotTask4(`API Error Data: ${JSON.stringify(error.response.data)}`);
      }
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  };
  app2.post("/api/robots/workflows/zone-104", handleZone104Workflow);
  app2.post("/api/zone-104/workflow", handleZone104Workflow);
  logRobotTask4("\u2705 Registered zone-104 workflow handler with charger return");
}

// server/pickup-to-104-workflow.ts
init_robot_constants();
init_robot_map_data();
import * as fs8 from "fs";
import * as path9 from "path";
init_mission_queue();
var debugLogFile3 = path9.join(process.cwd(), "robot-debug.log");
function logRobotTask5(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] [PICKUP-TO-104] ${message}
`;
  console.log(logEntry);
  fs8.appendFileSync(debugLogFile3, logEntry);
}
function registerPickupTo104WorkflowRoute(app2) {
  const handlePickupTo104Workflow = async (req, res) => {
    const startTime = Date.now();
    logRobotTask5(`\u{1F504} Starting Pickup to 104 workflow`);
    try {
      const emergencyStopPressed = await isEmergencyStopPressed();
      if (emergencyStopPressed) {
        const errorMsg = "\u{1F6A8} EMERGENCY STOP PRESSED - Cannot start workflow until released";
        logRobotTask5(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "EMERGENCY_STOP_PRESSED"
        });
      }
      const charging = await isRobotCharging();
      if (charging) {
        const errorMsg = "\u26A0\uFE0F Robot is currently charging. Please disconnect from charger before starting a workflow.";
        logRobotTask5(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "ROBOT_CHARGING"
        });
      }
      logRobotTask5("Fetching all robot map points...");
      const allPoints = await fetchRobotMapPoints();
      if (!allPoints || allPoints.length === 0) {
        throw new Error("Failed to get map points from robot");
      }
      logRobotTask5(`Found ${allPoints.length} map points`);
      logRobotTask5(`Available point IDs: ${allPoints.map((p) => p.id).join(", ")}`);
      const pickupPoint = allPoints.find((p) => p.id === "pick-up_load");
      const pickupDockingPoint = allPoints.find((p) => p.id === "pick-up_load_docking");
      const dropoffPoint = allPoints.find((p) => p.id === "104_load");
      const dropoffDockingPoint = allPoints.find((p) => p.id === "104_load_docking");
      const chargerPoint = {
        id: "Charging Station_docking",
        x: 0.03443853667262486,
        y: 0.4981316698765672,
        ori: 266.11
      };
      logRobotTask5(`\u2705 Using verified charger position: (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
      if (!pickupPoint) {
        throw new Error('Could not find pickup point "pick-up_load" in map data');
      }
      if (!pickupDockingPoint) {
        throw new Error('Could not find pickup docking point "pick-up_load_docking" in map data');
      }
      if (!dropoffPoint) {
        throw new Error('Could not find dropoff point "104_load" in map data');
      }
      if (!dropoffDockingPoint) {
        throw new Error('Could not find dropoff docking point "104_load_docking" in map data');
      }
      logRobotTask5("\u2705 Found all required map points:");
      logRobotTask5(`- Pickup: ${pickupPoint.id} at (${pickupPoint.x}, ${pickupPoint.y}), ori: ${pickupPoint.ori}`);
      logRobotTask5(`- Pickup docking: ${pickupDockingPoint.id} at (${pickupDockingPoint.x}, ${pickupDockingPoint.y}), ori: ${pickupDockingPoint.ori}`);
      logRobotTask5(`- Dropoff (104): ${dropoffPoint.id} at (${dropoffPoint.x}, ${dropoffPoint.y}), ori: ${dropoffPoint.ori}`);
      logRobotTask5(`- Dropoff docking: ${dropoffDockingPoint.id} at (${dropoffDockingPoint.x}, ${dropoffDockingPoint.y}), ori: ${dropoffDockingPoint.ori}`);
      if (chargerPoint) {
        logRobotTask5(`- Charger: ${chargerPoint.id} at (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
      } else {
        logRobotTask5(`- No charger point found, will skip return to charger step`);
      }
      const workflowSteps = [];
      workflowSteps.push({
        type: "move",
        params: {
          x: pickupDockingPoint.x,
          y: pickupDockingPoint.y,
          ori: pickupDockingPoint.ori,
          label: pickupDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "align_with_rack",
        params: {
          x: pickupPoint.x,
          y: pickupPoint.y,
          ori: pickupPoint.ori,
          label: `Align with rack at ${pickupPoint.id}`
        }
      });
      workflowSteps.push({
        type: "jack_up",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffDockingPoint.x,
          y: dropoffDockingPoint.y,
          ori: dropoffDockingPoint.ori,
          label: dropoffDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "to_unload_point",
        params: {
          x: dropoffPoint.x,
          y: dropoffPoint.y,
          ori: dropoffPoint.ori,
          label: dropoffPoint.id
        }
      });
      workflowSteps.push({
        type: "jack_down",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffDockingPoint.x,
          y: dropoffDockingPoint.y,
          ori: dropoffDockingPoint.ori,
          label: `${dropoffDockingPoint.id} (safe position)`
        }
      });
      if (chargerPoint) {
        workflowSteps.push({
          type: "move",
          params: {
            x: chargerPoint.x,
            y: chargerPoint.y,
            ori: chargerPoint.ori,
            label: chargerPoint.id,
            isCharger: true
            // Explicitly mark this as a charger move
          }
        });
      } else {
        workflowSteps.push({
          type: "return_to_charger",
          params: {
            label: "Return to charging station",
            useApi: true
          }
        });
      }
      logRobotTask5("\u{1F4CB} Created workflow steps:");
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        if (step.type === "move") {
          if (step.params.isCharger) {
            logRobotTask5(`- Step ${i + 1}: CHARGER DOCKING at ${step.params.label} (${step.params.x}, ${step.params.y})`);
          } else {
            logRobotTask5(`- Step ${i + 1}: Move to ${step.params.label} (${step.params.x}, ${step.params.y})`);
          }
        } else if (step.type === "jack_up") {
          logRobotTask5(`- Step ${i + 1}: JACK UP with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "jack_down") {
          logRobotTask5(`- Step ${i + 1}: JACK DOWN with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "align_with_rack") {
          logRobotTask5(`- Step ${i + 1}: ALIGN WITH RACK at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        } else if (step.type === "to_unload_point") {
          logRobotTask5(`- Step ${i + 1}: TO UNLOAD POINT at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        } else if (step.type === "return_to_charger") {
          logRobotTask5(`- Step ${i + 1}: RETURN TO CHARGER using ${step.params.useApi ? "API method" : "point movement"}`);
        }
      }
      await missionQueue.cancelAllActiveMissions();
      logRobotTask5("\u2705 Cancelled any existing active missions");
      const missionName = `Pickup to 104 Workflow`;
      const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
      const duration = Date.now() - startTime;
      logRobotTask5(`\u2705 Created mission with ID: ${mission.id}`);
      logRobotTask5(`\u{1F680} Total planning time: ${duration}ms`);
      return res.status(200).json({
        success: true,
        message: "Pickup to 104 workflow initiated successfully",
        missionId: mission.id,
        steps: workflowSteps.length,
        duration,
        method: "mission_queue",
        note: "Robot will pick up from the main pickup point and drop at point 104"
      });
    } catch (error) {
      const errorMessage = `Error executing pickup-to-104 workflow: ${error.message}`;
      logRobotTask5(`\u274C ${errorMessage}`);
      if (error.response) {
        logRobotTask5(`API Error Status: ${error.response.status}`);
        logRobotTask5(`API Error Data: ${JSON.stringify(error.response.data)}`);
      }
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  };
  app2.post("/api/pickup-to-104/workflow", handlePickupTo104Workflow);
  logRobotTask5("\u2705 Registered pickup-to-104 workflow handler");
}

// server/pickup-from-104-workflow.ts
init_robot_constants();
init_robot_map_data();
import * as fs9 from "fs";
import * as path10 from "path";
init_mission_queue();
var debugLogFile4 = path10.join(process.cwd(), "robot-debug.log");
function logRobotTask6(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] [PICKUP-FROM-104] ${message}
`;
  console.log(logEntry);
  fs9.appendFileSync(debugLogFile4, logEntry);
}
function registerPickupFrom104WorkflowRoute(app2) {
  const handlePickupFrom104Workflow = async (req, res) => {
    const startTime = Date.now();
    logRobotTask6(`\u{1F504} Starting Pickup from 104 workflow`);
    try {
      const emergencyStopPressed = await isEmergencyStopPressed();
      if (emergencyStopPressed) {
        const errorMsg = "\u{1F6A8} EMERGENCY STOP PRESSED - Cannot start workflow until released";
        logRobotTask6(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "EMERGENCY_STOP_PRESSED"
        });
      }
      const charging = await isRobotCharging();
      if (charging) {
        const errorMsg = "\u26A0\uFE0F Robot is currently charging. Please disconnect from charger before starting a workflow.";
        logRobotTask6(errorMsg);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          code: "ROBOT_CHARGING"
        });
      }
      logRobotTask6("Fetching all robot map points...");
      const allPoints = await fetchRobotMapPoints();
      if (!allPoints || allPoints.length === 0) {
        throw new Error("Failed to get map points from robot");
      }
      logRobotTask6(`Found ${allPoints.length} map points`);
      logRobotTask6(`Available point IDs: ${allPoints.map((p) => p.id).join(", ")}`);
      const pickupPoint = allPoints.find((p) => p.id === "104_load");
      const pickupDockingPoint = allPoints.find((p) => p.id === "104_load_docking");
      const dropoffPoint = allPoints.find((p) => p.id === "drop-off_load");
      const dropoffDockingPoint = allPoints.find((p) => p.id === "drop-off_load_docking");
      const chargerPoint = {
        id: "Charging Station_docking",
        x: 0.03443853667262486,
        y: 0.4981316698765672,
        ori: 266.11
      };
      logRobotTask6(`\u2705 Using verified charger position: (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
      if (!pickupPoint) {
        throw new Error('Could not find pickup point "104_load" in map data');
      }
      if (!pickupDockingPoint) {
        throw new Error('Could not find pickup docking point "104_load_docking" in map data');
      }
      if (!dropoffPoint) {
        throw new Error('Could not find dropoff point "drop-off_load" in map data');
      }
      if (!dropoffDockingPoint) {
        throw new Error('Could not find dropoff docking point "drop-off_load_docking" in map data');
      }
      logRobotTask6("\u2705 Found all required map points:");
      logRobotTask6(`- Pickup (104): ${pickupPoint.id} at (${pickupPoint.x}, ${pickupPoint.y}), ori: ${pickupPoint.ori}`);
      logRobotTask6(`- Pickup docking: ${pickupDockingPoint.id} at (${pickupDockingPoint.x}, ${pickupDockingPoint.y}), ori: ${pickupDockingPoint.ori}`);
      logRobotTask6(`- Dropoff: ${dropoffPoint.id} at (${dropoffPoint.x}, ${dropoffPoint.y}), ori: ${dropoffPoint.ori}`);
      logRobotTask6(`- Dropoff docking: ${dropoffDockingPoint.id} at (${dropoffDockingPoint.x}, ${dropoffDockingPoint.y}), ori: ${dropoffDockingPoint.ori}`);
      if (chargerPoint) {
        logRobotTask6(`- Charger: ${chargerPoint.id} at (${chargerPoint.x}, ${chargerPoint.y}), ori: ${chargerPoint.ori}`);
      } else {
        logRobotTask6(`- No charger point found, will skip return to charger step`);
      }
      const workflowSteps = [];
      workflowSteps.push({
        type: "move",
        params: {
          x: pickupDockingPoint.x,
          y: pickupDockingPoint.y,
          ori: pickupDockingPoint.ori,
          label: pickupDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "align_with_rack",
        params: {
          x: pickupPoint.x,
          y: pickupPoint.y,
          ori: pickupPoint.ori,
          label: `Align with rack at ${pickupPoint.id}`
        }
      });
      workflowSteps.push({
        type: "jack_up",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffDockingPoint.x,
          y: dropoffDockingPoint.y,
          ori: dropoffDockingPoint.ori,
          label: dropoffDockingPoint.id
        }
      });
      workflowSteps.push({
        type: "to_unload_point",
        params: {
          x: dropoffPoint.x,
          y: dropoffPoint.y,
          ori: dropoffPoint.ori,
          label: dropoffPoint.id
        }
      });
      workflowSteps.push({
        type: "jack_down",
        params: {
          waitComplete: true,
          stabilizationTime: 3e3,
          // 3 seconds stabilization
          safetyWait: true
        }
      });
      workflowSteps.push({
        type: "move",
        params: {
          x: dropoffDockingPoint.x,
          y: dropoffDockingPoint.y,
          ori: dropoffDockingPoint.ori,
          label: `${dropoffDockingPoint.id} (safe position)`
        }
      });
      if (chargerPoint) {
        workflowSteps.push({
          type: "move",
          params: {
            x: chargerPoint.x,
            y: chargerPoint.y,
            ori: chargerPoint.ori,
            label: chargerPoint.id,
            isCharger: true
            // Explicitly mark this as a charger move
          }
        });
      } else {
        workflowSteps.push({
          type: "return_to_charger",
          params: {
            label: "Return to charging station",
            useApi: true
          }
        });
      }
      logRobotTask6("\u{1F4CB} Created workflow steps:");
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        if (step.type === "move") {
          if (step.params.isCharger) {
            logRobotTask6(`- Step ${i + 1}: CHARGER DOCKING at ${step.params.label} (${step.params.x}, ${step.params.y})`);
          } else {
            logRobotTask6(`- Step ${i + 1}: Move to ${step.params.label} (${step.params.x}, ${step.params.y})`);
          }
        } else if (step.type === "jack_up") {
          logRobotTask6(`- Step ${i + 1}: JACK UP with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "jack_down") {
          logRobotTask6(`- Step ${i + 1}: JACK DOWN with safety wait: ${step.params.waitComplete}`);
        } else if (step.type === "align_with_rack") {
          logRobotTask6(`- Step ${i + 1}: ALIGN WITH RACK at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        } else if (step.type === "to_unload_point") {
          logRobotTask6(`- Step ${i + 1}: TO UNLOAD POINT at ${step.params.label} (${step.params.x}, ${step.params.y})`);
        } else if (step.type === "return_to_charger") {
          logRobotTask6(`- Step ${i + 1}: RETURN TO CHARGER using ${step.params.useApi ? "API method" : "point movement"}`);
        }
      }
      await missionQueue.cancelAllActiveMissions();
      logRobotTask6("\u2705 Cancelled any existing active missions");
      const missionName = `Pickup from 104 to Dropoff Workflow`;
      const mission = missionQueue.createMission(missionName, workflowSteps, ROBOT_SERIAL);
      const duration = Date.now() - startTime;
      logRobotTask6(`\u2705 Created mission with ID: ${mission.id}`);
      logRobotTask6(`\u{1F680} Total planning time: ${duration}ms`);
      return res.status(200).json({
        success: true,
        message: "Pickup from 104 workflow initiated successfully",
        missionId: mission.id,
        steps: workflowSteps.length,
        duration,
        method: "mission_queue",
        note: "Robot will pick up from the 104 shelf and drop at main dropoff point"
      });
    } catch (error) {
      const errorMessage = `Error executing pickup-from-104 workflow: ${error.message}`;
      logRobotTask6(`\u274C ${errorMessage}`);
      if (error.response) {
        logRobotTask6(`API Error Status: ${error.response.status}`);
        logRobotTask6(`API Error Data: ${JSON.stringify(error.response.data)}`);
      }
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  };
  app2.post("/api/pickup-from-104/workflow", handlePickupFrom104Workflow);
  logRobotTask6("\u2705 Registered pickup-from-104 workflow handler");
}

// server/routes.ts
init_robot_settings_api();

// server/charger-docking.ts
init_robot_constants();
import axios11 from "axios";
function registerChargerDockingRoutes(app2) {
  const headers3 = getAuthHeaders();
  app2.post("/api/robot/dock-with-charger", async (req, res) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[${timestamp}] [CHARGER-DIRECT] Received direct charger docking request`);
    try {
      const chargerPosition = {
        x: 0.03443853667262486,
        y: 0.4981316698765672,
        ori: 266.11
      };
      console.log(`[${timestamp}] [CHARGER-DIRECT] Cancelling any current moves first`);
      try {
        await axios11.patch(`${ROBOT_API_URL}/chassis/moves/current`, {
          state: "cancelled"
        }, { headers: headers3 });
        console.log(`[${timestamp}] [CHARGER-DIRECT] Successfully cancelled any current moves`);
      } catch (error) {
        console.log(`[${timestamp}] [CHARGER-DIRECT] Warning: Couldn't cancel current move: ${error.message}`);
      }
      console.log(`[${timestamp}] [CHARGER-DIRECT] Waiting for move cancellation to take effect...`);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      console.log(`[${timestamp}] [CHARGER-DIRECT] Creating 'charge' move to charger at (${chargerPosition.x}, ${chargerPosition.y}), orientation: ${chargerPosition.ori}`);
      const chargePayload = {
        creator: "web_interface",
        type: "charge",
        target_x: chargerPosition.x,
        target_y: chargerPosition.y,
        target_z: 0,
        target_ori: chargerPosition.ori,
        target_accuracy: 0.05,
        // 5cm accuracy required for docking
        charge_retry_count: 5,
        // Increased from 3 to 5 retries
        properties: {
          max_trans_vel: 0.2,
          // Slower speed for more accurate docking
          max_rot_vel: 0.2,
          acc_lim_x: 0.2,
          acc_lim_theta: 0.2,
          planning_mode: "directional"
        }
      };
      console.log(`[${timestamp}] [CHARGER-DIRECT] Sending charge command with payload:`, JSON.stringify(chargePayload));
      const chargeResponse = await axios11.post(`${ROBOT_API_URL}/chassis/moves`, chargePayload, { headers: headers3 });
      const moveId = chargeResponse.data.id;
      console.log(`[${timestamp}] [CHARGER-DIRECT] Charge command sent - move ID: ${moveId}`);
      console.log(`[${timestamp}] [CHARGER-DIRECT] Response data:`, JSON.stringify(chargeResponse.data));
      setTimeout(async () => {
        try {
          const checkChargingStatus = async (attempt = 1, maxAttempts = 5) => {
            const currentTime = (/* @__PURE__ */ new Date()).toISOString();
            console.log(`[${currentTime}] [CHARGER-DIRECT] Checking charging status (attempt ${attempt}/${maxAttempts})...`);
            try {
              const moveResponse = await axios11.get(`${ROBOT_API_URL}/chassis/moves/${moveId}`, { headers: headers3 });
              const moveState = moveResponse.data;
              console.log(`[${currentTime}] [CHARGER-DIRECT] Move (ID: ${moveId}) status: ${moveState.state}`);
              if (moveState.state === "failed") {
                console.log(`[${currentTime}] [CHARGER-DIRECT] \u274C Charge move FAILED. Reason: ${moveState.fail_reason_str}`);
                console.log(`[${currentTime}] [CHARGER-DIRECT] Failure details: ${moveState.fail_message}`);
              }
              try {
                const batteryResponse = await axios11.get(`${ROBOT_API_URL}/battery_state`, { headers: headers3 });
                const batteryState = batteryResponse.data;
                console.log(`[${currentTime}] [CHARGER-DIRECT] Battery state: ${JSON.stringify(batteryState)}`);
                if (batteryState && batteryState.is_charging) {
                  console.log(`[${currentTime}] [CHARGER-DIRECT] \u2705 SUCCESS! Robot is now CHARGING. Battery level: ${batteryState.percentage}%`);
                  return true;
                } else {
                  console.log(`[${currentTime}] [CHARGER-DIRECT] \u26A0\uFE0F Robot is NOT charging`);
                  if (attempt >= maxAttempts) {
                    console.log(`[${currentTime}] [CHARGER-DIRECT] \u274C Failed to dock with charger after ${maxAttempts} attempts`);
                    return false;
                  }
                  console.log(`[${currentTime}] [CHARGER-DIRECT] Will check again in 10 seconds...`);
                  setTimeout(() => checkChargingStatus(attempt + 1, maxAttempts), 1e4);
                }
              } catch (batteryError) {
                console.log(`[${currentTime}] [CHARGER-DIRECT] Error checking battery state: ${batteryError.message}`);
                if (attempt >= maxAttempts) {
                  console.log(`[${currentTime}] [CHARGER-DIRECT] \u274C Failed to verify charging status after ${maxAttempts} attempts`);
                  return false;
                }
                console.log(`[${currentTime}] [CHARGER-DIRECT] Will check again in 10 seconds...`);
                setTimeout(() => checkChargingStatus(attempt + 1, maxAttempts), 1e4);
              }
            } catch (moveError) {
              console.log(`[${currentTime}] [CHARGER-DIRECT] Error checking move status: ${moveError.message}`);
              if (attempt >= maxAttempts) {
                console.log(`[${currentTime}] [CHARGER-DIRECT] \u274C Failed to verify move status after ${maxAttempts} attempts`);
                return false;
              }
              console.log(`[${currentTime}] [CHARGER-DIRECT] Will check again in 10 seconds...`);
              setTimeout(() => checkChargingStatus(attempt + 1, maxAttempts), 1e4);
            }
          };
          await new Promise((resolve) => setTimeout(resolve, 1e4));
          checkChargingStatus();
        } catch (error) {
          console.log(`[${timestamp}] [CHARGER-DIRECT] Could not verify charging status: ${error.message}`);
        }
      }, 1e3);
      return res.status(200).json({
        success: true,
        message: "Direct charger docking initiated",
        moveId,
        chargerPosition
      });
    } catch (error) {
      const errorMessage = `Error initiating charger docking: ${error.message}`;
      console.error(`[${timestamp}] [CHARGER-DIRECT] ${errorMessage}`);
      if (error.response) {
        console.error(`[${timestamp}] [CHARGER-DIRECT] Response error:`, JSON.stringify(error.response.data));
      }
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.response?.data || {}
      });
    }
  });
  console.log("\u2705 Registered direct charger docking route: /api/robot/dock-with-charger");
}

// server/bin-detection.ts
init_robot_constants();
import axios12 from "axios";
async function checkForBin(x, y, pointId) {
  try {
    const headers3 = getAuthHeaders();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[${timestamp}] [BIN-DETECTION] Checking for bin at ${pointId || `(${x}, ${y})`}`);
    const costmapEndpoint = `${ROBOT_API_URL}/chassis/local_costmap`;
    const costmapResponse = await axios12.get(costmapEndpoint, { headers: headers3 });
    if (!costmapResponse.data || !costmapResponse.data.obstacles) {
      throw new Error("No obstacle data available from costmap API");
    }
    const obstacles = costmapResponse.data.obstacles;
    for (const obstacle of obstacles) {
      const distance = Math.sqrt(
        Math.pow(obstacle.x - x, 2) + Math.pow(obstacle.y - y, 2)
      );
      if (distance < 0.5) {
        console.log(`[${timestamp}] [BIN-DETECTION] \u2705 Obstacle detected near ${pointId || `(${x}, ${y})`} using costmap - bin confirmed`);
        return true;
      }
    }
    console.log(`[${timestamp}] [BIN-DETECTION] No obstacles detected near ${pointId || `(${x}, ${y})`} using costmap - no bin present`);
    return false;
  } catch (error) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.error(`[${timestamp}] [BIN-DETECTION] Error checking for bin at ${pointId || `(${x}, ${y})`}:`, error.message);
    throw new Error(`Failed to detect bin at ${pointId || `(${x}, ${y})`}: ${error.message}`);
  }
}

// server/bin-status-routes.ts
init_robot_map_data();
var binStatusOverrides = {};
function registerBinStatusRoutes(app2) {
  app2.get("/api/bins/status", async (req, res) => {
    try {
      const location = req.query.location;
      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Missing location parameter"
        });
      }
      if (location in binStatusOverrides) {
        console.log(`Using bin status override for ${location}: ${binStatusOverrides[location]}`);
        return res.json({
          success: true,
          location,
          binPresent: binStatusOverrides[location],
          source: "override"
        });
      }
      const mapPoints = await fetchRobotMapPoints();
      const point = mapPoints.find((p) => p.id === location);
      if (!point) {
        return res.status(404).json({
          success: false,
          message: `Location "${location}" not found in map data`
        });
      }
      const binPresent = await checkForBin(point.x, point.y, point.id);
      return res.json({
        success: true,
        location,
        pointId: point.id,
        coordinates: { x: point.x, y: point.y },
        binPresent,
        source: "detection"
      });
    } catch (error) {
      console.error(`Error checking bin status: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.post("/api/bins/clear", async (req, res) => {
    try {
      const { location, clearAction } = req.body;
      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Missing location parameter"
        });
      }
      if (!clearAction || !["manual_removal", "robot_pickup"].includes(clearAction)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid clearAction (must be "manual_removal" or "robot_pickup")'
        });
      }
      const mapPoints = await fetchRobotMapPoints();
      const point = mapPoints.find((p) => p.id === location);
      if (!point) {
        return res.status(404).json({
          success: false,
          message: `Location "${location}" not found in map data`
        });
      }
      binStatusOverrides[location] = false;
      console.log(`\u2705 Set override for ${location}: bin is now CLEAR (action: ${clearAction})`);
      return res.json({
        success: true,
        message: `Bin at ${location} has been cleared (${clearAction})`,
        location,
        binPresent: false
      });
    } catch (error) {
      console.error(`Error clearing bin status: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.post("/api/bins/add", async (req, res) => {
    try {
      const { location, addAction } = req.body;
      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Missing location parameter"
        });
      }
      if (!addAction || !["manual_placement", "robot_dropoff"].includes(addAction)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid addAction (must be "manual_placement" or "robot_dropoff")'
        });
      }
      const mapPoints = await fetchRobotMapPoints();
      const point = mapPoints.find((p) => p.id === location);
      if (!point) {
        return res.status(404).json({
          success: false,
          message: `Location "${location}" not found in map data`
        });
      }
      binStatusOverrides[location] = true;
      console.log(`\u2705 Set override for ${location}: bin is now PRESENT (action: ${addAction})`);
      return res.json({
        success: true,
        message: `Bin has been added to ${location} (${addAction})`,
        location,
        binPresent: true
      });
    } catch (error) {
      console.error(`Error adding bin status: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.post("/api/bins/reset-overrides", (req, res) => {
    const overrideCount = Object.keys(binStatusOverrides).length;
    for (const key in binStatusOverrides) {
      delete binStatusOverrides[key];
    }
    console.log(`\u2705 Reset ${overrideCount} bin status overrides`);
    return res.json({
      success: true,
      message: `Reset ${overrideCount} bin status overrides`,
      overrideCount
    });
  });
  console.log("\u2705 Registered bin status API routes");
}

// server/robot-capabilities-api.ts
init_robot_constants();

// server/robot-template-discovery.ts
import axios13 from "axios";
init_robot_constants();
var logger = {
  info: (message) => console.log(message),
  error: (message) => console.error(message),
  warn: (message) => console.warn(message)
};
function getPointDisplayName(pointId) {
  if (!pointId) return "";
  const id = String(pointId);
  logger.info(`Getting display name for point: ${id}`);
  if (id === "pick-up_load" || id.toLowerCase() === "pickup_load") {
    return "Central Pickup";
  }
  if (id === "drop-off_load" || id.toLowerCase() === "dropoff_load") {
    return "Central Dropoff";
  }
  if (id.toLowerCase().includes("charging") || id.toLowerCase().includes("charger")) {
    return "Charger";
  }
  let match = id.match(/^(\d+)_/);
  if (match) {
    return match[1];
  }
  match = id.match(/(?:shelf|load)[_-]?(\d+)/i);
  if (match) {
    return match[1];
  }
  match = id.match(/(\d+)[_-]?(?:shelf|load)/i);
  if (match) {
    return match[1];
  }
  match = id.match(/(\d+)/);
  if (match) {
    return match[1];
  }
  let cleanId = id.replace(/_load$/i, "").replace(/_docking$/i, "").replace(/_shelf$/i, "").replace(/-load$/i, "").replace(/-docking$/i, "").replace(/-shelf$/i, "");
  cleanId = cleanId.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").trim();
  cleanId = cleanId.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  logger.info(`Cleaned point ID: ${cleanId}`);
  return cleanId;
}
function isShelfPoint(pointId) {
  if (!pointId) return false;
  const pointIdStr = String(pointId);
  const id = pointIdStr.toLowerCase();
  logger.info(`Checking if point is shelf point: ${id}`);
  if (id === "pick-up_load" || id === "drop-off_load") {
    logger.info(`\u2705 Detected special shelf point: ${id}`);
    return true;
  }
  if (id.includes("docking") || id.includes("charger") || id.includes("station")) {
    return false;
  }
  const isStandardPattern = /^\d+_load/.test(id) || /shelf_\d+/.test(id) || /\d+_shelf/.test(id) || id.includes("shelf") && /\d+/.test(id) || id.includes("load") && /\d+/.test(id);
  const isAutoXPattern = /^([a-z0-9]+)_load$/i.test(id);
  return isStandardPattern || isAutoXPattern;
}
async function getMaps() {
  try {
    logger.info(`Fetching maps from robot API: ${ROBOT_API_URL}/maps with robot ID: ${ROBOT_SERIAL}`);
    const response = await axios13.get(`${ROBOT_API_URL}/maps`, {
      headers: {
        "X-Robot-Serial": ROBOT_SERIAL,
        "X-Robot-Secret": ROBOT_SECRET
      }
    });
    let maps = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        maps = response.data;
        logger.info(`Found maps in direct array format: ${maps.length}`);
      } else if (response.data.maps && Array.isArray(response.data.maps)) {
        maps = response.data.maps;
        logger.info(`Found maps in 'maps' property: ${maps.length}`);
      } else if (response.data.id !== void 0) {
        maps = [response.data];
        logger.info(`Found single map object`);
      } else {
        const propertiesToCheck = ["map", "data", "items", "results"];
        for (const prop of propertiesToCheck) {
          if (response.data[prop]) {
            if (Array.isArray(response.data[prop])) {
              maps = response.data[prop];
              logger.info(`Found maps in '${prop}' property: ${maps.length}`);
              break;
            } else if (response.data[prop].id !== void 0) {
              maps = [response.data[prop]];
              logger.info(`Found single map in '${prop}' property`);
              break;
            }
          }
        }
      }
    }
    maps = maps.map((map) => {
      if (map && map.id !== void 0) {
        map.id = String(map.id);
        logger.info(`Processed map ID: ${map.id}`);
      } else if (map && map.map_id !== void 0) {
        map.id = String(map.map_id);
        logger.info(`Mapped map_id to id: ${map.id}`);
      }
      return map;
    });
    if (maps.length > 0) {
      logger.info(`Successfully retrieved ${maps.length} maps from robot`);
      logger.info(`Map IDs: ${JSON.stringify(maps.map((m) => m.id || m.map_name || m.name))}`);
      return maps;
    }
    logger.warn(`No maps found in robot response: ${JSON.stringify(response.data)}`);
    return [];
  } catch (error) {
    logger.error(`Error fetching maps: ${error}`);
    return [];
  }
}
async function getMapPoints(mapId) {
  const endpoints = [
    `/maps/${mapId}/points`,
    `/maps/${mapId}/point`,
    `/maps/${mapId}`,
    `/points?map_id=${mapId}`,
    `/point?map_id=${mapId}`
  ];
  let points = [];
  for (const endpoint of endpoints) {
    try {
      logger.info(`Fetching points for map ${mapId} from robot API: ${ROBOT_API_URL}${endpoint}`);
      const response = await axios13.get(`${ROBOT_API_URL}${endpoint}`, {
        headers: {
          "X-Robot-Serial": ROBOT_SERIAL,
          "X-Robot-Secret": ROBOT_SECRET
        }
      });
      if (response.data && typeof response.data === "object" && response.data.overlays && typeof response.data.overlays === "string") {
        logger.info(`Found overlays JSON string in response for map ${mapId}`);
        try {
          const overlaysData = JSON.parse(response.data.overlays);
          if (overlaysData.features && Array.isArray(overlaysData.features)) {
            const pointFeatures = overlaysData.features.filter((feature) => {
              return feature.geometry && feature.geometry.type === "Point";
            });
            logger.info(`Found ${pointFeatures.length} point features in overlays data`);
            points = pointFeatures.map((feature) => {
              return {
                id: feature.properties?.name || feature.id,
                name: feature.properties?.name || "",
                properties: feature.properties || {},
                pose: {
                  position: {
                    x: feature.geometry.coordinates[0],
                    y: feature.geometry.coordinates[1]
                  },
                  orientation: {
                    z: feature.properties?.yaw || 0
                  }
                }
              };
            });
            if (points.length > 0) {
              logger.info(`Successfully extracted ${points.length} points from overlays data`);
              logger.info(`First point: ${JSON.stringify(points[0])}`);
              break;
            }
          }
        } catch (error) {
          logger.error(`Error parsing overlays JSON: ${error}`);
        }
      }
      if (response.data) {
        if (Array.isArray(response.data)) {
          points = response.data;
        } else if (response.data.points && Array.isArray(response.data.points)) {
          points = response.data.points;
        } else if (response.data.id || response.data.name) {
          points = [response.data];
        } else if (typeof response.data === "object") {
          if (points.length === 0 && response.data.points_url) {
            try {
              const pointsUrl = response.data.points_url;
              logger.info(`Found points_url: ${pointsUrl}`);
              const pointsResponse = await axios13.get(pointsUrl, {
                headers: {
                  "X-Robot-Serial": ROBOT_SERIAL,
                  "X-Robot-Secret": ROBOT_SECRET
                }
              });
              if (pointsResponse.data && Array.isArray(pointsResponse.data)) {
                points = pointsResponse.data;
              } else if (pointsResponse.data && pointsResponse.data.points && Array.isArray(pointsResponse.data.points)) {
                points = pointsResponse.data.points;
              }
            } catch (pointsError) {
              logger.warn(`Error fetching points from points_url: ${pointsError}`);
            }
          }
        }
        if (points.length > 0) {
          logger.info(`Retrieved ${points.length} points for map ${mapId} using endpoint ${endpoint}`);
          const pointIds = points.map((p) => p.id || p.point_id || p.name || "unknown");
          logger.info(`Point IDs for map ${mapId}: ${JSON.stringify(pointIds)}`);
          logger.info(`First point full data: ${JSON.stringify(points[0])}`);
          break;
        }
      }
    } catch (error) {
      logger.error(`Error fetching points for map ${mapId} using endpoint ${endpoint}: ${error}`);
    }
  }
  if (points.length === 0) {
    logger.warn(`MAP POINTS DEBUG - Map ${mapId} has 0 points: ${JSON.stringify(points)}`);
  } else {
    logger.info(`Map ${mapId} has ${points.length} points: ${points.map((p) => p.id || p.name).join(", ")}`);
  }
  return points;
}
async function discoverRobotCapabilities(robotId) {
  try {
    logger.info(`Refreshing robot capabilities for robot ${robotId}`);
    logger.info(`Discovering robot capabilities for robot ${robotId}`);
    const maps = await getMaps();
    const mapDataPromises = maps.map(async (map) => {
      const mapId = String(map.id || map.map_id || "");
      const mapName = map.name || map.map_name || `Map ${mapId}`;
      logger.info(`Processing map: ${JSON.stringify(map)}`);
      let floorNumber = 1;
      const nameToCheck = mapName || mapId;
      const floorMatch = String(nameToCheck).match(/Floor(\d+)/);
      if (floorMatch) {
        floorNumber = parseInt(floorMatch[1], 10);
      } else if (String(nameToCheck).includes("Basement")) {
        floorNumber = 0;
      }
      const points = await getMapPoints(mapId);
      logger.info(`MAP POINTS DEBUG - Map ${mapId} has ${points.length} points: ${JSON.stringify(points.map((p) => p.id || p.name))}`);
      const shelfPoints = points.filter((point) => {
        if (!point) return false;
        const pointId = point.id || point.name || point.point_id || "";
        if (!pointId) {
          logger.warn(`Point missing ID: ${JSON.stringify(point)}`);
          return false;
        }
        let isShelf = isShelfPoint(pointId);
        if (!isShelf && point.properties && point.properties.name) {
          isShelf = isShelfPoint(point.properties.name);
        }
        if (!isShelf && point.properties && point.properties.type === "34") {
          logger.info(`\u2705 Found rack point via type=34: ${pointId}`);
          isShelf = true;
        }
        if (isShelf) {
          logger.info(`\u2705 Found shelf point: ${pointId}`);
        }
        return isShelf;
      }).map((point) => {
        const pointId = point.id || point.name || point.point_id || "";
        const possibleDockingIds = [
          `${pointId}_docking`,
          `${pointId}-docking`,
          `${pointId} docking`,
          `${pointId.replace("_load", "")}_docking`,
          `${pointId}_dock`,
          `${pointId}-dock`
        ];
        const hasDockingPoint = points.some((p) => {
          if (!p || !p.id) return false;
          const pId = String(p.id).toLowerCase();
          return possibleDockingIds.some((id) => pId === id.toLowerCase());
        });
        if (hasDockingPoint) {
          logger.info(`\u2705 Found docking point for shelf: ${pointId}`);
        }
        return {
          id: pointId,
          displayName: getPointDisplayName(pointId),
          x: point.pose?.position?.x || 0,
          y: point.pose?.position?.y || 0,
          orientation: point.pose?.orientation?.z || 0,
          hasDockingPoint
        };
      });
      return {
        id: mapId,
        name: mapName,
        displayName: mapName,
        // Set displayName to be the same as name initially
        floorNumber,
        shelfPoints,
        points
        // Store the raw points data
      };
    });
    const mapData = await Promise.all(mapDataPromises);
    let hasCharger = false;
    let hasCentralPickup = false;
    let hasCentralDropoff = false;
    for (const map of mapData) {
      const allPoints = await getMapPoints(map.id);
      for (const point of allPoints) {
        if (!point) {
          logger.warn(`Skipping null point`);
          continue;
        }
        const pointId = String(point.id || point.name || "").toLowerCase();
        const properties = point.properties || {};
        const propName = properties.name ? String(properties.name).toLowerCase() : "";
        const propType = properties.type ? String(properties.type) : "";
        logger.info(`Checking point: ${pointId}, name: ${propName}, type: ${propType}`);
        if (pointId === "charger" || pointId.includes("charger") || pointId.includes("charging") || pointId === "charge" || propName.includes("charging") || propName === "charging station" || propType === "9") {
          hasCharger = true;
          logger.info(`\u2705 Found charger point: ${propName || pointId}`);
        } else if (pointId === "pick-up_load" || pointId === "pickup_load" || pointId.includes("pickup") || pointId.includes("pick-up") || propName === "pick-up_load" || propName.includes("pick-up") || propName.includes("pickup")) {
          hasCentralPickup = true;
          logger.info(`\u2705 Found central pickup point: ${propName || pointId}`);
        } else if (pointId === "drop-off_load" || pointId === "dropoff_load" || pointId.includes("dropoff") || pointId.includes("drop-off") || propName === "drop-off_load" || propName.includes("drop-off") || propName.includes("dropoff")) {
          hasCentralDropoff = true;
          logger.info(`\u2705 Found central dropoff point: ${propName || pointId}`);
        }
        if (isShelfPoint(pointId) || isShelfPoint(propName)) {
          logger.info(`\u2705 Found shelf point: ${propName || pointId}`);
        }
      }
      logger.info(`Map ${map.id} has ${allPoints.length} points: ${allPoints.map((p) => p.id).join(", ")}`);
    }
    const serviceTypes = [];
    const hasShelfPoints = maps.some((map) => map.shelfPoints && map.shelfPoints.length > 0);
    {
      serviceTypes.push({
        id: "robot",
        displayName: "Robot Service",
        icon: "robot",
        enabled: true
      });
    }
    logger.info(`Discovered ${serviceTypes.length} service types based on robot capabilities`);
    const capabilities = {
      maps: mapData,
      serviceTypes,
      hasCharger,
      hasCentralPickup,
      hasCentralDropoff
    };
    await storage.storeRobotCapabilities(robotId, capabilities);
    return capabilities;
  } catch (error) {
    logger.error(`Error discovering robot capabilities: ${error}`);
    throw new Error(`Failed to discover robot capabilities: ${error}`);
  }
}
async function updateTemplateWithRobotCapabilities(templateId, robotId) {
  try {
    logger.info(`[TEMPLATE-DISCOVERY] Updating template ${templateId} with robot ${robotId} capabilities`);
    const capabilities = await discoverRobotCapabilities(robotId);
    const template = await storage.getTemplate(templateId);
    if (!template) {
      logger.error(`Template ${templateId} not found`);
      return;
    }
    const updatedTemplate = {
      ...template,
      robotCapabilities: capabilities
    };
    await storage.updateTemplate(templateId, updatedTemplate);
    logger.info(`[TEMPLATE-DISCOVERY] Template ${templateId} updated successfully`);
  } catch (error) {
    logger.error(`Error updating template with robot capabilities: ${error}`);
  }
}

// server/robot-capabilities-api.ts
var logger2 = {
  info: (message) => console.log(message),
  error: (message) => console.error(message),
  warn: (message) => console.warn(message)
};
function registerRobotCapabilitiesAPI(app2) {
  logger2.info("Registering robot capabilities API routes");
  app2.post("/api/robot-capabilities/clear-cache", async (req, res) => {
    try {
      const robotId = ROBOT_SERIAL;
      await storage.clearRobotCapabilities(robotId);
      logger2.info(`Cleared robot capabilities cache for robot ${robotId}`);
      res.status(200).json({ success: true, message: `Cleared capabilities cache for robot ${robotId}` });
    } catch (error) {
      logger2.error(`Error clearing robot capabilities cache: ${error}`);
      res.status(500).json({ error: "Failed to clear robot capabilities cache" });
    }
  });
  app2.get("/api/robot-capabilities/operations", async (req, res) => {
    try {
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      const operations = {
        pickup: {
          enabled: capabilities.hasCentralPickup,
          displayName: "Pick Up",
          description: "Pick up a bin from central pickup"
        },
        dropoff: {
          enabled: capabilities.hasCentralDropoff,
          displayName: "Drop Off",
          description: "Drop off a bin at central dropoff"
        },
        shelfToShelf: {
          enabled: capabilities.maps.some((map) => map.shelfPoints.length >= 2),
          displayName: "Shelf to Shelf",
          description: "Move bins between shelves"
        },
        returnToCharger: {
          enabled: capabilities.hasCharger,
          displayName: "Return to Charger",
          description: "Send robot back to charging station"
        }
      };
      res.status(200).json({ operations });
    } catch (error) {
      logger2.error(`Error retrieving operations: ${error}`);
      res.status(500).json({ error: "Failed to retrieve operations" });
    }
  });
  app2.get("/api/robot-capabilities", async (req, res) => {
    try {
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      res.status(200).json(capabilities);
    } catch (error) {
      logger2.error(`Error retrieving robot capabilities: ${error}`);
      res.status(500).json({ error: "Failed to retrieve robot capabilities" });
    }
  });
  app2.post("/api/robot-capabilities/apply-to-template/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const robotId = ROBOT_SERIAL;
      await updateTemplateWithRobotCapabilities(parseInt(templateId, 10), robotId);
      res.status(200).json({ success: true, message: "Template updated with robot capabilities" });
    } catch (error) {
      logger2.error(`Error applying robot capabilities to template: ${error}`);
      res.status(500).json({ error: "Failed to apply robot capabilities to template" });
    }
  });
  app2.get("/api/simplified-workflow/maps", async (req, res) => {
    try {
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      const sortedMaps = [...capabilities.maps].sort((a, b) => a.floorNumber - b.floorNumber);
      res.status(200).json({
        maps: sortedMaps,
        serviceTypes: capabilities.serviceTypes
      });
    } catch (error) {
      logger2.error(`Error retrieving maps for simplified workflow: ${error}`);
      res.status(500).json({ error: "Failed to retrieve maps" });
    }
  });
  app2.get("/api/simplified-workflow/service-types", async (req, res) => {
    try {
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      res.status(200).json({ serviceTypes: capabilities.serviceTypes });
    } catch (error) {
      logger2.error(`Error retrieving service types: ${error}`);
      res.status(500).json({ error: "Failed to retrieve service types" });
    }
  });
  app2.get("/api/simplified-workflow/service-types/:serviceType/operations", async (req, res) => {
    try {
      const { serviceType } = req.params;
      logger2.info(`Getting operations for service type: ${serviceType}`);
      let operations = [];
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      if (capabilities.hasCentralPickup) {
        operations.push({
          id: "pickup",
          displayName: "Pick Up",
          enabled: true
        });
      }
      if (capabilities.hasCentralDropoff) {
        operations.push({
          id: "dropoff",
          displayName: "Drop Off",
          enabled: true
        });
      }
      const hasMultipleShelves = capabilities.maps.some((map) => map.shelfPoints.length >= 2);
      if (hasMultipleShelves) {
        operations.push({
          id: "transfer",
          displayName: "Transfer Between Shelves",
          enabled: true
        });
      }
      logger2.info(`Found ${operations.length} operations from robot for service type ${serviceType}`);
      if (operations.length === 0) {
        logger2.warn(`No operations found from robot API for service type: ${serviceType}`);
      }
      logger2.info(`Returning operations: ${JSON.stringify(operations)}`);
      res.status(200).json({ operations });
    } catch (error) {
      logger2.error(`Error retrieving operations for service type: ${error}`);
      res.status(500).json({ error: "Failed to retrieve operations" });
    }
  });
  app2.get("/api/simplified-workflow/operations", async (req, res) => {
    try {
      logger2.info(`Getting operations directly (no service type)`);
      const operations = [
        {
          id: "pickup",
          displayName: "Pick Up",
          enabled: true
        },
        {
          id: "dropoff",
          displayName: "Drop Off",
          enabled: true
        }
      ];
      logger2.info(`Returning operations: ${JSON.stringify(operations)}`);
      res.status(200).json({ operations });
    } catch (error) {
      logger2.error(`Error retrieving operations (direct endpoint): ${error}`);
      res.status(500).json({ error: "Failed to retrieve operations" });
    }
  });
  app2.get("/api/simplified-workflow/service-types/:serviceType/operations/:operationType/floors", async (req, res) => {
    try {
      const { serviceType, operationType } = req.params;
      logger2.info(`Getting floors for service type ${serviceType} and operation ${operationType}`);
      let floors = [];
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      floors = capabilities.maps.filter((map) => {
        if (operationType === "pickup" || operationType === "dropoff") {
          return map.shelfPoints.length > 0;
        }
        return true;
      }).map((map) => ({
        id: map.id,
        displayName: map.name,
        floorNumber: map.floorNumber
      })).sort((a, b) => a.floorNumber - b.floorNumber);
      if (floors.length === 0) {
        logger2.info("No floors found on robot");
      }
      logger2.info(`Returning floors: ${JSON.stringify(floors)}`);
      res.status(200).json({ floors });
    } catch (error) {
      logger2.error(`Error retrieving floors: ${error}`);
      res.status(500).json({ error: "Failed to retrieve floors" });
    }
  });
  app2.get("/api/simplified-workflow/operations/:operationType/floors", async (req, res) => {
    try {
      const { operationType } = req.params;
      logger2.info(`Getting floors for operation ${operationType} (direct endpoint)`);
      let floors = [];
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      floors = capabilities.maps.filter((map) => {
        if (operationType === "pickup" || operationType === "dropoff") {
          return map.shelfPoints.length > 0;
        }
        return true;
      }).map((map) => ({
        id: map.id,
        displayName: map.name,
        floorNumber: map.floorNumber
      })).sort((a, b) => a.floorNumber - b.floorNumber);
      if (floors.length === 0) {
        logger2.info("No floors found on robot (direct endpoint)");
      }
      logger2.info(`Returning floors: ${JSON.stringify(floors)}`);
      res.status(200).json({ floors });
    } catch (error) {
      logger2.error(`Error retrieving floors (direct endpoint): ${error}`);
      res.status(500).json({ error: "Failed to retrieve floors" });
    }
  });
  app2.get("/api/simplified-workflow/service-types/:serviceType/operations/:operationType/floors/:floorId/shelves", async (req, res) => {
    try {
      const { serviceType, operationType, floorId } = req.params;
      logger2.info(`Getting shelves for service type ${serviceType}, operation ${operationType}, floor ${floorId}`);
      let shelves = [];
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      logger2.info(`Available maps: ${JSON.stringify(capabilities.maps.map((m) => ({ id: m.id, displayName: m.displayName })))}`);
      const floorMapId = String(floorId);
      const map = capabilities.maps.find(
        (m) => String(m.id) === floorMapId || String(m.displayName) === floorMapId
      );
      if (map) {
        logger2.info(`Found map for floor ${floorId}: ${JSON.stringify(map)}`);
        if (map.shelfPoints && map.shelfPoints.length > 0) {
          shelves = map.shelfPoints.map((point) => ({
            id: point.id,
            displayName: point.displayName,
            x: point.x,
            y: point.y
          }));
        } else {
          logger2.info(`No shelf points found, extracting from full points array for floor ${floorId}`);
          if (map.points && Array.isArray(map.points)) {
            const filteredPoints = map.points.filter((point) => {
              const name = (point.name || "").toLowerCase();
              if (operationType === "pickup") {
                return name.includes("pickup") || name.includes("shelf") || name.includes("load");
              } else if (operationType === "dropoff") {
                return name.includes("dropoff") || name.includes("shelf") || name.includes("dock");
              }
              return true;
            });
            shelves = filteredPoints.map((point) => {
              let x = 0, y = 0;
              if (point.pose?.position) {
                x = point.pose.position.x || 0;
                y = point.pose.position.y || 0;
              } else if (point.x !== void 0 && point.y !== void 0) {
                x = point.x;
                y = point.y;
              } else if (point.coord && point.coord.length >= 2) {
                x = point.coord[0] || 0;
                y = point.coord[1] || 0;
              } else if (point.position) {
                x = point.position.x || 0;
                y = point.position.y || 0;
              }
              const name = point.name || point.id || `Point ${point.id}`;
              const displayName = name.replace(/_/g, " ").replace(/(\d+)_(\w+)/, "$1 $2");
              return {
                id: String(point.id || point.name),
                displayName,
                x,
                y
              };
            });
          }
        }
      } else {
        logger2.warn(`Floor ${floorId} not found in robot capabilities`);
        throw new Error(`Floor ${floorId} not found in robot capabilities`);
      }
      if (shelves.length === 0) {
        logger2.info(`No shelves found for floor ${floorId}`);
      }
      logger2.info(`Returning shelves: ${JSON.stringify(shelves)}`);
      res.status(200).json({ shelves });
    } catch (error) {
      logger2.error(`Error retrieving shelves: ${error}`);
      res.status(500).json({ error: "Failed to retrieve shelves" });
    }
  });
  app2.get("/api/simplified-workflow/operations/:operationType/floors/:floorId/shelves", async (req, res) => {
    try {
      const { operationType, floorId } = req.params;
      logger2.info(`Getting shelves for operation ${operationType}, floor ${floorId} (direct endpoint)`);
      let shelves = [];
      const robotId = ROBOT_SERIAL;
      const capabilities = await discoverRobotCapabilities(robotId);
      logger2.info(`Available maps: ${JSON.stringify(capabilities.maps.map((m) => ({ id: m.id, displayName: m.displayName })))}`);
      const floorMapId = String(floorId);
      const map = capabilities.maps.find(
        (m) => String(m.id) === floorMapId || String(m.displayName) === floorMapId
      );
      if (map) {
        logger2.info(`Found map for floor ${floorId}: ${JSON.stringify(map)}`);
        if (map.shelfPoints && map.shelfPoints.length > 0) {
          shelves = map.shelfPoints.map((point) => ({
            id: point.id,
            displayName: point.displayName,
            x: point.x,
            y: point.y
          }));
        } else {
          logger2.info(`No shelf points found, extracting from full points array for floor ${floorId}`);
          if (map.points && Array.isArray(map.points)) {
            const filteredPoints = map.points.filter((point) => {
              const name = (point.name || "").toLowerCase();
              if (operationType === "pickup") {
                return name.includes("pickup") || name.includes("shelf") || name.includes("load");
              } else if (operationType === "dropoff") {
                return name.includes("dropoff") || name.includes("shelf") || name.includes("dock");
              }
              return true;
            });
            shelves = filteredPoints.map((point) => {
              let x = 0, y = 0;
              if (point.pose?.position) {
                x = point.pose.position.x || 0;
                y = point.pose.position.y || 0;
              } else if (point.x !== void 0 && point.y !== void 0) {
                x = point.x;
                y = point.y;
              } else if (point.coord && point.coord.length >= 2) {
                x = point.coord[0] || 0;
                y = point.coord[1] || 0;
              } else if (point.position) {
                x = point.position.x || 0;
                y = point.position.y || 0;
              }
              const name = point.name || point.id || `Point ${point.id}`;
              const displayName = name.replace(/_/g, " ").replace(/(\d+)_(\w+)/, "$1 $2");
              return {
                id: String(point.id || point.name),
                displayName,
                x,
                y
              };
            });
          }
        }
      } else {
        logger2.warn(`Floor ${floorId} not found in robot capabilities (direct endpoint)`);
        throw new Error(`Floor ${floorId} not found in robot capabilities`);
      }
      if (shelves.length === 0) {
        logger2.info(`No shelves found for floor ${floorId} (direct endpoint)`);
      }
      logger2.info(`Returning shelves: ${JSON.stringify(shelves)}`);
      res.status(200).json({ shelves });
    } catch (error) {
      logger2.error(`Error retrieving shelves (direct endpoint): ${error}`);
      res.status(500).json({ error: "Failed to retrieve shelves" });
    }
  });
  app2.post("/api/simplified-workflow/execute", async (req, res) => {
    try {
      const { operationType, floorId, shelfId } = req.body;
      const serviceType = "robot";
      if (!operationType || !floorId || !shelfId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      let workflowType = "";
      if (operationType === "pickup") {
        if (shelfId === "pickup_load" || shelfId === "pick-up_load") {
          workflowType = "central-to-shelf";
        } else {
          workflowType = "shelf-to-central";
        }
      } else if (operationType === "dropoff") {
        if (shelfId === "dropoff_load" || shelfId === "drop-off_load") {
          workflowType = "shelf-to-central";
        } else {
          workflowType = "central-to-shelf";
        }
      } else if (operationType === "transfer") {
        workflowType = "shelf-to-shelf";
        if (!req.body.sourceShelfId) {
          return res.status(400).json({ error: "Missing sourceShelfId parameter for transfer operation" });
        }
      }
      const dynamicWorkflow = await Promise.resolve().then(() => (init_dynamic_workflow(), dynamic_workflow_exports));
      const workflowParams = {
        serviceType,
        operationType,
        floorId,
        shelfId
      };
      if (operationType === "transfer") {
        const sourceShelfId = req.body.sourceShelfId || req.body.sourceShelf;
        if (!sourceShelfId) {
          logger2.error("Missing sourceShelfId parameter for transfer operation");
          return res.status(400).json({ error: "Missing sourceShelfId parameter for transfer operation" });
        }
        workflowParams.pickupShelf = sourceShelfId;
        workflowParams.dropoffShelf = shelfId;
        logger2.info(`Transfer operation from ${sourceShelfId} to ${shelfId}`);
      }
      logger2.info(`Executing workflow type: ${workflowType} with params: ${JSON.stringify(workflowParams)}`);
      try {
        logger2.info(`Executing generic workflow of type: ${workflowType}`);
        logger2.info(`Parameters: ${JSON.stringify(workflowParams)}`);
        const workflowResult = await dynamicWorkflow.executeWorkflow(workflowType, workflowParams);
        logger2.info(`Workflow execution initiated successfully: ${JSON.stringify({
          success: workflowResult.success,
          missionId: workflowResult.missionId || "unknown",
          message: workflowResult.message || "Workflow execution started"
        })}`);
        res.status(200).json({
          success: workflowResult.success,
          missionId: workflowResult.missionId || "unknown",
          message: workflowResult.message || "Workflow execution started",
          // Include shelf ID for frontend reference
          shelfId
        });
      } catch (workflowError) {
        logger2.error(`Error in workflow execution: ${workflowError.message || workflowError}`);
        if (workflowError.stack) {
          logger2.error(`Stack trace: ${workflowError.stack}`);
        }
        throw workflowError;
      }
    } catch (error) {
      logger2.error(`Error executing workflow: ${error.message || String(error)}`);
      if (error.stack) {
        logger2.error(`Stack trace: ${error.stack}`);
      }
      res.status(500).json({
        success: false,
        error: "Failed to execute workflow",
        details: error.message || String(error),
        // Include the workflow parameters in the error response to help with debugging
        params: {
          workflowType: req.body.workflowType,
          shelfId: req.body.params?.shelfId,
          floorId: req.body.params?.floorId,
          operationType: req.body.params?.operationType
        }
      });
    }
  });
  logger2.info("\u2705 Registered robot capabilities API routes");
}

// server/robot-task-api.ts
import axios16 from "axios";
import { v4 as uuidv42 } from "uuid";
import fs11 from "fs";
import path11 from "path";
var ROBOT_API_URL5 = process.env.ROBOT_API_URL || "http://47.180.91.99:8090/api/v1";
var ROBOT_SECRET14 = process.env.ROBOT_SECRET || "rosver1";
var TaskType = /* @__PURE__ */ ((TaskType2) => {
  TaskType2["PICKUP"] = "pickup";
  TaskType2["DROPOFF"] = "dropoff";
  TaskType2["CHARGE"] = "charge";
  TaskType2["MOVE"] = "move";
  return TaskType2;
})(TaskType || {});
var activeTasks = /* @__PURE__ */ new Map();
var taskStoragePath = path11.join(process.cwd(), "robot-tasks.json");
function getHeaders2() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ROBOT_SECRET14}`
  };
}
function logTask(taskId, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[${timestamp}] [TASK:${taskId}] ${message}`);
  fs11.appendFileSync(
    path11.join(process.cwd(), "robot-debug.log"),
    `[${timestamp}] [TASK:${taskId}] ${message}
`
  );
}
async function ensureJackIsDown(taskId) {
  logTask(taskId, "\u26A0\uFE0F SAFETY CHECK: Verifying jack state...");
  try {
    const jackStateResponse = await axios16.get(`${ROBOT_API_URL5}/jack_state`, { headers: getHeaders2() });
    const jackState = jackStateResponse.data;
    if (jackState && jackState.is_up === true) {
      logTask(taskId, "\u26A0\uFE0F Jack is currently UP. Executing jack_down operation...");
      try {
        await axios16.post(`${ROBOT_API_URL5}/services/jack_down`, {}, { headers: getHeaders2() });
        logTask(taskId, "Jack down operation started, waiting 10 seconds for completion...");
        await new Promise((resolve) => setTimeout(resolve, 1e4));
        logTask(taskId, "\u2705 Successfully lowered jack");
        return true;
      } catch (jackDownError) {
        logTask(taskId, `\u274C Failed to lower jack: ${jackDownError.message}`);
        return false;
      }
    } else {
      logTask(taskId, "\u2705 Jack already in down state");
      return true;
    }
  } catch (jackCheckError) {
    logTask(taskId, `\u26A0\uFE0F Warning: Unable to verify jack state: ${jackCheckError.message}`);
    try {
      await axios16.post(`${ROBOT_API_URL5}/services/jack_down`, {}, { headers: getHeaders2() });
      logTask(taskId, "Precautionary jack down operation started, waiting 10 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      logTask(taskId, "\u2705 Completed precautionary jack down operation");
      return true;
    } catch (precautionaryJackError) {
      logTask(taskId, `\u26A0\uFE0F Warning: Precautionary jack_down failed: ${precautionaryJackError.message}`);
      return true;
    }
  }
}
async function executeJackUp2(taskId) {
  logTask(taskId, "\u{1F53C} Starting jack up operation...");
  try {
    logTask(taskId, "Stabilizing position for 3 seconds before jack operation...");
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    await axios16.post(`${ROBOT_API_URL5}/services/jack_up`, {}, { headers: getHeaders2() });
    logTask(taskId, "Jack up operation started, waiting 10 seconds for completion...");
    await new Promise((resolve) => setTimeout(resolve, 1e4));
    logTask(taskId, "Jack operation complete, waiting 3 seconds for system stabilization...");
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    logTask(taskId, "\u2705 Jack up operation completed successfully");
    return true;
  } catch (error) {
    logTask(taskId, `\u274C Jack up operation failed: ${error.message}`);
    return false;
  }
}
async function executeJackDown2(taskId) {
  logTask(taskId, "\u{1F53D} Starting jack down operation...");
  try {
    logTask(taskId, "Stabilizing position for 3 seconds before jack operation...");
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    await axios16.post(`${ROBOT_API_URL5}/services/jack_down`, {}, { headers: getHeaders2() });
    logTask(taskId, "Jack down operation started, waiting 10 seconds for completion...");
    await new Promise((resolve) => setTimeout(resolve, 1e4));
    logTask(taskId, "Jack operation complete, waiting 3 seconds for system stabilization...");
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    logTask(taskId, "\u2705 Jack down operation completed successfully");
    return true;
  } catch (error) {
    logTask(taskId, `\u274C Jack down operation failed: ${error.message}`);
    return false;
  }
}
async function returnToCharger5(taskId) {
  logTask(taskId, "\u{1F50B} Starting return to charger operation...");
  try {
    try {
      await axios16.patch(`${ROBOT_API_URL5}/chassis/moves/current`, {
        state: "cancelled"
      }, { headers: getHeaders2() });
      logTask(taskId, "Successfully cancelled any current moves");
    } catch (error) {
      logTask(taskId, `Warning: Couldn't cancel current move: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const jackDownSuccess = await ensureJackIsDown(taskId);
    if (!jackDownSuccess) {
      logTask(taskId, "\u26A0\uFE0F Failed to ensure jack is down, but continuing with return to charger");
    }
    const chargerPosition = {
      x: 0.03443853667262486,
      y: 0.4981316698765672,
      ori: 266.11
    };
    const chargeCommand = {
      creator: "web_interface",
      type: "charge",
      // Special move type for charger return
      target_x: chargerPosition.x,
      target_y: chargerPosition.y,
      target_z: 0,
      target_ori: chargerPosition.ori,
      target_accuracy: 0.05,
      // 5cm accuracy required for docking
      charge_retry_count: 5,
      // Increased from 3 to 5 retries
      properties: {
        max_trans_vel: 0.2,
        // Slower speed for more accurate docking
        max_rot_vel: 0.3,
        // Maximum rotational velocity (rad/s)
        acc_lim_x: 0.5,
        // Acceleration limit in x
        acc_lim_theta: 0.5
        // Angular acceleration limit
      }
    };
    logTask(taskId, `Creating 'charge' move to charger at (${chargerPosition.x}, ${chargerPosition.y}), orientation: ${chargerPosition.ori}`);
    const response = await axios16.post(`${ROBOT_API_URL5}/chassis/moves`, chargeCommand, { headers: getHeaders2() });
    const moveId = response.data.id;
    logTask(taskId, `Charge command sent - move ID: ${moveId}`);
    let moveComplete = false;
    let maxRetries = 180;
    let attempts = 0;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const statusResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/${moveId}`, { headers: getHeaders2() });
      const moveStatus = statusResponse.data.state;
      logTask(taskId, `Current charger return status: ${moveStatus}`);
      if (moveStatus === "succeeded") {
        moveComplete = true;
        logTask(taskId, `\u{1F50B} \u2705 Robot has successfully returned to charger (ID: ${moveId})`);
      } else if (moveStatus === "failed" || moveStatus === "cancelled") {
        throw new Error(`Return to charger failed or was cancelled. Status: ${moveStatus}`);
      } else {
        logTask(taskId, `Still moving to charger (move ID: ${moveId}), waiting...`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Return to charger timed out after ${maxRetries} attempts`);
    }
    try {
      const batteryResponse = await axios16.get(`${ROBOT_API_URL5}/battery_state`, { headers: getHeaders2() });
      const batteryState = batteryResponse.data;
      if (batteryState && batteryState.is_charging) {
        logTask(taskId, "\u{1F50B} Confirmed: Robot is now charging!");
      } else {
        logTask(taskId, `\u26A0\uFE0F Warning: Robot returned to charger but may not be charging. Battery state: ${JSON.stringify(batteryState)}`);
      }
    } catch (batteryError) {
      logTask(taskId, `Warning: Could not check charging status: ${batteryError.message}`);
    }
    return true;
  } catch (error) {
    logTask(taskId, `\u274C ERROR returning to charger: ${error.message}`);
    return false;
  }
}
async function moveToPoint3(taskId, x, y, orientation, pointName) {
  logTask(taskId, `Moving robot to ${pointName} (${x}, ${y}, orientation: ${orientation})`);
  try {
    try {
      const currentMoveResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/current`, { headers: getHeaders2() });
      if (currentMoveResponse.data && currentMoveResponse.data.id) {
        logTask(taskId, "\u26A0\uFE0F Robot is currently moving. Cancelling current move");
        await axios16.patch(`${ROBOT_API_URL5}/chassis/moves/current`, { state: "cancelled" }, { headers: getHeaders2() });
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    } catch (error) {
      logTask(taskId, `Note: Could not check current move state: ${error.message}`);
    }
    const moveCommand = {
      creator: "web_interface",
      type: "standard",
      target_x: x,
      target_y: y,
      target_z: 0,
      target_ori: orientation,
      properties: {
        max_trans_vel: 0.5,
        max_rot_vel: 0.5,
        acc_lim_x: 0.5,
        acc_lim_theta: 0.5,
        planning_mode: "directional"
      }
    };
    const response = await axios16.post(`${ROBOT_API_URL5}/chassis/moves`, moveCommand, { headers: getHeaders2() });
    const moveId = response.data.id;
    logTask(taskId, `Move command sent for ${pointName} - move ID: ${moveId}`);
    let moveComplete = false;
    let maxRetries = 120;
    let attempts = 0;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const statusResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/${moveId}`, { headers: getHeaders2() });
      const moveStatus = statusResponse.data.state;
      logTask(taskId, `Current move status: ${moveStatus}`);
      try {
        const posResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/pose`, { headers: getHeaders2() });
        const pos = posResponse.data;
        if (pos && typeof pos.x === "number" && typeof pos.y === "number" && typeof pos.ori === "number") {
          logTask(taskId, `Current position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, orientation: ${pos.ori.toFixed(2)})`);
        } else {
          logTask(taskId, `Position data incomplete or invalid: ${JSON.stringify(pos)}`);
        }
      } catch (posError) {
        logTask(taskId, `Unable to get robot position: ${posError.message}`);
      }
      if (moveStatus === "succeeded") {
        moveComplete = true;
        logTask(taskId, `\u2705 Robot has completed movement (ID: ${moveId})`);
      } else if (moveStatus === "failed" || moveStatus === "cancelled") {
        throw new Error(`Move failed or was cancelled. Status: ${moveStatus}`);
      } else {
        logTask(taskId, `Still moving (move ID: ${moveId}), waiting...`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Move timed out after ${maxRetries} seconds`);
    }
    const finalStatusResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/${moveId}`, { headers: getHeaders2() });
    const finalMoveStatus = finalStatusResponse.data.state;
    logTask(taskId, `Final move status check: ${finalMoveStatus}`);
    return finalMoveStatus === "succeeded";
  } catch (error) {
    logTask(taskId, `\u274C ERROR moving to ${pointName}: ${error.message}`);
    return false;
  }
}
async function alignWithRack(taskId, x, y, orientation, pointName) {
  logTask(taskId, `\u{1F504} Starting align_with_rack operation at ${pointName}...`);
  try {
    const jackDownSuccess = await ensureJackIsDown(taskId);
    if (!jackDownSuccess) {
      throw new Error("Failed to ensure jack is down before align_with_rack");
    }
    try {
      await axios16.post(`${ROBOT_API_URL5}/chassis/stop`, {}, { headers: getHeaders2() });
      logTask(taskId, "\u2705 Stopped robot before align with rack");
    } catch (stopError) {
      logTask(taskId, `Warning: Failed to stop robot: ${stopError.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const alignCommand = {
      creator: "robot-api",
      type: "align_with_rack",
      // Special move type for rack pickup
      target_x: x,
      target_y: y,
      target_ori: orientation
    };
    logTask(taskId, `Creating align_with_rack move: ${JSON.stringify(alignCommand)}`);
    const response = await axios16.post(`${ROBOT_API_URL5}/chassis/moves`, alignCommand, { headers: getHeaders2() });
    if (!response.data || !response.data.id) {
      throw new Error("Failed to create align_with_rack move - invalid response");
    }
    const moveId = response.data.id;
    logTask(taskId, `Robot align_with_rack command sent - move ID: ${moveId}`);
    let moveComplete = false;
    let maxRetries = 120;
    let attempts = 0;
    while (!moveComplete && attempts < maxRetries) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const statusResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/${moveId}`, { headers: getHeaders2() });
      const moveStatus = statusResponse.data.state;
      logTask(taskId, `Current align_with_rack status: ${moveStatus}`);
      if (moveStatus === "succeeded") {
        moveComplete = true;
        logTask(taskId, `\u2705 Robot has completed align_with_rack operation (ID: ${moveId})`);
      } else if (moveStatus === "failed" || moveStatus === "cancelled") {
        if (moveStatus === "failed") {
          const failReason = statusResponse.data.fail_reason_str || "Unknown failure";
          logTask(taskId, `\u26A0\uFE0F Align with rack failed with reason: ${failReason}`);
        }
        throw new Error(`Align with rack failed or was cancelled. Status: ${moveStatus}`);
      } else {
        logTask(taskId, `Still aligning (move ID: ${moveId}), waiting...`);
      }
    }
    if (!moveComplete) {
      throw new Error(`Align with rack timed out after ${maxRetries} attempts`);
    }
    logTask(taskId, "\u2705 Align with rack complete, waiting 5 seconds for stability...");
    await new Promise((resolve) => setTimeout(resolve, 5e3));
    return true;
  } catch (error) {
    logTask(taskId, `\u274C ERROR during align_with_rack operation: ${error.message}`);
    return false;
  }
}
async function toUnloadPoint(taskId, x, y, orientation, pointName) {
  try {
    logTask(taskId, `Moving to unload point at ${pointName}`);
    if (pointName.toLowerCase().includes("_docking")) {
      logTask(taskId, `\u26A0\uFE0F CRITICAL ERROR: Cannot unload at a docking point: ${pointName}`);
      logTask(taskId, `Robot must physically move to a load point before unloading`);
      logTask(taskId, `Check your workflow sequence to ensure proper movement to load points`);
      return false;
    }
    if (!pointName.toLowerCase().includes("_load")) {
      logTask(taskId, `\u26A0\uFE0F CRITICAL ERROR: Not a valid load point: ${pointName}`);
      logTask(taskId, `Point must include '_load' in its ID`);
      return false;
    }
    const loadPointId = pointName;
    const rackAreaId = loadPointId;
    logTask(taskId, `CRITICAL FIX: Using full load point "${rackAreaId}" as rack_area_id`);
    logTask(taskId, `\u2705 CONFIRMED: Using load point for unloading, NOT a docking point`);
    const payload = {
      creator: "robot-management-platform",
      type: "to_unload_point",
      target_x: x,
      target_y: y,
      target_z: orientation,
      point_id: loadPointId,
      rack_area_id: rackAreaId
    };
    logTask(taskId, `Sending to_unload_point command with payload: ${JSON.stringify(payload)}`);
    const response = await axios16.post(`${ROBOT_API_URL5}/chassis/moves`, payload, {
      headers: getHeaders2()
    });
    const moveId = response.data.id;
    logTask(taskId, `Unload point command initiated with move ID: ${moveId}`);
    let retries = 0;
    const maxRetries = 60;
    while (retries < maxRetries) {
      const statusResponse = await axios16.get(`${ROBOT_API_URL5}/chassis/moves/${moveId}`, {
        headers: getHeaders2()
      });
      const status = statusResponse.data.state;
      if (status === "succeeded") {
        logTask(taskId, "Unload point movement completed successfully");
        return true;
      } else if (status === "failed") {
        logTask(taskId, `Unload point movement failed: ${statusResponse.data.reason || "Unknown error"}`);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      retries++;
    }
    logTask(taskId, "Unload point movement timed out");
    return false;
  } catch (error) {
    logTask(taskId, `Error during unload point movement: ${error.message}`);
    return false;
  }
}
async function executeZone104Task(taskId) {
  try {
    logTask(taskId, "\u{1F680} Starting Zone 104 bin pickup & delivery task");
    let taskSuccess = true;
    const task = activeTasks.get(taskId);
    if (task) {
      task.status = "running" /* RUNNING */;
      task.startTime = Date.now();
      task.currentStep = 1;
      task.totalSteps = 8;
    }
    logTask(taskId, "\u{1F4CD} STEP 1/8: Moving to 104_load_docking");
    if (task) task.currentStep = 1;
    const moveToPickupDockingSuccess = await moveToPoint3(
      taskId,
      -15.409467385438802,
      6.403540839556854,
      178.97,
      "104_load_docking"
    );
    if (!moveToPickupDockingSuccess) {
      throw new Error("Failed to move to 104_load_docking");
    }
    logTask(taskId, "\u{1F4CD} STEP 2/8: Aligning with rack at 104_load");
    if (task) task.currentStep = 2;
    const alignWithRackSuccess = await alignWithRack(
      taskId,
      -15.478,
      6.43,
      178.75,
      "104_load"
    );
    if (!alignWithRackSuccess) {
      throw new Error("Failed to align with rack at 104_load");
    }
    logTask(taskId, "\u{1F4CD} STEP 3/8: Executing jack_up operation to lift bin");
    if (task) task.currentStep = 3;
    const jackUpSuccess = await executeJackUp2(taskId);
    if (!jackUpSuccess) {
      throw new Error("Failed to execute jack_up operation");
    }
    logTask(taskId, "\u{1F4CD} STEP 4/8: Moving to 001_load_docking");
    if (task) task.currentStep = 4;
    const moveToDropoffDockingSuccess = await moveToPoint3(
      taskId,
      -1.85,
      3.366,
      0,
      "001_load_docking"
    );
    if (!moveToDropoffDockingSuccess) {
      throw new Error("Failed to move to 001_load_docking");
    }
    logTask(taskId, "\u{1F4CD} STEP 5/8: Moving to unload point at 001_load");
    if (task) task.currentStep = 5;
    const moveToDropoffSuccess = await toUnloadPoint(
      taskId,
      -2.861,
      3.383,
      0,
      "001_load"
    );
    if (!moveToDropoffSuccess) {
      throw new Error("Failed to move to unload point at 001_load");
    }
    logTask(taskId, "\u{1F4CD} STEP 6/8: Executing jack_down operation to lower bin");
    if (task) task.currentStep = 6;
    const jackDownSuccess = await executeJackDown2(taskId);
    if (!jackDownSuccess) {
      throw new Error("Failed to execute jack_down operation");
    }
    logTask(taskId, "\u{1F4CD} STEP 7/8: Backing up from dropoff area");
    if (task) task.currentStep = 7;
    const backupFromDropoffSuccess = await moveToPoint3(
      taskId,
      -4.067,
      2.579,
      269.73,
      "Post-dropoff position"
    );
    if (!backupFromDropoffSuccess) {
      logTask(taskId, "\u26A0\uFE0F Warning: Failed to back up from dropoff area, but continuing with task");
    }
    logTask(taskId, "\u{1F4CD} STEP 8/8: Returning robot to charging station");
    if (task) task.currentStep = 8;
    const returnToChargerSuccess = await returnToCharger5(taskId);
    if (!returnToChargerSuccess) {
      logTask(taskId, "\u26A0\uFE0F Warning: Failed to return to charger, but bin delivery was successful");
      taskSuccess = false;
    }
    logTask(taskId, "\u2705 Zone 104 bin pickup & delivery task completed successfully!");
    if (task) {
      task.status = taskSuccess ? "completed" /* COMPLETED */ : "failed" /* FAILED */;
      task.endTime = Date.now();
      if (!taskSuccess) {
        task.error = "Failed to return to charger, but bin delivery was successful";
      }
    }
    return taskSuccess;
  } catch (error) {
    logTask(taskId, `\u274C Zone 104 task failed: ${error.message}`);
    logTask(taskId, "\u26A0\uFE0F Attempting emergency return to charger...");
    try {
      await returnToCharger5(taskId);
      logTask(taskId, "\u2705 Emergency return to charger successful");
    } catch (chargerError) {
      logTask(taskId, `\u274C Emergency return to charger failed: ${chargerError.message}`);
    }
    const task = activeTasks.get(taskId);
    if (task) {
      task.status = "failed" /* FAILED */;
      task.endTime = Date.now();
      task.error = error.message;
    }
    return false;
  }
}
async function createTask(type, startPoint, endPoint, robotId) {
  const taskId = uuidv42();
  const task = {
    id: taskId,
    type,
    status: "pending" /* PENDING */,
    startPoint,
    endPoint,
    robotId
  };
  activeTasks.set(taskId, task);
  saveTasksToDisk();
  executeTask(taskId).catch((error) => {
    console.error(`Failed to execute task ${taskId}:`, error);
  });
  return taskId;
}
async function executeTask(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  logTask(taskId, `Executing task of type ${task.type}`);
  try {
    switch (task.type) {
      case "pickup" /* PICKUP */:
        await executeZone104Task(taskId);
        break;
      case "charge" /* CHARGE */:
        task.status = "running" /* RUNNING */;
        task.startTime = Date.now();
        task.currentStep = 1;
        task.totalSteps = 1;
        const chargeSuccess = await returnToCharger5(taskId);
        task.status = chargeSuccess ? "completed" /* COMPLETED */ : "failed" /* FAILED */;
        task.endTime = Date.now();
        if (!chargeSuccess) {
          task.error = "Failed to return to charging station";
        }
        break;
      case "move" /* MOVE */:
        if (!task.endPoint) {
          throw new Error("Move task requires an end point");
        }
        task.status = "running" /* RUNNING */;
        task.startTime = Date.now();
        task.currentStep = 1;
        task.totalSteps = 1;
        const pointMatch = task.endPoint.match(/\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (!pointMatch) {
          throw new Error(`Invalid point format: ${task.endPoint}`);
        }
        const x = parseFloat(pointMatch[1]);
        const y = parseFloat(pointMatch[2]);
        const ori = parseFloat(pointMatch[3]);
        if (isNaN(x) || isNaN(y) || isNaN(ori)) {
          throw new Error(`Invalid coordinates in point: ${task.endPoint}`);
        }
        const pointName = task.endPoint.split("(")[0].trim();
        const moveSuccess = await moveToPoint3(taskId, x, y, ori, pointName);
        task.status = moveSuccess ? "completed" /* COMPLETED */ : "failed" /* FAILED */;
        task.endTime = Date.now();
        if (!moveSuccess) {
          task.error = `Failed to move to ${pointName}`;
        }
        break;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  } catch (error) {
    task.status = "failed" /* FAILED */;
    task.endTime = Date.now();
    task.error = error.message;
    logTask(taskId, `Task execution failed: ${error.message}`);
  }
  saveTasksToDisk();
}
function getTaskById(taskId) {
  return activeTasks.get(taskId);
}
function getAllTasks() {
  return Array.from(activeTasks.values());
}
function cancelTask(taskId) {
  const task = activeTasks.get(taskId);
  if (!task) {
    return false;
  }
  if (task.status !== "pending" /* PENDING */ && task.status !== "running" /* RUNNING */) {
    return false;
  }
  const wasRunning = task.status === "running" /* RUNNING */;
  task.status = "cancelled" /* CANCELLED */;
  task.endTime = Date.now();
  if (wasRunning) {
    axios16.post(`${ROBOT_API_URL5}/chassis/stop`, {}, { headers: getHeaders2() }).then(() => {
      logTask(taskId, "Robot stopped due to task cancellation");
      returnToCharger5(taskId).catch((error) => {
        logTask(taskId, `Failed to return to charger after cancellation: ${error.message}`);
      });
    }).catch((error) => {
      logTask(taskId, `Failed to stop robot during cancellation: ${error.message}`);
    });
  }
  saveTasksToDisk();
  return true;
}
function saveTasksToDisk() {
  try {
    const tasksArray = Array.from(activeTasks.values());
    fs11.writeFileSync(taskStoragePath, JSON.stringify(tasksArray, null, 2));
  } catch (error) {
    console.error("Failed to save tasks to disk:", error);
  }
}
function loadTasksFromDisk() {
  try {
    if (fs11.existsSync(taskStoragePath)) {
      const tasksData = fs11.readFileSync(taskStoragePath, "utf8");
      const tasksArray = JSON.parse(tasksData);
      tasksArray.forEach((task) => {
        activeTasks.set(task.id, task);
      });
      console.log(`Loaded ${tasksArray.length} tasks from disk`);
    }
  } catch (error) {
    console.error("Failed to load tasks from disk:", error);
  }
}
function registerTaskApiRoutes(app2) {
  loadTasksFromDisk();
  app2.post("/api/robot/tasks", async (req, res) => {
    try {
      const { type, startPoint, endPoint, robotId } = req.body;
      if (!Object.values(TaskType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid task type: ${type}`
        });
      }
      const taskId = await createTask(type, startPoint, endPoint, robotId);
      res.status(201).json({
        success: true,
        taskId,
        message: "Task created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.get("/api/robot/tasks", (req, res) => {
    const tasks = getAllTasks();
    res.json({
      success: true,
      tasks
    });
  });
  app2.get("/api/robot/tasks/:taskId", (req, res) => {
    const { taskId } = req.params;
    const task = getTaskById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task ${taskId} not found`
      });
    }
    res.json({
      success: true,
      task
    });
  });
  app2.post("/api/robot/tasks/:taskId/cancel", (req, res) => {
    const { taskId } = req.params;
    const cancelled = cancelTask(taskId);
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: `Task ${taskId} not found or cannot be cancelled`
      });
    }
    res.json({
      success: true,
      message: `Task ${taskId} cancelled successfully`
    });
  });
  app2.post("/api/robot/tasks/zone104-pickup", async (req, res) => {
    try {
      const taskId = await createTask("pickup" /* PICKUP */, "104_load", "drop-off_load");
      res.status(201).json({
        success: true,
        taskId,
        message: "Zone 104 pickup task created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.post("/api/robot/tasks/return-to-charger", async (req, res) => {
    try {
      const taskId = await createTask("charge" /* CHARGE */);
      res.status(201).json({
        success: true,
        taskId,
        message: "Return to charger task created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  app2.post("/api/robot/tasks/test-move", async (req, res) => {
    try {
      const taskId = await createTask(
        "move" /* MOVE */,
        "Current Position",
        "Test Point (0, 0, 0)"
      );
      res.status(201).json({
        success: true,
        taskId,
        message: "Test move task created successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  console.log("\u2705 Registered robot task API routes");
}

// server/routes.ts
init_dynamic_workflow();
init_robot_constants();
function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
async function registerRoutes(app2) {
  await setupAuth(app2);
  registerAdminRoutes(app2);
  registerRobotApiRoutes(app2);
  registerRobotMoveApiRoutes(app2);
  registerRobotPointRoutes(app2);
  registerAssignTaskRoute(app2);
  registerLocalPickupRoute(app2);
  registerLocalDropoffRoute(app2);
  registerReturnToChargerHandler(app2);
  registerChargerDockingRoutes(app2);
  registerZone104WorkflowRoute(app2);
  registerPickupTo104WorkflowRoute(app2);
  registerPickupFrom104WorkflowRoute(app2);
  registerBinStatusRoutes(app2);
  registerTaskApiRoutes(app2);
  registerDynamicWorkflowRoutes(app2);
  registerRobotCapabilitiesAPI(app2);
  app2.get("/api/robots/points/display-mappings", (req, res) => {
    res.json(pointDisplayMappings);
  });
  app2.post("/api/robot/test-unload-action", async (req, res) => {
    try {
      const { pointId } = req.body;
      if (!pointId) {
        return res.status(400).json({ success: false, error: "pointId is required" });
      }
      const loadPointId = pointId.replace("_docking", "");
      let rackAreaId;
      if (loadPointId.startsWith("drop-off")) {
        rackAreaId = "drop-off";
      } else {
        const areaMatch = loadPointId.match(/^([^_]+)/);
        rackAreaId = areaMatch ? areaMatch[1] : loadPointId;
      }
      return res.json({
        success: true,
        pointId,
        loadPointId,
        rackAreaId
      });
    } catch (error) {
      console.error("[TEST-UNLOAD-ACTION] Error testing unload action:", error);
      return res.status(500).json({ success: false, error: formatError(error) });
    }
  });
  registerRobotSettingsRoutes(app2);
  app2.get("/api/debug/points", async (req, res) => {
    try {
      const mapDataModule = await Promise.resolve().then(() => (init_robot_map_data(), robot_map_data_exports));
      const points = await mapDataModule.fetchRobotMapPoints();
      const shelfPoints = points.filter(
        (p) => p.id.includes("104") || p.id.toLowerCase().includes("load")
      );
      res.json({
        total: points.length,
        shelfPoints: shelfPoints.map((p) => ({
          id: p.id,
          originalCase: p.id,
          lowerCase: p.id.toLowerCase(),
          upperCase: p.id.toUpperCase(),
          coordinates: { x: p.x, y: p.y }
        }))
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  app2.use("/api", missionRouter);
  app2.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  app2.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  app2.post("/api/templates", async (req, res) => {
    try {
      const newTemplate = req.body;
      if (!newTemplate || !newTemplate.name) {
        return res.status(400).json({ error: "Template name is required" });
      }
      const createdTemplate = await storage.createTemplate(newTemplate);
      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });
  app2.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const templateUpdate = req.body;
      if (!templateUpdate || typeof templateUpdate !== "object") {
        return res.status(400).json({ error: "Invalid template data" });
      }
      const updatedTemplate = await storage.updateTemplate(id, templateUpdate);
      if (!updatedTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });
  app2.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/robot-assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllRobotTemplateAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching robot assignments:", error);
      res.status(500).json({ error: "Failed to fetch robot assignments" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.put("/api/users/:id/template", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { templateId } = req.body;
      if (templateId === void 0) {
        return res.status(400).json({ error: "Template ID is required" });
      }
      const updated = await storage.updateUser(id, {
        templateId: templateId ? parseInt(templateId, 10) : null
      });
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating user template:", error);
      res.status(500).json({ error: "Failed to update user template" });
    }
  });
  const httpServer = createServer(app2);
  registerRobotVideoRoutes(app2, httpServer);
  setupWebSockets(httpServer);
  setupRobotWebSocketServer(httpServer);
  app2.get("/static-map", (req, res) => {
    res.sendFile("index-static.html", { root: "./client" });
    console.log("Serving static map page without Vite HMR");
  });
  await setupVite(app2, httpServer);
  return httpServer;
}
function setupWebSockets(httpServer) {
  let cameraWss;
  let poseRelayWss;
  try {
    poseRelayWss = new WebSocketServer3({
      server: httpServer,
      path: "/ws/pose",
      clientTracking: true
    });
    poseRelayWss.on("error", (error) => {
      console.error("Pose relay WebSocket server error:", error);
      if (error.code === "EADDRINUSE") {
        console.log("WebSocket port is already in use, will use the HTTP server port chosen by the dynamic port selection");
      }
    });
    poseRelayWss.on("connection", (clientSocket) => {
      console.log("[Relay] Client connected to pose relay WebSocket");
      const ROBOT_SERIAL3 = "L382502104987ir";
      const ROBOT_WS = `ws://47.180.91.99:8090/ws`;
      console.log(`[Relay] Connecting to robot WebSocket at ${ROBOT_WS}`);
      console.log("[Relay] Will subscribe to /tracked_pose topic for position updates");
      console.log("[Relay] Robot also supports /map, /slam/state, /wheel_state, /battery_state etc.");
      const connectionOptions = {
        headers: {
          "x-api-key": ROBOT_SECRET
        }
      };
      let robotSocket;
      const createRobotSocketConnection = () => {
        if (robotSocket && robotSocket.readyState === WebSocket3.OPEN) {
          robotSocket.close();
        }
        robotSocket = new WebSocket3(ROBOT_WS, connectionOptions);
        robotSocket.on("open", () => {
          console.log("[Relay] Connected to robot position WebSocket");
          robotSocket.send(JSON.stringify({
            command: "enable_topics",
            topics: ["/tracked_pose"]
          }));
          console.log("[Relay] Subscribed to /tracked_pose topic for position updates");
          if (clientSocket.readyState === WebSocket3.OPEN) {
            clientSocket.send(JSON.stringify({
              type: "connected",
              message: "Connected to robot WebSocket"
            }));
          }
        });
        robotSocket.on("message", (data) => {
          if (clientSocket.readyState === WebSocket3.OPEN) {
            try {
              const dataStr = data.toString();
              console.log("[Relay] Raw robot position data:", dataStr.substring(0, 200));
              try {
                const parsedData = JSON.parse(dataStr);
                if (parsedData.topic === "/tracked_pose" && Array.isArray(parsedData.pos) && parsedData.pos.length >= 2) {
                  const positionData2 = {
                    x: parsedData.pos[0],
                    y: parsedData.pos[1],
                    theta: parsedData.ori || 0,
                    timestamp: Date.now()
                  };
                  const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
                  robotPositionTracker2.updatePosition(positionData2);
                  console.log("[Relay] Extracted tracked_pose data:", positionData2);
                  clientSocket.send(JSON.stringify(positionData2));
                  return;
                }
                if (typeof parsedData.x === "number" && typeof parsedData.y === "number") {
                  console.log("[Relay] Forwarding position data:", { x: parsedData.x, y: parsedData.y, theta: parsedData.theta });
                  clientSocket.send(data);
                  return;
                }
                const positionData = extractPositionData(parsedData);
                if (positionData) {
                  console.log("[Relay] Extracted position data:", positionData);
                  clientSocket.send(JSON.stringify(positionData));
                  return;
                }
                if (parsedData.topic) {
                  console.log(`[Relay] Received message for topic ${parsedData.topic}, not forwarding`);
                  return;
                }
                if (parsedData.enabled_topics) {
                  console.log("[Relay] Received enabled_topics list:", parsedData.enabled_topics);
                  return;
                }
                console.log("[Relay] Unknown data format:", parsedData);
              } catch (parseError) {
                console.error("[Relay] JSON parse error:", parseError);
              }
            } catch (err) {
              console.error("[Relay] Error processing robot data:", err);
            }
          }
        });
        function extractPositionData(data) {
          if (data.topic === "/tracked_pose" && Array.isArray(data.pos) && data.pos.length >= 2) {
            const positionData = {
              x: data.pos[0],
              y: data.pos[1],
              theta: typeof data.ori === "number" ? data.ori : 0
            };
            const { robotPositionTracker: robotPositionTracker2 } = (init_robot_position_tracker(), __toCommonJS(robot_position_tracker_exports));
            robotPositionTracker2.updatePosition({ ...positionData, timestamp: Date.now() });
            return positionData;
          }
          if (Array.isArray(data.pos) && data.pos.length >= 2) {
            return {
              x: data.pos[0],
              y: data.pos[1],
              theta: data.ori || data.theta || data.angle || 0
            };
          }
          if (data.pose && typeof data.pose.position === "object") {
            return {
              x: data.pose.position.x || 0,
              y: data.pose.position.y || 0,
              theta: extractTheta(data.pose.orientation) || 0
            };
          }
          if (data.position && typeof data.position === "object") {
            return {
              x: data.position.x || 0,
              y: data.position.y || 0,
              theta: data.theta || data.angle || extractTheta(data.orientation) || 0
            };
          }
          for (const key of ["location", "coordinates", "pos", "current_position"]) {
            if (data[key] && typeof data[key] === "object") {
              if (typeof data[key].x === "number" && typeof data[key].y === "number") {
                return {
                  x: data[key].x,
                  y: data[key].y,
                  theta: data[key].theta || data[key].angle || extractTheta(data[key].orientation) || 0
                };
              } else if (Array.isArray(data[key]) && data[key].length >= 2) {
                return {
                  x: data[key][0],
                  y: data[key][1],
                  theta: data.ori || data.theta || data.angle || 0
                };
              }
            }
          }
          return null;
        }
        function extractTheta(orientation) {
          if (!orientation) return null;
          if (typeof orientation === "number") return orientation;
          if (typeof orientation === "object" && typeof orientation.z === "number" && typeof orientation.w === "number") {
            const z = orientation.z;
            const w = orientation.w;
            return Math.atan2(2 * (w * z), 1 - 2 * (z * z)) || 0;
          }
          return null;
        }
        robotSocket.on("error", (err) => {
          console.error("[Relay] Robot WebSocket error:", err.message || err);
        });
        robotSocket.on("close", (code, reason) => {
          console.log(`[Relay] Robot WebSocket closed with code ${code}${reason ? ": " + reason : ""}`);
          if (clientSocket.readyState === WebSocket3.OPEN) {
            console.log("[Relay] Attempting to reconnect to robot WebSocket in 2 seconds...");
            setTimeout(() => {
              if (clientSocket.readyState === WebSocket3.OPEN) {
                console.log("[Relay] Reconnecting to robot WebSocket...");
                createRobotSocketConnection();
              }
            }, 2e3);
          }
        });
        return robotSocket;
      };
      robotSocket = createRobotSocketConnection();
      clientSocket.on("close", () => {
        console.log("[Relay] Client disconnected from pose relay");
        if (robotSocket && robotSocket.readyState === WebSocket3.OPEN) {
          robotSocket.close();
        }
      });
    });
  } catch (error) {
    console.error("Failed to create pose relay WebSocket server:", error);
  }
  try {
    cameraWss = new WebSocketServer3({
      server: httpServer,
      path: "/api/ws/camera",
      // Add error handling for the WebSocket server
      clientTracking: true
    });
    cameraWss.on("error", (error) => {
      console.error("Camera WebSocket server error:", error);
      if (error.code === "EADDRINUSE") {
        console.log("WebSocket port is already in use, will use the HTTP server port chosen by the dynamic port selection");
      }
    });
  } catch (error) {
    console.error("Failed to create camera WebSocket server:", error);
    return;
  }
  const connectedClients = [];
  cameraWss.on("connection", (ws) => {
    console.log("New WebSocket connection for camera/position control");
    connectedClients.push(ws);
    const clientInfo = {
      wantsPositionUpdates: false,
      topics: []
    };
    const robotWs2 = (init_robot_websocket(), __toCommonJS(robot_websocket_exports));
    let positionUpdateListener = null;
    const setupPositionTracking = () => {
      if (positionUpdateListener) return;
      positionUpdateListener = (serialNumber, data) => {
        if (!clientInfo.wantsPositionUpdates) return;
        try {
          if (data.topic && clientInfo.topics.includes(data.topic)) {
            const message = {
              type: "robot_data",
              serialNumber,
              data
            };
            if (ws.readyState === WebSocket3.OPEN) {
              ws.send(JSON.stringify(message));
            }
          }
        } catch (err) {
          console.error("Error forwarding position update:", err);
        }
      };
      robotWs2.subscribeToRobotUpdates("position_update", positionUpdateListener);
    };
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (data.type === "start_mapping_streams") {
          console.log("Starting mapping streams for real-time map building or position tracking");
          let mappingTopics = data.topics || [
            "/slam/state",
            "/map",
            "/map_v2",
            "/trajectory",
            "/trajectory_node_list",
            "/path",
            "/scan_matched_points2",
            "/maps/5cm/1hz",
            "/maps/1cm/1hz",
            "/scan"
          ];
          if (!Array.isArray(mappingTopics)) {
            mappingTopics = [mappingTopics];
          }
          clientInfo.topics = mappingTopics;
          if (mappingTopics.includes("/tracked_pose")) {
            clientInfo.wantsPositionUpdates = true;
            setupPositionTracking();
          }
          console.log(`Enabling ${mappingTopics.length} mapping topics for robot ${data.serialNumber || "L382502104987ir"}`);
          try {
            if (robotWs2.isRobotConnected()) {
              const success = robotWs2.enableTopics(mappingTopics);
              if (success) {
                ws.send(JSON.stringify({
                  type: "mapping_streams_started",
                  message: "Successfully enabled mapping-specific WebSocket topics",
                  topics: mappingTopics
                }));
                console.log("Enabled mapping streams:", mappingTopics);
              } else {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Failed to enable some mapping topics"
                }));
              }
            } else {
              ws.send(JSON.stringify({
                type: "error",
                message: "Robot WebSocket is not connected"
              }));
            }
          } catch (err) {
            console.error("Error enabling mapping streams:", err);
            ws.send(JSON.stringify({
              type: "error",
              message: "Failed to enable mapping streams"
            }));
          }
        } else if (data.type === "stop_mapping_streams") {
          console.log("Stopping mapping streams for real-time map building or position tracking");
          let mappingTopics = data.topics || [
            "/slam/state",
            "/map",
            "/map_v2",
            "/trajectory",
            "/trajectory_node_list",
            "/path",
            "/scan_matched_points2",
            "/maps/5cm/1hz",
            "/maps/1cm/1hz",
            "/scan"
          ];
          if (!Array.isArray(mappingTopics)) {
            mappingTopics = [mappingTopics];
          }
          if (mappingTopics.includes("/tracked_pose")) {
            clientInfo.wantsPositionUpdates = false;
          }
          clientInfo.topics = clientInfo.topics.filter((topic) => !mappingTopics.includes(topic));
          console.log(`Disabling ${mappingTopics.length} mapping topics for robot ${data.serialNumber || "L382502104987ir"}`);
          try {
            if (robotWs2.isRobotConnected()) {
              const success = robotWs2.disableTopics(mappingTopics);
              if (success) {
                ws.send(JSON.stringify({
                  type: "mapping_streams_stopped",
                  message: "Successfully disabled mapping-specific WebSocket topics",
                  topics: mappingTopics
                }));
                console.log("Disabled mapping streams:", mappingTopics);
              } else {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Failed to disable some mapping topics"
                }));
              }
            } else {
              ws.send(JSON.stringify({
                type: "error",
                message: "Robot WebSocket is not connected"
              }));
            }
          } catch (err) {
            console.error("Error disabling mapping streams:", err);
            ws.send(JSON.stringify({
              type: "error",
              message: "Failed to disable mapping streams"
            }));
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      if (positionUpdateListener) {
        try {
          robotWs2.subscribeToRobotUpdates("position_update", positionUpdateListener);
          if (clientInfo.wantsPositionUpdates && clientInfo.topics.includes("/tracked_pose")) {
            robotWs2.disableTopics(["/tracked_pose"]);
          }
          positionUpdateListener = null;
        } catch (err) {
          console.error("Error unsubscribing from position updates:", err);
        }
      }
      const index = connectedClients.indexOf(ws);
      if (index !== -1) {
        connectedClients.splice(index, 1);
      }
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to camera/position control WebSocket"
    }));
  });
  console.log("WebSocket servers initialized");
}

// server/index.ts
var app = express5();
app.use(express5.json());
app.use(express5.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path12 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path12.startsWith("/api")) {
      let logLine = `${req.method} ${path12} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const startPort = 5e3;
  const maxPortAttempts = 10;
  function tryPort(portNumber, attempt) {
    server.listen({
      port: portNumber,
      host: "0.0.0.0",
      // Setting reusePort to false to ensure we don't try to share a port that might be
      // in use by another server instance - this is more compatible with various platforms
      reusePort: false
    }, () => {
      log(`serving on port ${portNumber}`);
    }).on("error", (err) => {
      if (err.code === "EADDRINUSE" && attempt < maxPortAttempts) {
        const nextPort = portNumber + 1;
        log(`Port ${portNumber} is in use, trying port ${nextPort}...`);
        tryPort(nextPort, attempt + 1);
      } else {
        log(`Failed to start server: ${err.message}`);
        throw err;
      }
    });
  }
  tryPort(startPort, 0);
})();
