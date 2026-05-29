import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set high limits for handling base64 PDF uploads seamlessly
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const DATA_DIR = path.join(process.cwd(), "data");
const PASSES_FILE = path.join(DATA_DIR, "passes.json");
const PDF_DIR = path.join(DATA_DIR, "pdfs");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Initial Professional Default Passes Seed
const SEED_PASSES = [
  {
    id: "uuid-1",
    dc_number: "STQL14010368060001000600",
    vehicle_number: "GJ04AT7674",
    driver_name: "TAHIR BHAI",
    driver_mobile: "9998757522",
    license_number: "GJ1720070001281",
    mineral_name: "Quartz (16-30 Mesh)",
    net_weight: "24.20",
    concession_holder: "Gujarat Minerals",
    source_place: "422 RABBANI MOHALLA, VEJALPUR ROAD, OPP WATER TANK, GODHRA-389001",
    destination: "VAPI",
    journey_start: "2026-05-26T18:55:00",
    journey_end: "2026-05-28T08:30:00",
    route_name: "NH 48",
    transporter_name: "SELF",
    buyer_mobile: "9999999999",
    pan_gstin: "AAIFG0837H / 24AAIFG0837H1ZL",
    gps_details: "wastoo / WastooWHEELSEYE / Prithivi-140+ OBD Can Feature",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: "2026-05-26T18:58:21Z",
    status: "active"
  },
  {
    id: "uuid-2",
    dc_number: "STQL22091277054411223344",
    vehicle_number: "GJ01XY9988",
    driver_name: "RAJESH PATEL",
    driver_mobile: "9876543210",
    license_number: "GJ0120220011992",
    mineral_name: "Silica Sand Grade-II",
    net_weight: "32.50",
    concession_holder: "Saurashtra Mining Corp",
    source_place: "Mines Plot 12, Chotila, Surendranagar",
    destination: "Morbi Ceramic Hub, Morbi",
    journey_start: "2026-05-27T08:00:00",
    journey_end: "2026-05-29T18:00:00",
    route_name: "State Highway 17 & NH 8A",
    transporter_name: "Maruti Transport",
    buyer_mobile: "9426123456",
    pan_gstin: "ABCPG3241F / 24ABCPG3241F1ZD",
    gps_details: "Whelseye OBD-T14",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: "2026-05-27T08:15:00Z",
    status: "active"
  }
];

// Helper to load current passes from data file
function loadPasses(): any[] {
  try {
    if (fs.existsSync(PASSES_FILE)) {
      const data = fs.readFileSync(PASSES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading passes store:", err);
  }
  // Fallback to seed data and write it back
  try {
    fs.writeFileSync(PASSES_FILE, JSON.stringify(SEED_PASSES, null, 2), "utf-8");
  } catch (e) {}
  return SEED_PASSES;
}

// Helper to save passes to data file
function savePasses(passes: any[]): void {
  try {
    fs.writeFileSync(PASSES_FILE, JSON.stringify(passes, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving passes store:", err);
  }
}

// Ensure database is initialized with seed data at startup
loadPasses();

// API Endpoints for Passes
app.get("/api/passes", (req, res) => {
  try {
    const list = loadPasses();
    const now = new Date();
    // Dynamically adjust status of passes if they are expired
    const activeList = list.map(pass => {
      const end = new Date(pass.journey_end);
      let status = pass.status;
      if (end < now) {
        status = "expired";
      }
      return { ...pass, status };
    });
    res.json(activeList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/passes/:dc_number", (req, res) => {
  try {
    const dcNum = req.params.dc_number.trim().toUpperCase();
    const list = loadPasses();
    const match = list.find(p => p.dc_number.trim().toUpperCase() === dcNum);
    if (match) {
      const end = new Date(match.journey_end);
      if (end < new Date()) {
        match.status = "expired";
      }
      res.json(match);
    } else {
      res.status(404).json({ error: "Pass not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/passes", (req, res) => {
  try {
    const passData = req.body;
    const passes = loadPasses();
    
    // Check if pass already exists
    const cleanDc = passData.dc_number.trim().toUpperCase();
    const existIndex = passes.findIndex(p => p.dc_number.trim().toUpperCase() === cleanDc);
    
    const nowISO = new Date().toISOString();
    const newPass = {
      ...passData,
      id: "pass_" + Math.random().toString(36).substring(2, 11),
      created_at: nowISO,
      dc_number: cleanDc
    };

    if (existIndex !== -1) {
      // Overwrite or update already existing pass matching DC number
      passes[existIndex] = { ...passes[existIndex], ...newPass };
      savePasses(passes);
      res.json(passes[existIndex]);
    } else {
      passes.unshift(newPass);
      savePasses(passes);
      res.status(201).json(newPass);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/passes/:id", (req, res) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    let passes = loadPasses();
    const index = passes.findIndex(p => p.id === id);
    if (index !== -1) {
      passes[index] = { ...passes[index], ...fields };
      savePasses(passes);
      res.json(passes[index]);
    } else {
      res.status(404).json({ error: "Pass not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/passes/:id", (req, res) => {
  try {
    const id = req.params.id;
    let passes = loadPasses();
    const updated = passes.filter(p => p.id !== id);
    savePasses(updated);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PDF Upload Endpoint (handles binary encoded base64 files cleanly)
app.post("/api/upload", (req, res) => {
  try {
    const { name, base64 } = req.body;
    if (!name || !base64) {
      return res.status(400).json({ error: "Missing required file name or payload" });
    }

    // Clean up base64 metadata header if present
    let cleanBase64 = base64;
    if (base64.includes(",")) {
      cleanBase64 = base64.split(",")[1];
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Create unique filename
    const uniqId = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const cleanName = name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${uniqId}_${cleanName}`;
    const filePath = path.join(PDF_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    // Return the absolute public URL endpoint so any external scanner device can access it
    const fileUrl = `/api/pdf/${filename}`;
    res.json({ url: fileUrl });
  } catch (err: any) {
    console.error("PDF upload error on server:", err);
    res.status(500).json({ error: err.message });
  }
});

// PDF Retrieval Endpoint
app.get("/api/pdf/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(PDF_DIR, filename);

    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/pdf");
      if (req.query.download === "true") {
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      }
      res.sendFile(filePath);
    } else {
      res.status(404).send("Document not found");
    }
  } catch (err: any) {
    res.status(500).send("Error reading document file");
  }
});

// Vite dynamic handler & dev pipeline integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DC Pass Portal] Server operating actively on http://0.0.0.0:${PORT}`);
  });
}

startServer();
