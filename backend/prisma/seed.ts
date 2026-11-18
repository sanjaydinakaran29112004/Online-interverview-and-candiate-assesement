import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic demonstration recruitment data...');

  // Clean existing tables in proper relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.assessmentReport.deleteMany();
  await prisma.candidateRanking.deleteMany();
  await prisma.skillAssessment.deleteMany();
  await prisma.candidateAssessment.deleteMany();
  await prisma.answerEvaluation.deleteMany();
  await prisma.interviewAnswer.deleteMany();
  await prisma.interviewParticipant.deleteMany();
  await prisma.interviewRecording.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.interviewSlot.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.interviewerProfile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. One Administrator
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@platform.com',
      password: defaultPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // 2. Three Recruiters
  const recruiterData = [
    { email: 'recruiter1@techcorp.com', name: 'Sarah Jenkins', company: 'TechCorp Solutions', dept: 'Engineering Talent' },
    { email: 'recruiter2@cloudscale.io', name: 'David Miller', company: 'CloudScale Systems', dept: 'Infrastructure HR' },
    { email: 'recruiter3@innovate.ai', name: 'Elena Rostova', company: 'Innovate AI Labs', dept: 'Core Research Hiring' }
  ];

  const recruiters = [];
  for (const r of recruiterData) {
    const user = await prisma.user.create({
      data: {
        email: r.email,
        password: defaultPassword,
        name: r.name,
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiterProfile: {
          create: {
            companyName: r.company,
            department: r.dept,
            phone: '+1 555-010-4001'
          }
        }
      },
      include: { recruiterProfile: true }
    });
    recruiters.push(user);
  }

  // 3. Five Interviewers
  const interviewerData = [
    { email: 'interviewer1@techcorp.com', name: 'Dr. Michael Chen', domain: 'Full-Stack & React Architecture' },
    { email: 'interviewer2@techcorp.com', name: 'Amina Al-Mansoor', domain: 'Distributed Systems & Node.js' },
    { email: 'interviewer3@cloudscale.io', name: 'Robert Vance', domain: 'Cloud Infrastructure & DevOps (AWS/K8s)' },
    { email: 'interviewer4@innovate.ai', name: 'Dr. Lisa Patel', domain: 'AI/ML Engineering & NLP' },
    { email: 'interviewer5@innovate.ai', name: 'Carlos Mendez', domain: 'Database Systems & SQL Optimization' }
  ];

  const interviewers = [];
  for (const i of interviewerData) {
    const user = await prisma.user.create({
      data: {
        email: i.email,
        password: defaultPassword,
        name: i.name,
        role: 'INTERVIEWER',
        status: 'ACTIVE',
        interviewerProfile: {
          create: {
            technicalDomain: i.domain,
            yearsOfExperience: 8.0,
            bio: `Senior Technical Interviewer specializing in ${i.domain}.`
          }
        }
      },
      include: { interviewerProfile: true }
    });
    interviewers.push(user);
  }

  // 4. Twenty Candidates
  const candidateNames = [
    'Alice Johnson', 'Bob Smith', 'Catherine Taylor', 'Daniel Lee', 'Emily Brown',
    'Fahim Rahman', 'Grace Hopper', 'Henry Zhang', 'Isabella Garcia', 'James Wilson',
    'Kavita Sharma', 'Liam O\'Connor', 'Mia Tanaka', 'Noah Hernandez', 'Olivia Martin',
    'Priya Nair', 'Quinn Davies', 'Ryan Murphy', 'Sophia Rossi', 'Thomas Wright'
  ];

  const candidates = [];
  for (let idx = 0; idx < candidateNames.length; idx++) {
    const name = candidateNames[idx];
    const email = `candidate${idx + 1}@example.com`;
    const exp = (idx % 6) + 1.5;
    const user = await prisma.user.create({
      data: {
        email,
        password: defaultPassword,
        name,
        role: 'CANDIDATE',
        status: 'ACTIVE',
        candidateProfile: {
          create: {
            phone: `+1 555-020-${1000 + idx}`,
            headline: `${name} | Software Engineer (${exp} yrs exp)`,
            education: idx % 2 === 0 ? 'B.Tech in Computer Science' : 'M.S. in Software Engineering',
            experienceYears: exp,
            technicalSkills: 'React, Node.js, TypeScript, PostgreSQL, Docker, Git',
            githubUrl: `https://github.com/candidate${idx + 1}`,
            linkedinUrl: `https://linkedin.com/in/candidate${idx + 1}`
          }
        }
      },
      include: { candidateProfile: true }
    });
    candidates.push(user);
  }

  // 5. Five Job Openings
  const jobsData = [
    {
      title: 'Senior Full Stack Engineer',
      company: 'TechCorp Solutions',
      recruiterId: recruiters[0].recruiterProfile!.id,
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'FULL_TIME',
      salary: '$140,000 - $175,000',
      description: 'We are seeking an experienced Full Stack Engineer to lead our enterprise SaaS product frontend and backend microservices architecture.',
      skills: [
        { skillName: 'React', weight: 1.5 },
        { skillName: 'Node.js', weight: 1.5 },
        { skillName: 'TypeScript', weight: 1.2 },
        { skillName: 'PostgreSQL', weight: 1.0 },
        { skillName: 'Docker', weight: 0.8 }
      ]
    },
    {
      title: 'Cloud DevOps Architect',
      company: 'CloudScale Systems',
      recruiterId: recruiters[1].recruiterProfile!.id,
      location: 'Remote',
      employmentType: 'FULL_TIME',
      salary: '$150,000 - $185,000',
      description: 'Lead Kubernetes orchestration, multi-region AWS cloud deployments, and CI/CD automation pipelines.',
      skills: [
        { skillName: 'Kubernetes', weight: 1.5 },
        { skillName: 'AWS', weight: 1.5 },
        { skillName: 'Docker', weight: 1.2 },
        { skillName: 'Terraform', weight: 1.0 },
        { skillName: 'CI/CD', weight: 0.8 }
      ]
    },
    {
      title: 'AI/ML NLP Engineer',
      company: 'Innovate AI Labs',
      recruiterId: recruiters[2].recruiterProfile!.id,
      location: 'New York, NY (On-site)',
      employmentType: 'FULL_TIME',
      salary: '$160,000 - $200,000',
      description: 'Develop state-of-the-art NLP pipelines, sentence transformer embeddings, and LLM reasoning workflows for candidate scoring.',
      skills: [
        { skillName: 'Python', weight: 1.5 },
        { skillName: 'FastAPI', weight: 1.2 },
        { skillName: 'Scikit-learn', weight: 1.2 },
        { skillName: 'NLP', weight: 1.5 },
        { skillName: 'PyTorch', weight: 1.0 }
      ]
    },
    {
      title: 'Frontend React Specialist',
      company: 'TechCorp Solutions',
      recruiterId: recruiters[0].recruiterProfile!.id,
      location: 'Austin, TX (Remote)',
      employmentType: 'FULL_TIME',
      salary: '$120,000 - $145,000',
      description: 'Design intuitive, accessible UI/UX components with React 18, Tailwind CSS, and WebRTC streaming.',
      skills: [
        { skillName: 'React', weight: 1.8 },
        { skillName: 'TypeScript', weight: 1.4 },
        { skillName: 'Tailwind CSS', weight: 1.0 },
        { skillName: 'WebRTC', weight: 1.0 }
      ]
    },
    {
      title: 'Backend Systems Engineer',
      company: 'CloudScale Systems',
      recruiterId: recruiters[1].recruiterProfile!.id,
      location: 'Seattle, WA (Hybrid)',
      employmentType: 'FULL_TIME',
      salary: '$135,000 - $165,000',
      description: 'Build high-throughput event-driven microservices using Node.js, Socket.IO, Redis, and PostgreSQL.',
      skills: [
        { skillName: 'Node.js', weight: 1.5 },
        { skillName: 'PostgreSQL', weight: 1.4 },
        { skillName: 'Redis', weight: 1.0 },
        { skillName: 'Socket.io', weight: 1.0 }
      ]
    }
  ];

  const jobs = [];
  for (const jd of jobsData) {
    const job = await prisma.job.create({
      data: {
        title: jd.title,
        companyName: jd.company,
        description: jd.description,
        location: jd.location,
        employmentType: jd.employmentType,
        salaryRange: jd.salary,
        minExperience: 2.0,
        maxExperience: 8.0,
        recruiterId: jd.recruiterId,
        status: 'PUBLISHED',
        skills: {
          create: jd.skills.map(s => ({
            skillName: s.skillName,
            weight: s.weight,
            isRequired: true,
            minimumProficiency: 'INTERMEDIATE'
          }))
        }
      },
      include: { skills: true }
    });
    jobs.push(job);
  }

  // 6. Question Sets & Interview Questions for Job 1 (Senior Full Stack Engineer)
  const qSet = await prisma.questionSet.create({
    data: {
      jobId: jobs[0].id,
      title: 'Full Stack Engineering Evaluation Set',
      description: 'Core evaluation rubric covering React optimization, Node.js concurrency, and SQL ACID transactions.',
      category: 'TECHNICAL',
      targetRole: 'Senior Full Stack Engineer',
      questions: {
        create: [
          {
            title: 'React Hooks and Performance Optimization',
            description: 'How do useMemo, useCallback, and React.memo prevent unnecessary renders? Provide an architectural scenario where overusing them hurts performance.',
            category: 'TECHNICAL',
            difficulty: 'INTERMEDIATE',
            skillEvaluated: 'React',
            expectedConcepts: JSON.stringify([
              'useMemo caches computed values',
              'useCallback memoizes function references',
              'React.memo skips render on unchanged props',
              'Memory and equality check overhead'
            ]),
            evaluationCriteria: 'Measures practical experience with React render cycles, reconciliation, and profiling.',
            maxScore: 100,
            timeLimitSeconds: 180,
            isAiGenerated: true
          },
          {
            title: 'Node.js Event Loop and Non-blocking I/O',
            description: 'Explain how Node.js manages concurrency on a single thread. How does the libuv thread pool handle file I/O versus network sockets?',
            category: 'TECHNICAL',
            difficulty: 'INTERMEDIATE',
            skillEvaluated: 'Node.js',
            expectedConcepts: JSON.stringify([
              'Single main JavaScript thread',
              'libuv event loop phases',
              'Thread pool offloading for blocking OS tasks',
              'Non-blocking async network sockets'
            ]),
            evaluationCriteria: 'Evaluates fundamental backend asynchronous runtime knowledge.',
            maxScore: 100,
            timeLimitSeconds: 180,
            isAiGenerated: true
          },
          {
            title: 'SQL Transactions and ACID Properties',
            description: 'Detail the 4 ACID guarantees and explain isolation levels (Read Committed vs Repeatable Read vs Serializable) with potential concurrency phenomena.',
            category: 'TECHNICAL',
            difficulty: 'INTERMEDIATE',
            skillEvaluated: 'SQL',
            expectedConcepts: JSON.stringify([
              'Atomicity, Consistency, Isolation, Durability',
              'Dirty reads, non-repeatable reads, phantom reads',
              'Multi-version concurrency control (MVCC)',
              'Locking mechanisms'
            ]),
            evaluationCriteria: 'Assesses database transactional integrity and concurrency control skills.',
            maxScore: 100,
            timeLimitSeconds: 180,
            isAiGenerated: true
          }
        ]
      }
    },
    include: { questions: true }
  });

  // 7. Applications for Candidates across Jobs
  const applications = [];
  for (let i = 0; i < 12; i++) {
    const candidate = candidates[i].candidateProfile!;
    const targetJob = jobs[i % jobs.length];

    const app = await prisma.application.create({
      data: {
        jobId: targetJob.id,
        candidateId: candidate.id,
        status: i < 3 ? 'COMPLETED' : i < 6 ? 'SHORTLISTED' : 'APPLIED',
        coverLetter: `I am thrilled to apply for the ${targetJob.title} position at ${targetJob.companyName}. With ${candidate.experienceYears} years of experience building scalable systems, I look forward to contributing.`
      }
    });

    // Add Resume & Resume Analysis
    const resume = await prisma.resume.create({
      data: {
        candidateId: candidate.id,
        fileName: `resume_${candidateNames[i].replace(/\s+/g, '_')}.pdf`,
        originalName: `${candidateNames[i]}_Resume.pdf`,
        fileUrl: `/uploads/sample_resume.pdf`,
        fileSize: 45000,
        mimeType: 'application/pdf',
        extractedText: `Experienced engineer with skills in React, Node.js, TypeScript, and SQL. Education: B.Tech Computer Science.`
      }
    });

    const compatScore = Math.round(75 + (i * 3) % 22);
    await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        applicationId: app.id,
        extractedSkills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'SQL', 'Git']),
        matchedSkills: JSON.stringify(['React', 'Node.js', 'TypeScript']),
        missingSkills: JSON.stringify(['Docker']),
        experienceSummary: `${candidate.experienceYears} years software development.`,
        compatibilityScore: compatScore,
        scoreExplanation: `Demonstrated ${compatScore}% alignment with requisition requirements.`
      }
    });

    applications.push(app);
  }

  // 8. Completed Interview & Assessment for Candidate 1 (Alice Johnson)
  const aliceApp = applications[0];
  const interview1 = await prisma.interview.create({
    data: {
      applicationId: aliceApp.id,
      title: 'Senior Full Stack Technical & Architecture Interview',
      interviewType: 'ONLINE_VIDEO',
      scheduledStartTime: new Date(Date.now() - 86400000), // Yesterday
      scheduledEndTime: new Date(Date.now() - 82800000),
      actualStartTime: new Date(Date.now() - 86400000),
      actualEndTime: new Date(Date.now() - 82800000),
      roomCode: 'room-demo101',
      status: 'COMPLETED',
      participants: {
        create: [
          { userId: candidates[0].id, participantRole: 'CANDIDATE', consentGiven: true },
          { userId: recruiters[0].id, participantRole: 'RECRUITER', consentGiven: true },
          { userId: interviewers[0].id, participantRole: 'INTERVIEWER', consentGiven: true }
        ]
      }
    }
  });

  // Candidate answers with AI 5-metric evaluations
  const qList = qSet.questions;
  const sampleAnswers = [
    {
      q: qList[0],
      text: 'useMemo caches expensive calculations across renders so they only recompute when dependencies change. useCallback memoizes function instances to avoid re-rendering child components wrapped with React.memo. Overusing them adds memory overhead and unnecessary comparison checks.',
      tech: 85, sem: 88, conc: 82, comp: 80, key: 90, final: 85
    },
    {
      q: qList[1],
      text: 'Node.js is single-threaded in its main JavaScript execution context, running an event loop managed by libuv. When blocking system calls or file I/O occur, libuv delegates them to its worker thread pool, while network sockets are handled non-blockingly via epoll/kqueue.',
      tech: 90, sem: 86, conc: 88, comp: 85, key: 90, final: 88
    },
    {
      q: qList[2],
      text: 'ACID guarantees Atomicity (all or nothing), Consistency (valid state transitions), Isolation (independent transactions), and Durability (committed data persists). Isolation levels range from Read Committed to Serializable to prevent dirty and phantom reads.',
      tech: 88, sem: 85, conc: 85, comp: 82, key: 88, final: 86
    }
  ];

  for (const sa of sampleAnswers) {
    await prisma.interviewAnswer.create({
      data: {
        interviewId: interview1.id,
        questionId: sa.q.id,
        candidateAnswerText: sa.text,
        timeTakenSeconds: 140,
        evaluation: {
          create: {
            technicalCorrectness: sa.tech,
            semanticRelevance: sa.sem,
            conceptualUnderstanding: sa.conc,
            completeness: sa.comp,
            keywordCoverage: sa.key,
            finalScore: sa.final,
            strengthsFeedback: 'Accurate technical terminology and clear understanding of core architecture.',
            missingConcepts: 'None. Answer covered all primary criteria.',
            improvementAreas: 'Could provide a real-world code snippet or edge case example.',
            modelUsed: 'ScikitLearn-NLP-Rubric-v1'
          }
        }
      }
    });
  }

  // Candidate Assessment & Skill Breakdown
  const assessment1 = await prisma.candidateAssessment.create({
    data: {
      candidateId: candidates[0].candidateProfile!.id,
      applicationId: aliceApp.id,
      technicalScore: 86,
      interviewScore: 87,
      resumeScore: 88,
      overallScore: 87,
      strengthsSummary: 'Outstanding grasp of React reconciliation and Node.js event-driven runtime.',
      weaknessesSummary: 'Continue refining distributed systems scaling experience.',
      status: 'COMPLETED'
    }
  });

  const skillsToScore = [
    { name: 'React', score: 85 },
    { name: 'Node.js', score: 88 },
    { name: 'SQL', score: 86 },
    { name: 'TypeScript', score: 82 },
    { name: 'Problem Solving', score: 90 }
  ];

  for (const sk of skillsToScore) {
    await prisma.skillAssessment.create({
      data: {
        candidateId: candidates[0].candidateProfile!.id,
        assessmentId: assessment1.id,
        skillName: sk.name,
        score: sk.score,
        level: 'ADVANCED'
      }
    });
  }

  // Candidate Ranking for Job 1
  await prisma.candidateRanking.create({
    data: {
      jobId: jobs[0].id,
      candidateId: candidates[0].candidateProfile!.id,
      overallRank: 1,
      compositeScore: 87.2,
      skillMatchScore: 88.0,
      interviewScore: 87.0,
      experienceScore: 85.0,
      rankExplanation: 'Rank 1 candidate with balanced excellence across technical test, live interview, and resume alignment.'
    }
  });

  // Assessment Report
  await prisma.assessmentReport.create({
    data: {
      interviewId: interview1.id,
      assessmentId: assessment1.id,
      recruiterRecommendation: 'STRONG_HIRE',
      finalStatus: 'FINALIZED',
      reportData: JSON.stringify({
        candidateName: 'Alice Johnson',
        candidateEmail: 'candidate1@example.com',
        jobTitle: 'Senior Full Stack Engineer',
        companyName: 'TechCorp Solutions',
        interviewDate: new Date().toLocaleDateString(),
        overallScore: 87,
        technicalScore: 86,
        interviewScore: 87,
        resumeScore: 88,
        skills: skillsToScore,
        answers: sampleAnswers.map(sa => ({
          questionTitle: sa.q.title,
          score: sa.final,
          answerText: sa.text,
          strengths: 'Accurate technical terminology and clear understanding of core architecture.',
          improvements: 'Could provide a real-world code snippet or edge case example.'
        })),
        recommendation: 'STRONG_HIRE',
        summaryFeedback: 'Candidate evaluated with overall score 87/100 across 5 rubric dimensions.'
      })
    }
  });

  // Upcoming scheduled interview for Candidate 2 (Bob Smith)
  await prisma.interview.create({
    data: {
      applicationId: applications[1].id,
      title: 'Cloud Infrastructure Technical Screen',
      interviewType: 'ONLINE_VIDEO',
      scheduledStartTime: new Date(Date.now() + 86400000), // Tomorrow
      scheduledEndTime: new Date(Date.now() + 90000000),
      roomCode: 'room-demo102',
      status: 'CONFIRMED',
      participants: {
        create: [
          { userId: candidates[1].id, participantRole: 'CANDIDATE', consentGiven: false },
          { userId: recruiters[1].id, participantRole: 'RECRUITER', consentGiven: true },
          { userId: interviewers[2].id, participantRole: 'INTERVIEWER', consentGiven: true }
        ]
      }
    }
  });

  // System Notifications
  await prisma.notification.create({
    data: {
      userId: candidates[0].id,
      title: 'Assessment Report Ready',
      message: 'Your interview evaluation report for Senior Full Stack Engineer has been finalized.',
      type: 'INFO',
      link: '/candidate/assessments'
    }
  });

  await prisma.notification.create({
    data: {
      userId: recruiters[0].id,
      title: 'New Candidate Ranked #1',
      message: 'Alice Johnson ranked #1 for Senior Full Stack Engineer with composite score 87.2%.',
      type: 'SUCCESS',
      link: `/recruiter/rankings?jobId=${jobs[0].id}`
    }
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'Platform',
      details: 'Platform initialized with full schema and demonstration datasets.'
    }
  });

  console.log('Seeding completed successfully!');
  console.log('-------------------------------------------------------');
  console.log('DEMO ACCOUNTS (Password for all: Password123!)');
  console.log('Admin:       admin@platform.com');
  console.log('Recruiter:   recruiter1@techcorp.com');
  console.log('Interviewer: interviewer1@techcorp.com');
  console.log('Candidate:   candidate1@example.com');
  console.log('-------------------------------------------------------');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
