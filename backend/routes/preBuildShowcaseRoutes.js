const express = require("express");
const router = express.Router();
const {
    createShowcaseItem,
    getShowcaseItems,
    getAdminShowcaseItems,
    updateShowcaseItem,
    deleteShowcaseItem
} = require("../controllers/preBuildShowcaseController");
const { preBuildShowcaseUpload } = require("../config/multerConfig");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// Public Route
router.get("/pre-build-showcase", getShowcaseItems);

// Admin Routes
router.get(
    "/admin/pre-build-showcase",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAdminShowcaseItems
);

router.post(
    "/admin/pre-build-showcase",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    preBuildShowcaseUpload.single("image"),
    createShowcaseItem
);

router.put(
    "/admin/pre-build-showcase/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    preBuildShowcaseUpload.single("image"),
    updateShowcaseItem
);

router.delete(
    "/admin/pre-build-showcase/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    deleteShowcaseItem
);

module.exports = router;