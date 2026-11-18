"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rankingController_1 = require("../controllers/rankingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/job/:jobId', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN', 'RECRUITER', 'INTERVIEWER']), rankingController_1.RankingController.rankCandidatesForJob);
router.get('/compare', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN', 'RECRUITER', 'INTERVIEWER']), rankingController_1.RankingController.compareCandidates);
exports.default = router;
