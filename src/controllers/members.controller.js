import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { ok, created, fail } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";   // ← TAMBAHAN

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "..", "data", "members.json");

// Helper load/save JSON
function loadData() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}
function saveData(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// ETag sederhana untuk caching (hash dari konten data)
function makeETag(payload) {
  return crypto.createHash("md5").update(JSON.stringify(payload)).digest("hex");
}

// GET /api/members?page=&limit=
export function getAll(req, res) {
  const list = loadData();

  // Pagination opsional
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
  const start = (page - 1) * limit;
  const end = start + limit;

  const paged = list.slice(start, end);
  const meta = {
    total: list.length,
    page,
    limit,
    hasNext: end < list.length
  };

  const etag = makeETag({ items: paged, meta });
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "no-cache");

  // Conditional GET (If-None-Match)
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  return res.status(200).json(ok({ items: paged, meta }));
}

// GET /api/members/:id
export function getById(req, res) {
  const list = loadData();
  const item = list.find((m) => m.id === req.params.id);
  if (!item) throw new ApiError(404, "Member tidak ditemukan");   // ← DI SINI
  return res.status(200).json(ok(item));
}

// POST /api/members
export function create(req, res) {
  const { name, role, joinedAt } = req.body;

  // Validasi wajib: untuk POST semua field harus ada
  if (name === undefined || role === undefined || joinedAt === undefined) {
    return res.status(400).json(fail("Field name, role, joinedAt wajib ada"));
  }

  const list = loadData();
  const id = "m-" + (Math.max(0, ...list.map((x) => parseInt(x.id.split("-")[1] || "0"))) + 1)
    .toString()
    .padStart(3, "0");

  const newItem = { id, name, role, joinedAt };
  list.push(newItem);
  saveData(list);

  // HATEOAS ringan: tautan ke diri & koleksi
  const links = {
    self: `/api/members/${id}`,
    collection: `/api/members`
  };

  return res.status(201).json(created({ ...newItem, links }));
}

// PUT /api/members/:id (replace penuh)
export function replace(req, res) {
  const { name, role, joinedAt } = req.body;

  if ([name, role, joinedAt].some((v) => v === undefined)) {
    return res.status(400).json(fail("PUT butuh semua field: name, role, joinedAt"));
  }

  const list = loadData();
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx === -1) throw new ApiError(404, "Member tidak ditemukan");  // ← DI SINI

  list[idx] = { id: req.params.id, name, role, joinedAt };
  saveData(list);
  return res.status(200).json(ok(list[idx], "Replaced"));
}

// PATCH /api/members/:id (partial update)
export function update(req, res) {
  const list = loadData();
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx === -1) throw new ApiError(404, "Member tidak ditemukan");  // ← DI SINI

  const current = list[idx];
  const updated = { ...current, ...req.body, id: current.id }; // id tidak boleh berubah
  list[idx] = updated;
  saveData(list);
  return res.status(200).json(ok(updated, "Updated"));
}

// DELETE /api/members/:id
export function remove(req, res) {
  const list = loadData();
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx === -1) throw new ApiError(404, "Member tidak ditemukan");  // ← DI SINI

  const deleted = list[idx];
  list.splice(idx, 1);
  saveData(list);

  // Tugas minta "response kosong jika berhasil" → 204 No Content
  return res.status(204).end();
}
