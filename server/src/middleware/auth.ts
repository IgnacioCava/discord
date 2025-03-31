import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Socket } from "socket.io";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
});

// Function to retrieve the public key for JWT verification
const getKey = (
  header: any,
  callback: (err: Error | null, key?: string) => void
) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      console.error("JWT verification failed:", err);
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = { ...(decoded as JwtPayload), id: socket.handshake.auth.id };
    next();
  });
};

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if(process.env.TOGGLE_JWT_AUTH === 'off') return next()
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new Error("Unauthorized: No token provided."));
  }

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      console.error("JWT verification failed:", err);
      return next(new Error("Unauthorized: Invalid token."));
    }

    // Attach the decoded user data and the user ID to the request
    req.user = {
      ...(decoded as JwtPayload),
      id: req.headers["x-user-id"] as string, // Assuming x-user-id is passed
    };

    next(); // Continue to the next middleware or route handler
  });
};

export { authenticateSocket };
