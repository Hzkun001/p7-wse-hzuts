import { ApiError } from "../utils/ApiError.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      status: "fail",
      message: "Body JSON tidak valid"
    });
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const statusText = statusCode >= 500 ? "error" : "fail";

  console.error("[ERROR]", err);

  if (res.headersSent) return next(err);

  res.status(statusCode).json({
    status: statusText,
    message: err.message || "Internal Server Error"
  });
}
