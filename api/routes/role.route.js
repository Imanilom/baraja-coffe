import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// hanya superadmin & admin yang bisa kelola role
const roleAccess = verifyToken(["superadmin", "admin"]);

router.post("/", createRole);
router.get("/", roleAccess, getRoles);
router.get("/:id", roleAccess, getRoleById);
router.put("/:id", roleAccess, updateRole);
router.delete("/:id", roleAccess, deleteRole);

export default router;
