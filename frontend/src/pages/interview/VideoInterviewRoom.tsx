import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { interviewsAPI, assessmentAPI } from '../../services/api';
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
  X
} from 'lucide-react';

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
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'PEER_CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [recordingConsent, setRecordingConsent] = useState(false);

  // Timing Window State (5 minutes prior to scheduled start)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [secondsUntilOpen, setSecondsUntilOpen] = useState<number | null>(null);

  // Questions & Answers
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [candidateAnswerText, setCandidateAnswerText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);

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

    // Handle remote media track arrival
    pc.ontrack = event => {
      console.log('[WebRTC] Remote stream received from peer:', event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
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
    const isRoomConcluded = interview?.status === 'COMPLETED' || (interview && Date.now() > new Date(interview.scheduledEndTime).getTime());
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
          audio: true
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
      socket.on('active-question-changed', data => {
        if (data.question) {
          const foundIdx = questions.findIndex(q => q.id === data.question.id || q.title === data.question.title);
          if (foundIdx !== -1) {
            setActiveQuestionIndex(foundIdx);
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

  // Push Question to Candidate Screen (Interviewer control)
  const handlePushQuestion = () => {
    const currentQ = questions[activeQuestionIndex];
    if (!socketRef.current || !roomCode || !currentQ) return;

    socketRef.current.emit('push-question', {
      roomCode,
      question: currentQ
    });

    alert(`Question ${activeQuestionIndex + 1} pushed! It is now active on the candidate's screen.`);
  };

  // Next Question trigger
  const handleNextQuestion = () => {
    if (activeQuestionIndex < questions.length - 1) {
      const nextIdx = activeQuestionIndex + 1;
      setActiveQuestionIndex(nextIdx);
      setCurrentEvaluation(null);
      if (socketRef.current) {
        socketRef.current.emit('push-question', {
          roomCode,
          question: questions[nextIdx]
        });
      }
    }
  };

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    const activeQ = questions[activeQuestionIndex];
    if (!activeQ || !candidateAnswerText.trim() || !interview) return;

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
        setCandidateAnswerText('');
      }
    } catch (err) {
      console.error('Answer evaluation failed:', err);
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
  const isExpired = interview ? Date.now() > new Date(interview.scheduledEndTime).getTime() : false;
  const isConcluded = isCompleted || isExpired;

  // Session Concluded Screen (Prevents re-entering completed or expired interview rooms)
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

  const activeQuestion = questions[activeQuestionIndex];

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
          {/* Dual Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Local Video */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[240px] aspect-video shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="text-center text-slate-500 text-xs">
                  <VideoOff className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                  <span>Camera Disabled</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-slate-700 flex items-center space-x-1">
                <span>You ({user?.name || 'Local Participant'})</span>
                {isMuted && <span className="text-rose-400 font-mono">(Muted)</span>}
              </div>
            </div>

            {/* Remote Peer Video */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[240px] aspect-video shadow-lg">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
              />
              {!hasRemoteStream && (
                <div className="text-center text-slate-500 text-xs p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Video className="w-6 h-6 animate-pulse text-indigo-500" />
                  </div>
                  <div className="font-semibold text-slate-300">Waiting for remote peer video...</div>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    When the {isStaff ? 'candidate' : 'technical interviewer'} joins this room code ({roomCode}), live peer-to-peer video will stream automatically.
                  </p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-slate-700 flex items-center space-x-1">
                <span>{remotePeerName}</span>
                {remotePeerRole && <span className="text-indigo-400 font-mono uppercase">({remotePeerRole})</span>}
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                Question {activeQuestionIndex + 1} of {Math.max(questions.length, 1)}
              </span>
              <span className="text-xs text-slate-400">
                Domain: <span className="font-bold text-white">{activeQuestion?.skillEvaluated || 'General Technical'}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-white">
                {activeQuestion?.title || 'Technical Architecture Question'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeQuestion?.description || 'Explain your technical approach, concurrency model, edge cases, and reasoning.'}
              </p>
            </div>

            {/* Interviewer Push Question to Candidate Screen Button */}
            {isStaff && (
              <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-800/60 flex items-center justify-between text-xs">
                <span className="text-indigo-200 font-medium">
                  Asking verbally? Click to sync question on candidate screen:
                </span>
                <button
                  type="button"
                  onClick={handlePushQuestion}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center space-x-1 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push Question</span>
                </button>
              </div>
            )}

            {/* Answer Input Field */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400">
                  {isStaff ? "Candidate's Spoken / Transcribed Explanation:" : 'Your Technical Explanation / Code Response:'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sampleAnswers = [
                      "useMemo memoizes computed values to prevent expensive recalculations during renders. useCallback caches function instances so child components wrapped with React.memo don't re-render unless dependencies change.",
                      "Database ACID properties guarantee transaction safety: Atomicity ensures all operations succeed or none do; Consistency maintains schema invariants; Isolation prevents concurrent transaction anomalies; and Durability ensures committed data is written to non-volatile disk.",
                      "Node.js utilizes an event-driven, single-threaded event loop architecture powered by libuv for non-blocking asynchronous I/O operations and backpressure stream management.",
                      "Docker containers isolate applications at the OS level using Linux cgroups and namespaces, whereas virtual machines virtualize the hardware layer with a hypervisor and full guest OS."
                    ];
                    const chosen = sampleAnswers[activeQuestionIndex % sampleAnswers.length];
                    setCandidateAnswerText(chosen);
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-800/60 transition inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>1-Click Sample Answer</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={candidateAnswerText}
                onChange={e => setCandidateAnswerText(e.target.value)}
                placeholder="Type or transcribe candidate's spoken technical explanation here..."
                className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSubmitAnswer}
                disabled={isEvaluating || !candidateAnswerText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950 flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEvaluating ? 'Evaluating with AI...' : 'Submit & AI Evaluate'}</span>
              </button>

              {isStaff && activeQuestionIndex < questions.length - 1 && (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
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
