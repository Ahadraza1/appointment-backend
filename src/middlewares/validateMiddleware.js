export const validateFields = (fields) => {
  return (req, res, next) => {
    
    // 🔒 SAFETY CHECK
    if (!req.body) {
      return res.status(400).json({
        message: "Request body is missing",
      });
    }

    for (let field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    next();
  };
};
