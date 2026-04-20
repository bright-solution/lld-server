// import jwt from "jsonwebtoken";
// import UserModel from "../models/user.model.js";
// import Admin from "../models/admin.model.js";

// const IsAuthenticated = async (req, res, next) => {
//   try {
//     console.log(req.headers.authorization);
//     const token = req.headers.authorization.split(" ")[1] || req.cookies.token;

//     console.log(token);

//     if (!token) {
//       return res.status(401).json({ message: "You are not authenticated." });
//     }

//     const decode = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decode) {
//       return res.status(401).json({ message: "Invalid token." });
//     }

//     const user =
//       (await UserModel.findById(decode.id)) || Admin.findById(decode._id);
//     if (!user) {
//       return res.status(401).json({ message: "User not found." });
//     }

//     req.user = user;
//     if (user.role === "admin") {
//       const adminFind = await Admin.findById(user._id);
//       req.admin = adminFind;
//     }
//     next();
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export default IsAuthenticated;

import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import Admin from "../models/admin.model.js";

// const IsAuthenticated = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader);
//     const token =
//       (authHeader && authHeader.startsWith("Bearer ")
//         ? authHeader.split(" ")[1]
//         : null) || req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({ message: "You are not authenticated." });
//     }

//     const decode = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decode) {
//       return res.status(401).json({ message: "Invalid token." });
//     }

//     // ✅ Admin.findById bhi await karo — pehle await nahi tha
//     const user =
//       (await UserModel.findById(decode.id)) ||
//       (await Admin.findById(decode._id));

//     if (!user) {
//       return res.status(401).json({ message: "User not found." });
//     }

//     req.user = user;

//     if (user.role === "admin") {
//       req.admin = await Admin.findById(user._id);
//     }

//     next();
//   } catch (error) {
//     console.error("IsAuthenticated error:", error.message);

//     // JWT expire ya invalid hone pe
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({ message: "Invalid token." });
//     }
//     if (error.name === "TokenExpiredError") {
//       return res
//         .status(401)
//         .json({ message: "Token expired. Please login again." });
//     }

//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export default IsAuthenticated;

const IsAuthenticated = async (req, res, next) => {
  try {
    // ✅ Cookie ko pehle check karo, phir header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    console.log(
      "Cookie token:",
      req.cookies?.token ? "found ✅" : "missing ❌",
    );

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "You are not authenticated." });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user =
      (await UserModel.findById(decode.id)) ||
      (await Admin.findById(decode._id));

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    if (user.role === "admin") {
      req.admin = await Admin.findById(user._id);
    }

    next();
  } catch (error) {
    console.error("IsAuthenticated error:", error.message);
    if (error.name === "JsonWebTokenError")
      return res.status(401).json({ message: "Invalid token." });
    if (error.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "Token expired. Please login again." });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default IsAuthenticated;
