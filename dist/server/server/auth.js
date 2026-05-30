import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    req.user = payload;
    next();
}
export function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        const user = req.user;
        if (user.role !== "admin") {
            res.status(403).json({ error: "Admin access required" });
            return;
        }
        next();
    });
}
