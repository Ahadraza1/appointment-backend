/* --------- NOT FOUND --------- */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/* --------- ERROR HANDLER --------- */
const errorHandler = (err, req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://appointment-frontend-livid-xi.vercel.app"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { errorHandler };

