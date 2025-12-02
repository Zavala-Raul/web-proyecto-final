import jwt from 'jsonwebtoken';

const SECRET_KEY = "SecretoMoment"; 

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ error: "No se proporcionó token de seguridad." });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Formato de token inválido." });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido o expirado." });
        }

        req.user = decoded; 
        
        next(); 
    });
};