"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/:id', auth_1.authenticate, reportController_1.ReportController.getReportById);
router.get('/:id/download', auth_1.authenticate, reportController_1.ReportController.downloadReportPDF);
exports.default = router;
