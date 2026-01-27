const bookingLimitMiddleware = (req, res, next) => {
  const user = req.user;

  // Paid users → unlimited bookings
  if (user.planType !== "free") {
    return next();
  }

  // Free plan booking limit check
  if (user.bookingUsed >= user.bookingLimit) {
    return res.status(403).json({
      success: false,
      code: "BOOKING_LIMIT_REACHED",
      message: "Free plan booking limit reached. Please upgrade your plan.",
    });
  }

  next();
};

export default bookingLimitMiddleware;
