const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234567890", // replace with your password
  database: "roi_simulator",
});

db.connect((err) => {
  if (err) console.log("DB Connection Error:", err);
  else console.log("✅ Connected to MySQL Database");
});

// --- Internal Constants ---
const automated_cost_per_invoice = 0.2; // automation cost per invoice
const error_rate_auto = 0.001; // 0.1%
const min_roi_boost_factor = 1.1; // positive bias factor

// --- ROI Calculation Function ---
function calculateROI(data) {
  const {
    monthly_invoice_volume,
    num_ap_staff,
    avg_hours_per_invoice,
    hourly_wage,
    error_rate_manual,
    error_cost,
    time_horizon_months,
    one_time_implementation_cost = 50000,
  } = data;

  const error_manual = error_rate_manual / 100;

  const labor_cost_manual =
    num_ap_staff * hourly_wage * avg_hours_per_invoice * monthly_invoice_volume;

  const auto_cost = monthly_invoice_volume * automated_cost_per_invoice;

  const error_savings =
    (error_manual - error_rate_auto) * monthly_invoice_volume * error_cost;

  let monthly_savings = labor_cost_manual + error_savings - auto_cost;
  monthly_savings *= min_roi_boost_factor;

  const cumulative_savings = monthly_savings * time_horizon_months;
  const net_savings = cumulative_savings - one_time_implementation_cost;
  const payback_months = one_time_implementation_cost / monthly_savings;
  const roi_percentage = (net_savings / one_time_implementation_cost) * 100;

  return {
    monthly_savings: parseFloat(monthly_savings.toFixed(2)),
    cumulative_savings: parseFloat(cumulative_savings.toFixed(2)),
    net_savings: parseFloat(net_savings.toFixed(2)),
    payback_months: parseFloat(payback_months.toFixed(1)),
    roi_percentage: parseFloat(roi_percentage.toFixed(1)),
  };
}

// --- API Endpoints ---

// 1️⃣ Run Simulation
app.post("/simulate", (req, res) => {
  const data = req.body;
  const result = calculateROI(data);
  res.json(result);
});

// 2️⃣ Save Scenario
app.post("/scenarios", (req, res) => {
  const data = req.body;

  if (!data.scenario_name || data.scenario_name.trim() === "") {
    return res.status(400).json({ error: "Scenario name is required" });
  }

  // Convert numeric fields
  const numericFields = [
    "monthly_invoice_volume",
    "num_ap_staff",
    "avg_hours_per_invoice",
    "hourly_wage",
    "error_rate_manual",
    "error_cost",
    "time_horizon_months",
    "one_time_implementation_cost",
  ];
  numericFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== "")
      data[field] = parseFloat(data[field]);
    else data[field] = 0;
  });

  const simulation = calculateROI(data);
  const dbData = { ...data, ...simulation };

  const sql = "INSERT INTO scenarios SET ?";
  db.query(sql, dbData, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Scenario saved successfully!", id: result.insertId });
  });
});

// 3️⃣ List all scenarios
app.get("/scenarios", (req, res) => {
  db.query("SELECT * FROM scenarios ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// 4️⃣ Get scenario by ID
app.get("/scenarios/:id", (req, res) => {
  db.query(
    "SELECT * FROM scenarios WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      res.json(rows[0]);
    }
  );
});

// 5️⃣ Generate PDF report (email-gated)
app.post("/report/generate", (req, res) => {
  const { email, scenario } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  const doc = new PDFDocument();
  const filename = `ROI_Report_${Date.now()}.pdf`;
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  doc.fontSize(18).text("Invoicing ROI Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Email: ${email}`);
  doc.moveDown();
  doc.text("Scenario Details:");
  doc.text(JSON.stringify(scenario, null, 2));

  doc.end();

  stream.on("finish", () => {
    res.download(filename, () => fs.unlinkSync(filename));
  });
});

// --- Start Server ---
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
