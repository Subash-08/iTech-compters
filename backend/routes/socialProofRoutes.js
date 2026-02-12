const express = require("express");
const router = express.Router();
const {
    createOrUpdateSocialProof,
    getSocialProof,
    getAdminSocialProof,
    updateSocialProofById
} = require("../controllers/socialProofController");
const { socialProofUpload } = require("../config/multerConfig");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// Public Route
router.get("/social-proof", getSocialProof);

// Admin Routes
router.get(
    "/admin/social-proof",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAdminSocialProof
);

router.post(
    "/admin/social-proof",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    socialProofUpload.fields([
        { name: 'illustrationImage', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 }
    ]),
    createOrUpdateSocialProof
);

router.put(
    "/admin/social-proof/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    socialProofUpload.fields([
        { name: 'illustrationImage', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 }
    ]),
    updateSocialProofById
);

module.exports = router;
