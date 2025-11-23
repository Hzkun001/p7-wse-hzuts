// Pola respons seragam, mudah dinilai & di-assert saat testing.
export const ok = (data, message = "OK") => ({ status: "success", message, data });
export const created = (data, message = "Created") => ({ status: "success", message, data });
export const fail = (message, errors) => ({
  status: "fail",
  message,
  ...(errors ? { errors } : {})
});
