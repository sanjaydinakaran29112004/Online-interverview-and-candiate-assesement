"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/recruiter', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN', 'RECRUITER', 'INTERVIEWER']), analyticsController_1.AnalyticsController.getRecruiterDashboardMetrics);
router.get('/performance', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN', 'RECRUITER', 'INTERVIEWER']), analyticsController_1.AnalyticsController.getPerformanceAnalytics);
exports.default = router;
