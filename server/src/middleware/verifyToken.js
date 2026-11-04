import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers?.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access: Authentication token is missing.",
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "studiospace_jwt_secret_replace_in_production_2026";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access: Invalid or expired authentication token.",
    });
  }
}

