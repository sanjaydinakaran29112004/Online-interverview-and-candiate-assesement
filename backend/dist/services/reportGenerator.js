"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
class ReportGenerator {
    static async generatePDF(reportId, data) {
        return new Promise((resolve, reject) => {
            const reportsDir = path_1.default.join(config_1.config.uploadDir, 'reports');
            if (!fs_1.default.existsSync(reportsDir)) {
                fs_1.default.mkdirSync(reportsDir, { recursive: true });
            }
            const filePath = path_1.default.join(reportsDir, `report-${reportId}.pdf`);
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const stream = fs_1.default.createWriteStream(filePath);
            doc.pipe(stream);
            // --- Header Banner ---
            doc
                .rect(0, 0, doc.page.width, 100)
                .fill('#1e1b4b'); // Deep indigo
            doc
                .fillColor('#ffffff')
                .fontSize(22)
                .font('Helvetica-Bold')
                .text('CANDIDATE ASSESSMENT REPORT', 50, 30);
            doc
                .fontSize(10)
                .font('Helvetica')
                .fillColor('#c7d2fe')
                .text('AI-Based Online Interview & Evidence-Driven Evaluation System', 50, 60);
            doc.moveDown(3);
            // --- Metadata Grid ---
            const startY = 120;
            doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold');
            doc.text(`Candidate: ${data.candidateName} (${data.candidateEmail})`, 50, startY);
            doc.text(`Role: ${data.jobTitle} - ${data.companyName}`, 50, startY + 18);
            doc.text(`Date of Assessment: ${data.interviewDate}`, 50, startY + 36);
            // Recommendation Box
            const recColor = data.overallScore >= 75 ? '#16a34a' : data.overallScore >= 60 ? '#d97706' : '#dc2626';
            doc.rect(380, startY - 5, 170, 55).strokeColor(recColor).lineWidth(1.5).stroke();
            doc.fillColor(recColor).fontSize(10).font('Helvetica-Bold').text('FINAL RECOMMENDATION', 390, startY + 5);
            doc.fontSize(14).text(data.recommendation || 'SHORTLISTED', 390, startY + 22);
            // --- Executive Score Summary Cards ---
            const cardY = startY + 70;
            const cardW = 115;
            const cardH = 65;
            const scores = [
                { label: 'Overall Score', val: `${data.overallScore}%`, col: '#4f46e5' },
                { label: 'Technical Score', val: `${data.technicalScore}%`, col: '#0284c7' },
                { label: 'Interview Score', val: `${data.interviewScore}%`, col: '#0d9488' },
                { label: 'Resume Fit', val: `${data.resumeScore}%`, col: '#7c3aed' }
            ];
            scores.forEach((s, i) => {
                const x = 50 + i * (cardW + 12);
                doc.rect(x, cardY, cardW, cardH).fillColor('#f8fafc').fillAndStroke('#cbd5e1');
                doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(s.label, x + 10, cardY + 12);
                doc.fillColor(s.col).fontSize(18).font('Helvetica-Bold').text(s.val, x + 10, cardY + 30);
            });
            // --- Skill Competency Breakdown ---
            let currY = cardY + 85;
            doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Competency & Skill Evaluation', 50, currY);
            currY += 22;
            data.skills.forEach(sk => {
                doc.fillColor('#334155').fontSize(10).font('Helvetica').text(sk.name, 50, currY);
                // Bar background
                doc.rect(170, currY + 2, 250, 10).fillColor('#e2e8f0').fill();
                // Bar fill
                const barWidth = Math.max(5, (sk.score / 100) * 250);
                doc.rect(170, currY + 2, barWidth, 10).fillColor('#4f46e5').fill();
                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(`${sk.score}%`, 430, currY);
                currY += 20;
            });
            // --- Question by Question Evaluation ---
            currY += 15;
            doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Interview Responses & Rubric Feedback', 50, currY);
            currY += 22;
            data.answers.forEach((ans, idx) => {
                if (currY > 680) {
                    doc.addPage();
                    currY = 50;
                }
                doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text(`Q${idx + 1}: ${ans.questionTitle}`, 50, currY);
                doc.fillColor('#4f46e5').fontSize(10).text(`Score: ${ans.score}/100`, 450, currY);
                currY += 16;
                doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Candidate Response: "${ans.answerText}"`, 60, currY, { width: 480 });
                currY += doc.heightOfString(`Candidate Response: "${ans.answerText}"`, { width: 480 }) + 8;
                doc.fillColor('#15803d').fontSize(9).font('Helvetica-Bold').text('Strengths: ', 60, currY, { continued: true });
                doc.fillColor('#334155').font('Helvetica').text(ans.strengths, { width: 480 });
                currY += doc.heightOfString(ans.strengths, { width: 480 }) + 6;
                doc.fillColor('#b91c1c').fontSize(9).font('Helvetica-Bold').text('Growth Areas: ', 60, currY, { continued: true });
                doc.fillColor('#334155').font('Helvetica').text(ans.improvements, { width: 480 });
                currY += doc.heightOfString(ans.improvements, { width: 480 }) + 14;
            });
            // --- Footer / Sign-off ---
            if (currY > 680) {
                doc.addPage();
                currY = 50;
            }
            doc.rect(50, currY, 495, 60).fillColor('#f1f5f9').fill();
            doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Note: This report is automatically generated by the AI-Based Online Interview Platform with explainable rubrics and human interviewer oversight. Scores reflect evaluated candidate answers and evidence-based criteria.', 60, currY + 12, { width: 475 });
            doc.end();
            stream.on('finish', () => resolve(filePath));
            stream.on('error', err => reject(err));
        });
    }
}
exports.ReportGenerator = ReportGenerator;
