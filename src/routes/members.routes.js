import { Router } from "express";
import { validateMember } from "../middlewares/validate.js";
import {
  getAll,
  getById,
  create,
  replace,
  update,
  remove
} from "../controllers/members.controller.js";

const r = Router();

r.get("/", getAll);
r.post("/", validateMember, create);      // ← penting: validateMember dulu
r.get("/:id", getById);
r.put("/:id", validateMember, replace);
r.patch("/:id", validateMember, update);
r.delete("/:id", remove);

export default r;
