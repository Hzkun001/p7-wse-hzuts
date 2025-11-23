// src/middlewares/validate.js

// Validasi input untuk POST / PUT / PATCH members
export function validateMember(req, res, next) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "fail",
      message: "Body request wajib dikirim dalam format JSON.",
      errors: ["Request body kosong atau bukan JSON."]
    });
  }

  const { name, role, joinedAt } = req.body;
  const errors = [];

  // name: boleh undefined (untuk PATCH), tapi kalau ada harus string & tidak kosong
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    errors.push("Field 'name' wajib string & tidak kosong.");
  }

  // role
  if (role !== undefined && (typeof role !== "string" || !role.trim())) {
    errors.push("Field 'role' wajib string & tidak kosong.");
  }

  // joinedAt: kalau ada harus format YYYY-MM-DD
  if (joinedAt !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(joinedAt)) {
      errors.push("Field 'joinedAt' wajib format YYYY-MM-DD.");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: "fail",
      message: "Validasi gagal",
      errors
    });
  }

  next();
}
