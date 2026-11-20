import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { interviewsAPI, assessmentAPI, questionsAPI } from '../../services/api';
import { Interview, InterviewQuestion, AnswerEvaluation } from '../../types';
import { RTC_CONFIGURATION } from '../../utils/webrtcConfig';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Send,
  HelpCircle,
  Award,
  Sparkles,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Users,
  ChevronRight,
  Maximize2,
  ArrowRight,
  FileText,
  Check,
  X,
  BookOpen,
  Search,
  Plus,
  Filter,
  Volume2
} from 'lucide-react';

const DEFAULT_QUESTION_BANK: InterviewQuestion[] = [
  {
    id: 'bank-1',
    title: 'HTML & Semantic Web Page Structure',
    description: 'What is HTML and what are semantic tags (such as <header>, <nav>, <main>, <footer>, <section>)? Why is it better to use semantic tags instead of using only <div> tags for everything?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'HTML5',
    expectedConcepts: ['Semantic tags give clear meaning to structure', 'Accessibility for screen readers', 'SEO optimization and cleaner code', 'Standard structure: header, nav, main, footer'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-2',
    title: 'CSS Box Model & Centering Elements',
    description: 'Explain the CSS Box Model (margin, border, padding, and content). How do you center a card or text horizontally and vertically using CSS Flexbox (display: flex)?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'CSS3',
    expectedConcepts: ['Box model parts: content, padding, border, margin', 'display: flex on parent container', 'justify-content: center for horizontal', 'align-items: center for vertical'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-3',
    title: 'JavaScript Fundamentals: var, let, and const',
    description: 'What are the main differences between var, let, and const in JavaScript? Which one should you use by default in modern development, and how does block scoping work?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'JavaScript',
    expectedConcepts: ['var is function-scoped and hoisted', 'let and const are block-scoped', 'const cannot be reassigned; let allows reassignment', 'Modern practice: use const by default'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-4',
    title: 'JavaScript Array Methods: map() and filter()',
    description: 'Explain common JavaScript array methods such as map() and filter(). Give a simple practical example of how you would use filter() to select numbers greater than 10 from an array.',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'JavaScript',
    expectedConcepts: ['map transforms each item and returns a new array', 'filter returns elements that pass a true condition', 'Array immutability', 'Example: numbers.filter(n => n > 10)'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-5',
    title: 'React Fundamentals: Components & Props',
    description: 'What is a component in React? How do props work to pass data from a parent component down to a child component, and are props read-only or mutable?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'React',
    expectedConcepts: ['Components are reusable UI building blocks returning JSX', 'Props are inputs passed from parent to child', 'Props are read-only (immutable for the child)', 'Dynamic component reusability'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-6',
    title: 'React State Management with useState Hook',
    description: 'What is state in React, and how do you use the useState hook? What is the difference between state and regular variables, and how does updating state re-render the screen?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'React',
    expectedConcepts: ['State holds dynamic data that changes over time', 'const [count, setCount] = useState(0)', 'Calling setter function triggers component re-render', 'Variables reset on each render'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-7',
    title: 'Web & API Basics: HTTP GET vs POST Methods',
    description: 'What is a REST API? Explain the difference between an HTTP GET request and an HTTP POST request with practical examples (such as viewing a user profile vs submitting a registration form).',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'Web APIs',
    expectedConcepts: ['GET fetches data without modifying the server', 'POST sends data in body to create a new resource', 'Common status codes: 200 OK, 201 Created, 404 Not Found', 'JSON data communication format'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-8',
    title: 'Database Basics: Tables, Columns & Primary Keys',
    description: 'In a relational database (like SQL), what is a table, row, and column? What is a Primary Key and why is it essential for uniquely identifying each record in a table?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'SQL / Databases',
    expectedConcepts: ['Tables store structured records with rows and columns', 'Primary key uniquely identifies each record', 'Primary keys cannot be NULL and must be unique', 'Enables fast lookups and table links'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-9',
    title: 'Basic Problem Solving: String Reversal / Even-Odd Logic',
    description: 'How would you write a simple JavaScript function to reverse a string (for example, converting "hello" to "olleh"), or determine whether a given number is even or odd?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'Problem Solving',
    expectedConcepts: ['Even-odd check using modulo operator: num % 2 === 0', 'String reversal via loop or str.split("").reverse().join("")', 'Handling edge cases like empty string', 'Clean readable function with return value'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  },
  {
    id: 'bank-10',
    title: 'Web Debugging: Using Browser Developer Tools',
    description: 'When a button or feature on a webpage does not work, what step-by-step approach do you take using browser developer tools (Inspect Element, Console, Network tab) to find and fix the issue?',
    category: 'TECHNICAL',
    difficulty: 'EASY',
    skillEvaluated: 'Debugging',
    expectedConcepts: ['Opening Inspect Element / DevTools (F12)', 'Checking Console tab for JavaScript runtime errors', 'Checking Network tab for failed API calls (404/500)', 'Using console.log() to inspect variable values'],
    maxScore: 100,
    timeLimitSeconds: 180,
    isAiGenerated: true
  }
];

export const VideoInterviewRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  // WebRTC & Media States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState('Remote Participant');
  const [remotePeerRole, setRemotePeerRole] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'PEER_CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [recordingConsent, setRecordingConsent] = useState(false);

  // Timing Window State (5 minutes prior to scheduled start)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [secondsUntilOpen, setSecondsUntilOpen] = useState<number | null>(null);

  // Questions & Answers
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [pushedQuestion, setPushedQuestion] = useState<InterviewQuestion | null>(null);
  const [swappedVideoView, setSwappedVideoView] = useState(false);
  const [candidateAnswerText, setCandidateAnswerText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);

  // AI Question Bank Modal & Sync States
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [questionBank, setQuestionBank] = useState<InterviewQuestion[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankCategoryFilter, setBankCategoryFilter] = useState('ALL');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [pushedAlert, setPushedAlert] = useState<string | null>(null);
  const [showCustomQuestionForm, setShowCustomQuestionForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('INTERMEDIATE');
  const [customCategory, setCustomCategory] = useState('TECHNICAL');

  // Manual Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideScoreVal, setOverrideScoreVal] = useState('85');
  const [overrideReasonVal, setOverrideReasonVal] = useState('Candidate demonstrated strong architectural depth verbally.');

  // Conclude Interview & 3-Way Marks Submission Modal
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [technicalScoreVal, setTechnicalScoreVal] = useState(80);
  const [communicationScoreVal, setCommunicationScoreVal] = useState(85);
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [strengthsObserved, setStrengthsObserved] = useState('');
  const [improvementAreas, setImprovementAreas] = useState('');
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
  const [sessionConcludedData, setSessionConcludedData] = useState<any | null>(null);

  // Live Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'RECRUITER' || user?.role === 'INTERVIEWER';
  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== 'undefined' &&
     window.location.hostname !== 'localhost' &&
     window.location.hostname !== '127.0.0.1'
      ? window.location.origin
      : 'http://localhost:5000');

  // 1. Fetch Interview Room Data
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomCode) return;
      try {
        const res = await interviewsAPI.getByRoom(roomCode);
        if (res.data.success) {
          const inv = res.data.interview;
          setInterview(inv);
          const qList = inv.application?.job?.questionSets?.[0]?.questions || [];
          setQuestions(qList);

          if (inv.answers?.length > 0) {
            setEvaluationHistory(inv.answers);
            const latestAnswer = inv.answers[inv.answers.length - 1];
            if (latestAnswer?.candidateAnswerText) {
              setCandidateAnswerText(latestAnswer.candidateAnswerText);
            }
            if (latestAnswer?.evaluation) {
              setCurrentEvaluation(latestAnswer.evaluation);
            }
          } else {
            const localDraft = localStorage.getItem(`draft_ans_${roomCode}`);
            if (localDraft) {
              setCandidateAnswerText(localDraft);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load room:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomCode]);

  // Timing Window Check (Room unlocks 5 minutes before scheduled start)
  useEffect(() => {
    if (!interview || interview.status === 'COMPLETED') {
      setSecondsUntilOpen(null);
      return;
    }

    const checkTiming = () => {
      const start = new Date(interview.scheduledStartTime).getTime();
      const allowedTime = start - 5 * 60 * 1000;
      const diffSec = Math.floor((allowedTime - Date.now()) / 1000);
      if (diffSec > 0) {
        setSecondsUntilOpen(diffSec);
      } else {
        setSecondsUntilOpen(null);
      }
    };

    checkTiming();
    const interval = setInterval(checkTiming, 1000);
    return () => clearInterval(interval);
  }, [interview]);

  // WebRTC Peer Connection Factory
  const createPeerConnectionInstance = (targetSocketId: string, stream: MediaStream, socket: Socket): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionRef.current = pc;
    remoteSocketIdRef.current = targetSocketId;

    // Attach local audio and video tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote media track arrival (audio & video)
    pc.ontrack = event => {
      console.log('[WebRTC] Remote stream received from peer:', event.streams, event.track);
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          let remoteStream = remoteVideoRef.current.srcObject as MediaStream;
          if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideoRef.current.srcObject = remoteStream;
          }
          remoteStream.addTrack(event.track);
        }
        remoteVideoRef.current.play().then(() => {
          setAudioAutoplayBlocked(false);
        }).catch(e => {
          console.warn('[WebRTC] Remote audio/video play blocked by browser autoplay policy:', e);
          setAudioAutoplayBlocked(true);
        });
        setHasRemoteStream(true);
        setConnectionStatus('PEER_CONNECTED');
      }
    };

    // Handle local ICE candidates and dispatch to target socket
    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC State Changed]:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('PEER_CONNECTED');
        setHasRemoteStream(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionStatus('CONNECTED');
        setHasRemoteStream(false);
      }
    };

    return pc;
  };

  // 2. Initialize Media Devices & Complete WebRTC Signaling Handshake
  useEffect(() => {
    const isRoomConcluded = interview?.status === 'COMPLETED';
    if (!interview || secondsUntilOpen !== null || isRoomConcluded) {
      return;
    }

    let isCancelled = false;
    let stream: MediaStream | null = null;
    let socket: Socket | null = null;

    const initMediaAndSignaling = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Microphone access not granted or unavailable:', err);
      }

      // Initialize Socket.IO connection
      socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnectionStatus('CONNECTED');
        socket?.emit('join-room', {
          roomCode,
          userId: user?.id || 'guest',
          userName: user?.name || 'Participant',
          role: user?.role || 'CANDIDATE'
        });
      });

      // Peer joined -> Initiator creates WebRTC Offer
      socket.on('user-joined', async data => {
        console.log('[Socket] Remote user joined room:', data.userName, data.socketId);
        setRemotePeerName(data.userName);
        setRemotePeerRole(data.role);

        if (localStreamRef.current && socket) {
          try {
            const pc = createPeerConnectionInstance(data.socketId, localStreamRef.current, socket);
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await pc.setLocalDescription(offer);
            socket.emit('offer', { targetSocketId: data.socketId, sdp: offer });
          } catch (offerErr) {
            console.error('[WebRTC] Error creating offer:', offerErr);
          }
        }
      });

      // Existing room users broadcast
      socket.on('room-users', data => {
        const others = (data.participants || []).filter((p: any) => p.userId !== user?.id);
        if (others.length > 0) {
          setRemotePeerName(others[0].userName);
          setRemotePeerRole(others[0].role);
        }
      });

      // Callee receives WebRTC Offer -> creates WebRTC Answer
      socket.on('offer', async ({ senderSocketId, sdp }) => {
        console.log('[Socket] Received WebRTC offer from:', senderSocketId);
        if (localStreamRef.current && socket) {
          try {
            const pc = createPeerConnectionInstance(senderSocketId, localStreamRef.current, socket);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // Drain any pending ICE candidates
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { targetSocketId: senderSocketId, sdp: answer });
          } catch (answerErr) {
            console.error('[WebRTC] Error responding to offer with answer:', answerErr);
          }
        }
      });

      // Caller receives WebRTC Answer
      socket.on('answer', async ({ senderSocketId, sdp }) => {
        console.log('[Socket] Received WebRTC answer from:', senderSocketId);
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            // Drain any pending candidates
            while (pendingCandidatesRef.current.length > 0) {
              const candidate = pendingCandidatesRef.current.shift();
              if (candidate) await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (setRemoteErr) {
            console.error('[WebRTC] Error setting remote description for answer:', setRemoteErr);
          }
        }
      });

      // ICE Candidate exchange
      socket.on('ice-candidate', async ({ candidate }) => {
        if (!candidate) return;
        try {
          if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (iceErr) {
          console.warn('[WebRTC] Error adding ICE candidate:', iceErr);
        }
      });

      // Remote User Left
      socket.on('user-left', data => {
        console.log('[Socket] User left room:', data);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setHasRemoteStream(false);
        setConnectionStatus('CONNECTED');
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });

      // In-Room Chat message
      socket.on('chat-message', (msg: any) => {
        setChatMessages(prev => {
          if (msg.id && prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      // Synchronized question change
      socket.on('active-question-changed', (data: any) => {
        if (data?.question) {
          setPushedQuestion(data.question);
          setQuestions(prev => {
            const foundIdx = prev.findIndex(q => q.id === data.question.id || q.title === data.question.title);
            if (foundIdx !== -1) {
              setActiveQuestionIndex(foundIdx);
              return prev;
            }
            const next = [...prev, data.question];
            setActiveQuestionIndex(next.length - 1);
            return next;
          });
          setCandidateAnswerText('');
          setCurrentEvaluation(null);
          setPushedAlert(`🔔 Live Question: "${data.question.title}"`);
          setTimeout(() => setPushedAlert(null), 6000);
        }
      });

      // Synchronized live candidate answer update
      socket.on('candidate-answer-updated', (data: any) => {
        setCandidateAnswerText(data.answerText || '');
        if (roomCode) {
          localStorage.setItem(`draft_ans_${roomCode}`, data.answerText || '');
        }
        if (data.isFinalSubmit) {
          setPushedAlert(`Candidate (${data.candidateName || 'Candidate'}) submitted their final answer! Ready for AI evaluation.`);
          setTimeout(() => setPushedAlert(null), 6000);
        }
      });

      // Restore previously submitted candidate answer if interviewer reconnects
      socket.on('latest-candidate-answer', (data: any) => {
        if (data?.answerText) {
          console.log('[Socket] Restoring candidate submitted answer to room:', data.answerText);
          setCandidateAnswerText(data.answerText);
          if (roomCode) {
            localStorage.setItem(`draft_ans_${roomCode}`, data.answerText);
          }
          if (data.isFinalSubmit) {
            setPushedAlert(`Restored Candidate's submitted answer! Ready for AI evaluation.`);
            setTimeout(() => setPushedAlert(null), 5000);
          }
        }
      });

      // Session officially concluded by evaluator
      socket.on('session-concluded', (data: any) => {
        console.log('[Socket] Interview session concluded by evaluator:', data);
        setSessionConcludedData(data);
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });
    };

    initMediaAndSignaling();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomCode, user, interview, secondsUntilOpen]);

  // Session Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
      } catch (err) {
        console.error('Screen sharing cancelled:', err);
      }
    } else {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    }
  };

  // Fetch Question Bank from DB or fallback catalog
  const fetchQuestionBank = async () => {
    setLoadingBank(true);
    try {
      const res = await questionsAPI.getAll();
      if (res.data?.success && res.data.questions?.length > 0) {
        setQuestionBank(res.data.questions);
      } else {
        setQuestionBank(DEFAULT_QUESTION_BANK);
      }
    } catch (err) {
      console.warn('Failed to load DB question bank, using default catalog:', err);
      setQuestionBank(DEFAULT_QUESTION_BANK);
    } finally {
      setLoadingBank(false);
    }
  };

  // Push Question to Candidate Screen (Interviewer control)
  const handlePushQuestion = (qToPush?: InterviewQuestion) => {
    const targetQ = qToPush || pushedQuestion || questions[activeQuestionIndex] || DEFAULT_QUESTION_BANK[0];
    if (!socketRef.current || !roomCode || !targetQ) return;

    socketRef.current.emit('push-question', {
      roomCode,
      question: targetQ
    });

    setPushedQuestion(targetQ);
    setQuestions(prev => {
      const foundIdx = prev.findIndex(q => q.id === targetQ.id || q.title === targetQ.title);
      if (foundIdx !== -1) {
        setActiveQuestionIndex(foundIdx);
        return prev;
      }
      const updated = [...prev, targetQ];
      setActiveQuestionIndex(updated.length - 1);
      return updated;
    });

    setCurrentEvaluation(null);
    setCandidateAnswerText('');
    setShowQuestionBankModal(false);
    setPushedAlert(`Question "${targetQ.title}" successfully pushed to candidate's screen!`);
    setTimeout(() => setPushedAlert(null), 5000);
  };

  // Real-time answer synchronization from candidate
  const handleAnswerTextChange = (text: string) => {
    setCandidateAnswerText(text);
    if (roomCode) {
      localStorage.setItem(`draft_ans_${roomCode}`, text);
    }
    if (user?.role === 'CANDIDATE' && socketRef.current) {
      socketRef.current.emit('candidate-answer-sync', {
        roomCode,
        answerText: text,
        candidateName: user?.name || 'Candidate',
        isFinalSubmit: false
      });
    }
  };

  // Candidate Submits Answer to Interviewer
  const handleCandidateSubmitToInterviewer = () => {
    if (!candidateAnswerText.trim()) {
      alert('Please write your technical explanation before submitting.');
      return;
    }
    if (roomCode) {
      localStorage.setItem(`draft_ans_${roomCode}`, candidateAnswerText);
    }
    if (socketRef.current) {
      socketRef.current.emit('candidate-answer-sync', {
        roomCode,
        answerText: candidateAnswerText,
        candidateName: user?.name || 'Candidate',
        isFinalSubmit: true
      });
    }
    setPushedAlert('Your explanation was submitted to the technical interviewer!');
    setTimeout(() => setPushedAlert(null), 5000);
  };

  // Create custom question and push live
  const handleCreateAndPushCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDesc.trim()) {
      alert('Please provide question title and description.');
      return;
    }

    const newQ: InterviewQuestion = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      description: customDesc.trim(),
      category: customCategory,
      difficulty: customDifficulty,
      skillEvaluated: customSkill.trim() || 'General Technical',
      expectedConcepts: [
        `${customSkill || 'Technical'} fundamentals and execution`,
        'System trade-offs, architecture, and edge cases',
        'Correctness and production resilience'
      ],
      maxScore: 100,
      timeLimitSeconds: 180,
      isAiGenerated: false
    };

    try {
      await questionsAPI.createCustom(newQ);
    } catch (err) {
      console.warn('Custom question not persisted to DB, using local instance:', err);
    }

    handlePushQuestion(newQ);
    setCustomTitle('');
    setCustomDesc('');
    setCustomSkill('');
    setShowCustomQuestionForm(false);
  };

  // Next Question trigger
  const handleNextQuestion = () => {
    const nextIdx = activeQuestionIndex + 1;
    let nextQ: InterviewQuestion | null = null;
    if (nextIdx < questions.length) {
      nextQ = questions[nextIdx];
    } else if (DEFAULT_QUESTION_BANK.length > 0) {
      nextQ = DEFAULT_QUESTION_BANK.find(dq => !questions.some(q => q.title === dq.title)) || DEFAULT_QUESTION_BANK[0];
    }
    if (nextQ) {
      handlePushQuestion(nextQ);
    }
  };

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    const activeQ = pushedQuestion;
    if (!activeQ || !interview) return;
    if (!candidateAnswerText.trim()) {
      alert('Answer text is empty. Enter or wait for candidate explanation before AI evaluation.');
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await assessmentAPI.evaluateAnswer({
        interviewId: interview.id,
        questionId: activeQ.id,
        candidateAnswerText,
        timeTakenSeconds: 120
      });

      if (res.data.success) {
        const evalData = res.data.evaluation;
        setCurrentEvaluation(evalData);
        setEvaluationHistory(prev => [...prev, res.data.answer]);
      }
    } catch (err: any) {
      console.error('Answer evaluation failed:', err);
      alert(err.response?.data?.message || 'Answer evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Manual Score Calibration
  const handleSaveOverride = async () => {
    if (!currentEvaluation) return;
    try {
      const answerId = evaluationHistory[evaluationHistory.length - 1]?.id || currentEvaluation.id;
      await assessmentAPI.overrideScore(answerId, {
        overriddenScore: parseFloat(overrideScoreVal),
        overrideReason: overrideReasonVal
      });
      setCurrentEvaluation(prev => prev ? {
        ...prev,
        finalScore: parseFloat(overrideScoreVal),
        humanOverrideScore: parseFloat(overrideScoreVal),
        overrideReason: overrideReasonVal
      } : null);
      setShowOverrideModal(false);
    } catch (err) {
      console.error('Failed to override score:', err);
    }
  };

  // Send In-Room Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    const msgId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    socketRef.current.emit('chat-message', {
      id: msgId,
      roomCode,
      message: chatInput.trim(),
      senderName: user?.name || 'Participant',
      senderRole: user?.role || 'CANDIDATE'
    });
    setChatInput('');
  };

  // Candidate leaves interview session
  const handleCandidateLeave = () => {
    if (window.confirm('Are you sure you want to leave this video interview session?')) {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomCode, userId: user?.id });
        socketRef.current.disconnect();
      }
      navigate('/candidate/interviews');
    }
  };

  // Evaluator submits 3-way scores & feedback to Admin & Recruiter
  const handleSubmitEvaluation = async () => {
    if (!interview) return;
    setSubmittingEvaluation(true);
    try {
      const computedAi = evaluationHistory.length > 0
        ? Math.round(
            evaluationHistory.reduce((sum, a) => sum + (a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0), 0) /
            evaluationHistory.length
          )
        : 85;

      if (socketRef.current) {
        socketRef.current.emit('conclude-session', {
          roomCode,
          aiScore: computedAi,
          technicalScore: technicalScoreVal,
          communicationScore: communicationScoreVal,
          notes: evaluatorNotes
        });
      }

      await assessmentAPI.finalize({
        interviewId: interview.id,
        aiScore: computedAi,
        technicalScore: technicalScoreVal,
        communicationScore: communicationScoreVal,
        notes: evaluatorNotes,
        strengths: strengthsObserved,
        improvements: improvementAreas
      });

      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomCode, userId: user?.id });
        socketRef.current.disconnect();
      }

      setShowConcludeModal(false);

      if (user?.role === 'ADMIN') {
        navigate('/admin/evaluations');
      } else if (user?.role === 'RECRUITER') {
        navigate('/recruiter/evaluations');
      } else {
        navigate('/recruiter/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to submit assessment evaluation:', err);
      alert(err.response?.data?.message || 'Failed to submit evaluation to Admin & Recruiter.');
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const isCompleted = interview?.status === 'COMPLETED';
  const isConcluded = isCompleted;

  // Session Concluded Screen (Prevents re-entering completed interview rooms)
  if (interview && isConcluded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Interview Session Concluded</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Session Officially Concluded
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This WebRTC technical interview session has finished. Answer submissions, AI scoring benchmarks, and evaluator feedback have been recorded.
            </p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Position / Session</span>
              <span className="font-bold text-white text-right truncate max-w-[200px]">{interview.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Company</span>
              <span className="font-semibold text-slate-300">{interview.application?.job?.companyName || 'Enterprise Tech'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Scheduled Time</span>
              <span className="font-semibold text-slate-300">
                {new Date(interview.scheduledStartTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} &bull;{' '}
                {new Date(interview.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Room Status</span>
              <span className="font-bold text-emerald-400 uppercase">
                {interview.status === 'COMPLETED' ? 'COMPLETED & FINALIZED' : 'SESSION ENDED'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {user?.role === 'CANDIDATE' ? (
              <>
                <Link
                  to="/candidate/assessments"
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
                >
                  <Award className="w-4 h-4" />
                  <span>View Official Assessment Report</span>
                </Link>
                <Link
                  to="/candidate/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Return to Candidate Dashboard</span>
                </Link>
              </>
            ) : user?.role === 'ADMIN' ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Return to Administrator Hub</span>
                </Link>
                <Link
                  to="/recruiter/rankings"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <span>View Candidate Rankings & Rubrics</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/recruiter/applications"
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Review Candidate Pipeline Stage</span>
                </Link>
                <Link
                  to="/recruiter/rankings"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <span>Open Algorithmic Candidate Rankings</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Countdown Waiting Room (5 minutes pre-room gate)
  if (secondsUntilOpen !== null && secondsUntilOpen > 0) {
    const scheduledStart = interview ? new Date(interview.scheduledStartTime) : new Date();
    const allowedTime = new Date(scheduledStart.getTime() - 5 * 60 * 1000);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold mb-3 border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Session Opens 5 Minutes Before Start Time</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Interview Room Not Open Yet
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Security & assessment policy: candidates and evaluators can enter this live video room starting <strong>5 minutes prior</strong> to the scheduled start.
            </p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Interview Title</span>
              <span className="font-bold text-white text-right truncate max-w-[200px]">{interview?.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Scheduled Start</span>
              <span className="font-semibold text-indigo-300">
                {scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({scheduledStart.toLocaleDateString()})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Room Window Opens</span>
              <span className="font-bold text-emerald-400">
                {allowedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Room Opens In
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-400 tracking-wider">
                {formatCountdown(secondsUntilOpen)}
              </div>
            </div>

            {/* Preparation Tips */}
            <div className="pt-3 border-t border-slate-800/60 text-left text-[11px] text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-300">Quick Preparation Guidelines:</div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Camera and microphone permissions will be requested on room entrance.</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Keep your workspace quiet with stable internet.</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>The video room unlocks automatically once the timer reaches 00:00.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (user?.role === 'CANDIDATE') navigate('/candidate/interviews');
                else navigate('/recruiter/interviews');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
            >
              Back to My Sessions
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-950"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQuestion = pushedQuestion;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-900">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate max-w-sm sm:max-w-md">
              {interview?.title || 'Video Interview Room'}
            </h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="font-mono text-indigo-400">{roomCode}</span>
              <span>&bull;</span>
              <span className="flex items-center text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                {connectionStatus === 'PEER_CONNECTED' ? 'PEER CONNECTED (LIVE)' : connectionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl text-xs font-mono text-indigo-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={isStaff ? () => setShowConcludeModal(true) : handleCandidateLeave}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-rose-950"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{user?.role === 'CANDIDATE' ? 'Leave Session' : 'End Session'}</span>
          </button>
        </div>
      </header>

      {/* Main Room Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-6 w-full">
        {/* Left Column: Live Video Feeds & Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Main Stage & Corner Picture-in-Picture Video Layout */}
          <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex-1 min-h-[380px] sm:min-h-[460px] flex items-center justify-center">
            {/* View Mode Swap Button */}
            <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSwappedVideoView(!swappedVideoView)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md text-xs font-semibold shadow-lg transition flex items-center space-x-1.5"
                title="Swap main stage and corner views"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{swappedVideoView ? 'Reset Spotlight' : 'Swap Views'}</span>
              </button>
            </div>

            {/* MAIN STAGE (By default: Remote Peer Video is LARGE) */}
            <div className="w-full h-full absolute inset-0 flex items-center justify-center">
              {!swappedVideoView ? (
                /* Remote Peer as Main Stage (Candidate for Interviewer, Interviewer for Candidate) */
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
                  />
                  {audioAutoplayBlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.play().then(() => setAudioAutoplayBlocked(false)).catch(() => {});
                        }
                      }}
                      className="absolute top-4 left-4 z-30 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 animate-bounce"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Click to Unmute / Hear Peer</span>
                    </button>
                  )}
                  {!hasRemoteStream && (
                    <div className="text-center text-slate-500 text-xs p-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                        <Video className="w-7 h-7 animate-pulse text-indigo-500" />
                      </div>
                      <div className="font-bold text-slate-200 text-sm">
                        Waiting for {isStaff ? 'Candidate' : 'Technical Interviewer'} video feed...
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        When the {isStaff ? 'candidate' : 'technical interviewer'} joins room ({roomCode}), live peer-to-peer video will stream automatically.
                      </p>
                    </div>
                  )}
                  {/* Remote Participant Name Badge */}
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-slate-700/80 flex items-center space-x-2 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{remotePeerName}</span>
                    {remotePeerRole && (
                      <span className="text-indigo-400 font-mono text-[11px] uppercase">
                        ({remotePeerRole})
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Local Self as Main Stage (When swapped) */
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
                  />
                  {isVideoOff && (
                    <div className="text-center text-slate-500 text-xs">
                      <VideoOff className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                      <span className="font-bold">Your Camera is Disabled</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-slate-700/80 flex items-center space-x-2 shadow-md">
                    <span>You ({user?.name || 'Local Participant'})</span>
                    {isMuted && <span className="text-rose-400 font-mono">(Muted)</span>}
                  </div>
                </div>
              )}
            </div>

            {/* CORNER PICTURE-IN-PICTURE (PIP) (By default: Self Camera is SMALL) */}
            <div
              onClick={() => setSwappedVideoView(!swappedVideoView)}
              className="absolute bottom-4 right-4 z-20 w-44 sm:w-56 aspect-video bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl transition hover:scale-105 hover:border-indigo-500 cursor-pointer group"
              title="Click to swap with main stage"
            >
              {swappedVideoView ? (
                /* Remote Peer in PIP */
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
                  />
                  {!hasRemoteStream && (
                    <div className="text-center text-slate-500 text-[10px] p-2">
                      <Video className="w-4 h-4 mx-auto mb-0.5 text-indigo-400 animate-pulse" />
                      <span>Peer Connecting</span>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 bg-slate-950/80 rounded text-[9px] font-bold text-white truncate max-w-[85%]">
                    {remotePeerName}
                  </div>
                </div>
              ) : (
                /* Local Self in PIP */
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
                  />
                  {isVideoOff && (
                    <div className="text-center text-slate-500 text-[10px]">
                      <VideoOff className="w-4 h-4 mx-auto mb-0.5 text-slate-600" />
                      <span>Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 bg-slate-950/80 rounded text-[9px] font-bold text-white flex items-center space-x-1 truncate max-w-[85%]">
                    <span>You</span>
                    {isMuted && <span className="text-rose-400 font-mono">(Muted)</span>}
                  </div>
                </div>
              )}

              {/* Hover overlay swap icon */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition p-1 bg-black/60 rounded-md text-white text-[10px]">
                <Maximize2 className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Media Control Toolbar */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex items-center justify-center space-x-4 shadow-xl">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-2xl transition flex items-center space-x-1.5 font-bold text-xs ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Microphone"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition flex items-center space-x-1.5 font-bold text-xs ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Camera"
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              <span>{isVideoOff ? 'Camera Off' : 'Camera'}</span>
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition flex items-center space-x-1.5 font-bold text-xs ${
                isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
              <span>{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Face-to-Face Question & AI Assessment Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Synchronized Question Card */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            {/* Live Notification Banner */}
            {pushedAlert && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pushedAlert}</span>
                </div>
                <button onClick={() => setPushedAlert(null)} className="text-emerald-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!activeQuestion ? (
              /* EMPTY STARTING STATE */
              isStaff ? (
                /* Interviewer: Choose and Push a Question */
                <div className="text-center py-10 px-4 space-y-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-extrabold text-base">No Question Active on Screen</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Questions are empty by default. Select a beginner-friendly question from the Question Bank or create a custom question, then click <strong>&quot;Push Question&quot;</strong> to show it live to both screens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      fetchQuestionBank();
                      setShowQuestionBankModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition inline-flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Choose & Push Question to Candidate</span>
                  </button>
                </div>
              ) : (
                /* Candidate: Waiting for interviewer to push question */
                <div className="text-center py-12 px-4 space-y-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-extrabold text-base">Waiting for Technical Question</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Your technical interviewer is preparing the session. The question prompt and answer input box will appear here live as soon as the interviewer pushes it.
                    </p>
                  </div>
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live Video Connected &bull; Ready for Evaluation</span>
                  </div>
                </div>
              )
            ) : (
              /* ACTIVE QUESTION CONTENT (Shown only after pushed) */
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                    Question {activeQuestionIndex + 1} of {Math.max(questions.length, 1)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Domain: <span className="font-bold text-white">{activeQuestion.skillEvaluated || 'General Technical'}</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-white">
                    {activeQuestion.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeQuestion.description}
                  </p>
                </div>

                {/* Interviewer Push Question & Question Bank Controls */}
                {isStaff && (
                  <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-indigo-200 font-medium flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Question active live on candidate screen:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          fetchQuestionBank();
                          setShowQuestionBankModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Browse Other Questions</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Answer Input Field */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400">
                      {user?.role === 'CANDIDATE'
                        ? 'Your Technical Explanation / Code Response (Live Synced):'
                        : "Candidate's Spoken / Transcribed Explanation:"}
                    </label>
                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => {
                          const sampleAnswers = [
                            "HTML semantic elements like <header>, <nav>, <main>, and <footer> clearly describe their meaning to both the browser and developer, which significantly improves web accessibility (a11y) and search engine optimization (SEO).",
                            "The CSS Box Model consists of content, padding, border, and margin. To center an element with Flexbox, apply display: flex, justify-content: center (horizontal), and align-items: center (vertical) on the parent container.",
                            "var is function-scoped and hoisted, whereas let and const are block-scoped. const variables cannot be reassigned after declaration. In modern development, const is preferred by default and let is used when values need to be reassigned.",
                            "map() transforms each item in an array and returns a new array without mutating the original. filter() returns a new array with only elements that satisfy a condition, for example: numbers.filter(n => n > 10).",
                            "React components are reusable building blocks returning JSX. Props are arbitrary inputs passed from parent to child components, and props are strictly read-only for the child.",
                            "useState declares state variables in functional components. Updating state with its setter function triggers a component re-render with the new value, keeping the UI in sync.",
                            "HTTP GET retrieves data from a server without modifying state, while POST sends data in the request body to create or process a new resource.",
                            "A Primary Key uniquely identifies each row in a database table. It cannot be NULL and guarantees data integrity and fast indexed lookups."
                          ];
                          const chosen = sampleAnswers[activeQuestionIndex % sampleAnswers.length];
                          handleAnswerTextChange(chosen);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-800/60 transition inline-flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>1-Click Sample Answer</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={candidateAnswerText}
                    onChange={e => handleAnswerTextChange(e.target.value)}
                    placeholder={
                      user?.role === 'CANDIDATE'
                        ? 'Type your explanation, basic concepts, or code solution here. Evaluator will see your response in real time...'
                        : "Waiting for candidate live response or type transcribed explanation here..."
                    }
                    className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-mono"
                  />
                </div>

                {/* Action Buttons: Candidate Submit vs Interviewer AI Evaluate */}
                {user?.role === 'CANDIDATE' ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Live synced with technical evaluator
                    </span>
                    <button
                      type="button"
                      onClick={handleCandidateSubmitToInterviewer}
                      disabled={!candidateAnswerText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950 flex items-center space-x-1.5 disabled:opacity-50 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Answer to Interviewer</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluating || !candidateAnswerText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950 flex items-center space-x-2 disabled:opacity-50 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isEvaluating ? 'Evaluating with AI...' : 'Submit & AI Evaluate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AI 5-Metric Evaluation Result */}
          {currentEvaluation && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-indigo-900/50 space-y-3.5 animate-in fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-indigo-400 flex items-center">
                  <Award className="w-4 h-4 mr-1.5 text-indigo-400" />
                  AI 5-Metric Rubric Assessment
                </span>
                <span className="text-2xl font-black text-indigo-400">
                  {currentEvaluation.finalScore}/100
                </span>
              </div>

              {/* 5-Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Tech Correctness (30%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.technicalCorrectness}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Semantic Fit (25%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.semanticRelevance}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Depth (20%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.conceptualUnderstanding}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Completeness (15%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.completeness}%</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div>
                  <span className="font-bold text-emerald-400">Identified Strengths: </span>
                  {currentEvaluation.strengthsFeedback}
                </div>
                <div>
                  <span className="font-bold text-amber-400">Growth Areas: </span>
                  {currentEvaluation.improvementAreas}
                </div>
              </div>

              {/* Human Interviewer Override Action */}
              {isStaff && (
                <button
                  onClick={() => setShowOverrideModal(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Human Evaluator Score Override</span>
                </button>
              )}
            </div>
          )}

          {/* In-Room Live Chat */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between h-60 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                In-Interview Synchronized Chat
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Real-Time</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {chatMessages.length === 0 ? (
                <div className="text-slate-600 text-center py-6 text-xs">
                  Chat is active for room participants.
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-indigo-400">{m.senderName} ({m.senderRole})</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-200 mt-1">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex items-center space-x-2 pt-2 border-t border-slate-900">
              <input
                type="text"
                placeholder="Send message or code link..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Evaluator Conclude & Candidate Recommendation Modal */}
      {showConcludeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Conclude & Submit Evaluation</h3>
                  <p className="text-xs text-slate-400">Record hiring recommendation and finalize assessment report</p>
                </div>
              </div>
              <button
                onClick={() => setShowConcludeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate & Session Info */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate</span>
                <div className="font-bold text-white mt-0.5 truncate">
                  {interview?.application?.candidate?.user?.name || 'Software Candidate'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Role</span>
                <div className="font-bold text-white mt-0.5 truncate">{interview?.title}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">In-Room AI Questions</span>
                <div className="font-bold text-indigo-400 mt-0.5">{evaluationHistory.length} Question(s) Scored</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                <div className="font-bold text-emerald-400 mt-0.5">Ready to Submit Marks</div>
              </div>
            </div>

            {/* The 3-Way Scoring System (AI Test + Technical + Communication) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Candidate 3-Way Evaluation Marks *
                </label>
                <span className="text-[10px] text-slate-400">1 AI Mark + 2 Interviewer Marks</span>
              </div>

              {/* 1. In-Room AI Test Mark */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>1. AI Assessment Test Mark</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automated score evaluated by NLP multi-metric rubric ({evaluationHistory.length} question(s) answered)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-indigo-300">
                    {evaluationHistory.length > 0
                      ? Math.round(
                          evaluationHistory.reduce((sum, a) => sum + (a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0), 0) /
                          evaluationHistory.length
                        )
                      : 85}%
                  </span>
                  <span className="block text-[10px] text-emerald-400 font-bold uppercase">AI Scored</span>
                </div>
              </div>

              {/* 2. Technical Score (Interviewer Input) */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">2. Technical Depth & Reasoning Mark</span>
                    <span className="block text-[10px] text-slate-400">Candidate's core engineering, logic, edge-case handling</span>
                  </div>
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800">
                    {technicalScoreVal}%
                  </span>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={technicalScoreVal}
                    onChange={e => setTechnicalScoreVal(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={technicalScoreVal}
                    onChange={e => setTechnicalScoreVal(Math.min(100, Math.max(0, parseInt(e.target.value || '0', 10))))}
                    className="w-16 py-1 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center text-xs font-bold"
                  />
                </div>
              </div>

              {/* 3. Communication Score (Interviewer Input) */}
              <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">3. Spoken Communication & Articulation Mark</span>
                    <span className="block text-[10px] text-slate-400">Fluency, clarity of technical explanation, and articulation</span>
                  </div>
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {communicationScoreVal}%
                  </span>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={communicationScoreVal}
                    onChange={e => setCommunicationScoreVal(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={communicationScoreVal}
                    onChange={e => setCommunicationScoreVal(Math.min(100, Math.max(0, parseInt(e.target.value || '0', 10))))}
                    className="w-16 py-1 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses Observations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  Technical Strengths Observed
                </label>
                <textarea
                  rows={2}
                  value={strengthsObserved}
                  onChange={e => setStrengthsObserved(e.target.value)}
                  placeholder="e.g. Strong problem decomposition, clean React hooks reasoning..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Improvement Areas / Weaknesses
                </label>
                <textarea
                  rows={2}
                  value={improvementAreas}
                  onChange={e => setImprovementAreas(e.target.value)}
                  placeholder="e.g. Needs deeper practice with SQL indexing and distributed caching..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Your submitted 3 marks (AI, Technical, Communication) and feedback will be sent directly to Platform Administrator and Recruiter. They hold the authority to make the final Accept or Reject hiring decision.
              </span>
            </div>

            {/* Evaluator Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Final Evaluator Justification & Feedback
              </label>
              <textarea
                rows={3}
                value={evaluatorNotes}
                onChange={e => setEvaluatorNotes(e.target.value)}
                placeholder="Enter evaluation notes, technical strengths, edge case handling, and recommendations for the candidate..."
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConcludeModal(false)}
                disabled={submittingEvaluation}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel / Keep Open
              </button>
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                disabled={submittingEvaluation}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-900 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submittingEvaluation ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Finalizing Assessment...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit 3 Marks & Feedback to Admin & Recruiter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Question Bank Modal */}
      {showQuestionBankModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">AI Technical Question Bank</h3>
                  <p className="text-xs text-slate-400">Select a question to push live to the candidate screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionBankModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={e => setBankSearchQuery(e.target.value)}
                    placeholder="Search question bank by keyword, skill, or title..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomQuestionForm(!showCustomQuestionForm)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 font-bold text-xs transition flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCustomQuestionForm ? 'Cancel Custom' : 'Custom Question'}</span>
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {['ALL', 'TECHNICAL', 'SYSTEM DESIGN', 'DEVOPS', 'BEHAVIORAL'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBankCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      bankCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Form */}
            {showCustomQuestionForm && (
              <form onSubmit={handleCreateAndPushCustom} className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/60 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Craft Ad-hoc Question & Push Live
                  </span>
                  <span className="text-[10px] text-slate-500">Instant Broadcast</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Question Title (e.g., Redis Cache Invalidation)"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Skill / Domain (e.g., Redis, Distributed Systems)"
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Problem prompt or architecture question scenario..."
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomQuestionForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save & Push Question</span>
                  </button>
                </div>
              </form>
            )}

            {/* Question Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingBank ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Loading question catalog...</span>
                </div>
              ) : (
                (() => {
                  const filtered = questionBank.filter(q => {
                    const matchesCategory =
                      bankCategoryFilter === 'ALL' ||
                      (q.category || '').toUpperCase() === bankCategoryFilter.toUpperCase();
                    const matchesQuery =
                      !bankSearchQuery ||
                      (q.title || '').toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                      (q.description || '').toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                      (q.skillEvaluated || '').toLowerCase().includes(bankSearchQuery.toLowerCase());
                    return matchesCategory && matchesQuery;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No questions found matching your filter criteria.
                      </div>
                    );
                  }

                  return filtered.map(q => {
                    const isActive = activeQuestion?.title === q.title;
                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-2xl border transition space-y-2 ${
                          isActive
                            ? 'bg-indigo-950/40 border-indigo-700 shadow-md'
                            : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-800">
                                {q.skillEvaluated || 'General'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {q.category || 'TECHNICAL'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                                {q.difficulty || 'INTERMEDIATE'}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-white">{q.title}</h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePushQuestion(q)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1 shrink-0 ${
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Active on Screen</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Push Question</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{q.description}</p>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowQuestionBankModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Close Question Bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluator Score Calibration Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Manual Score Calibration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Adjusted Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScoreVal}
                  onChange={e => setOverrideScoreVal(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Evaluator Calibration Justification
                </label>
                <textarea
                  rows={3}
                  value={overrideReasonVal}
                  onChange={e => setOverrideReasonVal(e.target.value)}
                  placeholder="Explain why score was adjusted (e.g., candidate communicated strong edge-case trade-offs verbally)..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOverride}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-900"
              >
                Save Overridden Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Live Session Concluded Pop-up Modal */}
      {sessionConcludedData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-7 max-w-md w-full border border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                Assessment Finalized
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">
                Interview Concluded
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The technical evaluator has submitted your assessment recommendation and compiled your multi-metric performance rubrics.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Position</span>
                <span className="font-bold text-white truncate max-w-[180px]">{interview?.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-400 uppercase">
                  Assessment Completed &bull; Pending Hiring Decision
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                to="/candidate/assessments"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-950"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View My Assessment Report</span>
              </Link>
              <Link
                to="/candidate/dashboard"
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-1.5 border border-slate-700"
              >
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
