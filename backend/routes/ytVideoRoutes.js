const express = require("express");
const router = express.Router();
const {
    createYTVideo,
    getYTVideos,
    getAdminYTVideos,
    updateYTVideo,
    deleteYTVideo
} = require("../controllers/ytVideoController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// Public Route
router.get("/yt-videos", getYTVideos);

// Admin Routes
router.get(
    "/admin/yt-videos",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAdminYTVideos
);

router.post(
    "/admin/yt-videos",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    createYTVideo
);

router.put(
    "/admin/yt-videos/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    updateYTVideo
);

router.delete(
    "/admin/yt-videos/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    deleteYTVideo
);

module.exports = router;