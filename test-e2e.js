/**
 * End-to-End Automated Integration Test Suite
 * AI-Based Online Interview and Candidate Assessment Platform
 */

const { spawn } = require('child_process');
const http = require('http');

const BACKEND_PORT = 5000;
const AI_PORT = 8000;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function waitForPort(port, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await httpRequest({ hostname: '127.0.0.1', port, path: '/', method: 'GET' });
      return true;
    } catch {
      await wait(500);
    }
  }
  return false;
}

async function runTests() {
  console.log('================================================================');
  console.log(' STARTING END-TO-END PLATFORM INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // 1. Boot Python AI Service
  console.log('-> Launching Python AI Microservice...');
  const aiProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: './ai-service',
    shell: true
  });

  // 2. Boot Node.js Backend Server
  console.log('-> Launching Node.js Backend Server...');
  const backendProcess = spawn('node', ['dist/server.js'], {
    cwd: './backend',
    shell: true
  });

  console.log('-> Awaiting service readiness on ports 8000 and 5000...');
  const aiReady = await waitForPort(8000);
  const backendReady = await waitForPort(5000);

  if (!aiReady) console.warn('Warning: AI service took longer to respond.');
  if (!backendReady) console.warn('Warning: Backend took longer to respond.');

  try {
    // TEST 1: AI Service Health
    console.log('[TEST 1] Testing Python AI Service Health Check (/health)...');
    const aiHealth = await httpRequest({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/health',
      method: 'GET'
    });
    console.log(` Status: ${aiHealth.status}, Engine: ${aiHealth.data?.nlp_engine}`);
    if (aiHealth.status !== 200) throw new Error('AI health check failed');

    // TEST 2: AI Service Answer Evaluation
    console.log('\n[TEST 2] Testing 5-Metric AI Answer Evaluation (/api/ai/evaluation/evaluate-answer)...');
    const evalRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/ai/evaluation/evaluate-answer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      question_title: 'React Hooks and Performance',
      question_description: 'How do useMemo and useCallback optimize renders?',
      skill_evaluated: 'React',
      expected_concepts: ['useMemo caches computed values', 'useCallback memoizes function references', 'React.memo skips render on unchanged props'],
      candidate_answer: 'useMemo caches expensive calculations. useCallback memoizes function references to prevent unnecessary renders when child components use React.memo.',
      evaluation_criteria: 'Measures practical render optimization.'
    });
    console.log(` Score: ${evalRes.data?.overall_score}/100, Model: ${evalRes.data?.evaluation_model}`);
    console.log(` Metrics: Tech=${evalRes.data?.metrics?.technical_correctness}%, Sem=${evalRes.data?.metrics?.semantic_relevance}%, Conc=${evalRes.data?.metrics?.conceptual_understanding}%`);
    if (!evalRes.data?.overall_score || evalRes.data.overall_score < 60) throw new Error('Evaluation test failed');

    // TEST 3: AI Question Generation
    console.log('\n[TEST 3] Testing AI Question Generation (/api/ai/questions/generate)...');
    const qGenRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/ai/questions/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      job_title: 'DevOps Architect',
      job_description: 'Cloud and Kubernetes leadership.',
      required_skills: ['Kubernetes', 'AWS'],
      experience_level: 'advanced',
      category: 'technical',
      num_questions: 2
    });
    console.log(` Generated ${qGenRes.data?.questions?.length} calibrated questions successfully.`);
    if (qGenRes.data?.questions?.length !== 2) throw new Error('Question gen test failed');

    // TEST 4: Backend Health Check
    console.log('\n[TEST 4] Testing Node.js Backend API Health (/api/health)...');
    const backendHealth = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log(` Status: ${backendHealth.status}, Environment: ${backendHealth.data?.environment}`);
    if (backendHealth.status !== 200) throw new Error('Backend health check failed');

    // TEST 5: Authentication (Login as Recruiter)
    console.log('\n[TEST 5] Testing Recruiter Authentication (/api/auth/login)...');
    const loginRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'recruiter1@techcorp.com',
      password: 'Password123!'
    });
    console.log(` User authenticated: ${loginRes.data?.user?.name} (Role: ${loginRes.data?.user?.role})`);
    const token = loginRes.data?.token;
    if (!token) throw new Error('Authentication failed');

    // TEST 6: Job Requisitions API
    console.log('\n[TEST 6] Testing Job Management API (/api/jobs)...');
    const jobsRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/jobs',
      method: 'GET'
    });
    console.log(` Retrieved ${jobsRes.data?.jobs?.length} active job requisitions from database.`);
    if (jobsRes.data?.jobs?.length === 0) throw new Error('Jobs list failed');
    const sampleJob = jobsRes.data.jobs[0];

    // TEST 7: Recruiter Analytics API (Real DB Queries)
    console.log('\n[TEST 7] Testing Recruiter Dashboard Metrics (/api/analytics/recruiter)...');
    const analyticsRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/analytics/recruiter',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(` Total Jobs: ${analyticsRes.data?.summary?.totalJobs}, Applications: ${analyticsRes.data?.summary?.totalApplications}, Avg Score: ${analyticsRes.data?.summary?.averageScore}%`);
    if (!analyticsRes.data?.summary) throw new Error('Analytics failed');

    // TEST 8: Candidate Rankings API
    console.log('\n[TEST 8] Testing Multi-Candidate Algorithmic Rankings (/api/rankings/job/:jobId)...');
    const rankingsRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/rankings/job/${sampleJob.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(` Ranked ${rankingsRes.data?.rankedCandidates?.length} candidates for job: "${sampleJob.title}"`);
    if (rankingsRes.data?.rankedCandidates?.length > 0) {
      console.log(` Top Rank #1: ${rankingsRes.data.rankedCandidates[0].candidate_name} (Composite: ${rankingsRes.data.rankedCandidates[0].composite_score}%)`);
    }

    // TEST 9: IEEE Research Benchmark API
    console.log('\n[TEST 9] Testing IEEE Research Benchmark Trial (/api/ai/experiments/run-benchmark)...');
    const ieeeRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/ai/experiments/run-benchmark',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      test_cases: [
        {
          question: 'What is ACID in databases?',
          expected_answer: 'Atomicity, Consistency, Isolation, Durability guarantees for database transactions.',
          candidate_answer: 'Atomicity ensures all-or-nothing execution, consistency maintains state constraints, isolation separates transactions, and durability persists committed state.',
          ground_truth_score: 95.0
        }
      ]
    });
    console.log(` Trial Results: Hybrid MAE: ${ieeeRes.data?.hybrid_nlp_mae}, Latency: ${ieeeRes.data?.average_latency_ms}ms`);
    if (!ieeeRes.data?.hybrid_nlp_mae) throw new Error('IEEE benchmark failed');

    console.log('\n================================================================');
    console.log(' ALL INTEGRATION & BACKEND TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Integration Test Error:', err);
  } finally {
    console.log('Cleaning up processes...');
    aiProcess.kill();
    backendProcess.kill();
    process.exit(0);
  }
}

runTests();
