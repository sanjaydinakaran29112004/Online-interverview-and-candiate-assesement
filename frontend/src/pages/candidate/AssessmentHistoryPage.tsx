import React, { useState, useEffect } from 'react';
import { interviewsAPI, reportAPI } from '../../services/api';
import { Interview } from '../../types';
import { Award, FileText, Download, CheckCircle2, ChevronRight } from 'lucide-react';

export const AssessmentHistoryPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await interviewsAPI.list({ status: 'COMPLETED' });
        if (res.data.success) {
          setInterviews(res.data.interviews || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assessment History & Reports</h1>
        <p className="text-xs text-slate-500 mt-1">Review finalized candidate evaluation reports and download official PDF audits</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading assessment reports...</div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-700">No finalized assessments yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete a technical interview to generate your comprehensive 5-metric assessment report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map(inv => {
            const report = (inv as any).assessmentReport;
            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                      Assessment Finalized
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(inv.scheduledStartTime).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{inv.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {inv.application?.job?.companyName || 'Technical Requisition'}
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  {report && (
                    <a
                      href={reportAPI.downloadPDFUrl(report.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-100"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Official PDF Report</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
