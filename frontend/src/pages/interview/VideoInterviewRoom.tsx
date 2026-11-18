import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { interviewsAPI, assessmentAPI } from '../../services/api';
import { Interview, InterviewQuestion, AnswerEvaluation } from '../../types';
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
  Edit3
} from 'lucide-react';

export const VideoInterviewRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  // WebRTC & Media States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'PEER_CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [recordingConsent, setRecordingConsent] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  // Live Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

          // If previous answers exist, load evaluation history
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

  // 2. Initialize Media Devices & Socket.IO
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Microphone access not granted or unavailable:', err);
      }

      // Initialize Socket.IO connection
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnectionStatus('CONNECTED');
        socket.emit('join-room', {
          roomCode,
          userId: user?.id || 'guest',
          userName: user?.name || 'Guest User',
          role: user?.role || 'CANDIDATE'
        });
      });

      socket.on('user-joined', data => {
        setConnectionStatus('PEER_CONNECTED');
        // If local stream exists, initiate WebRTC Offer
        if (stream) {
          createPeerConnection(data.socketId, stream, socket);
        }
      });

      socket.on('chat-message', msg => {
        setChatMessages(prev => [...prev, msg]);
      });

      socket.on('active-question-changed', data => {
        if (data.question) {
          const foundIdx = questions.findIndex(q => q.id === data.question.id);
          if (foundIdx !== -1) setActiveQuestionIndex(foundIdx);
        }
      });

      socket.on('consent-updated', data => {
        if (data.consentGiven) {
          setRecordingConsent(true);
        }
      });
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, user]);

  // WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId: string, stream: MediaStream, socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = event => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { targetSocketId, candidate: event.candidate });
      }
    };

    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      socket.emit('offer', { targetSocketId, sdp: offer });
    });
  };

  // Timer Tick
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

  // Send In-Room Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', {
      roomCode,
      message: chatInput,
      senderName: user?.name || 'Participant',
      senderRole: user?.role || 'CANDIDATE'
    });
    setChatInput('');
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

  // Next Question trigger (Interviewer pushes to Candidate)
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

  // Finalize Assessment & End Interview
  const handleEndInterview = async () => {
    if (!interview) return;
    if (window.confirm('Are you sure you want to end this interview session and compile the final report?')) {
      try {
        await assessmentAPI.finalize({
          interviewId: interview.id,
          recruiterRecommendation: 'HIRE'
        });
        if (user?.role === 'CANDIDATE') navigate('/candidate/assessments');
        else navigate('/recruiter/dashboard');
      } catch (err) {
        console.error(err);
      }
    }
  };

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
            <h2 className="font-extrabold text-sm tracking-tight text-white">{interview?.title || 'Video Interview Room'}</h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="font-mono text-indigo-400">{roomCode}</span>
              <span>&bull;</span>
              <span className="flex items-center text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                {connectionStatus}
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
            onClick={handleEndInterview}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-rose-950"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </header>

      {/* Main Room Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-6 w-full">
        {/* Left Column: Video Feeds & Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Dual Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Local Video */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[220px]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="text-center text-slate-500 text-xs">
                  <VideoOff className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                  Camera Disabled
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-slate-700">
                You ({user?.name || 'Local Peer'}) {isMuted ? '(Muted)' : ''}
              </div>
            </div>

            {/* Remote Peer Video */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[220px]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="text-center text-slate-500 text-xs p-4">
                <Video className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                <span>Waiting for remote peer video...</span>
              </div>
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white border border-slate-700">
                Remote Evaluator
              </div>
            </div>
          </div>

          {/* Media Control Toolbar */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex items-center justify-center space-x-3">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-2xl transition ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Microphone"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition ${
                isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Camera"
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition ${
                isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Question & Live Assessment Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Synchronized Question Card */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                Question {activeQuestionIndex + 1} of {questions.length || 1}
              </span>
              <span className="text-xs text-slate-400">
                Skill: <span className="font-bold text-white">{activeQuestion?.skillEvaluated || 'General'}</span>
              </span>
            </div>

            <h3 className="font-extrabold text-sm text-white">
              {activeQuestion?.title || 'Technical Question'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeQuestion?.description || 'Explain your technical approach, edge cases, and reasoning.'}
            </p>

            {/* Answer Input Field */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Candidate Answer Submission:
              </label>
              <textarea
                rows={4}
                value={candidateAnswerText}
                onChange={e => setCandidateAnswerText(e.target.value)}
                placeholder="Type or transcribe candidate's spoken explanation here..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSubmitAnswer}
                disabled={isEvaluating || !candidateAnswerText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-950 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEvaluating ? 'Evaluating with AI...' : 'Submit & AI Evaluate'}</span>
              </button>

              {user?.role !== 'CANDIDATE' && activeQuestionIndex < questions.length - 1 && (
                <button
                  onClick={handleNextQuestion}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Next Question &rarr;
                </button>
              )}
            </div>
          </div>

          {/* AI 5-Metric Evaluation Result */}
          {currentEvaluation && (
            <div className="bg-slate-950 p-5 rounded-3xl border border-indigo-900/50 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center">
                  <Award className="w-4 h-4 mr-1 text-indigo-400" />
                  AI 5-Metric Rubric Score
                </span>
                <span className="text-xl font-black text-indigo-400">
                  {currentEvaluation.finalScore}/100
                </span>
              </div>

              {/* 5-Metric Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Tech Correctness (30%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.technicalCorrectness}%</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Semantic Fit (25%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.semanticRelevance}%</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Conceptual Depth (20%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.conceptualUnderstanding}%</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Completeness (15%)</div>
                  <div className="font-bold text-white text-xs mt-0.5">{currentEvaluation.completeness}%</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-normal bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400">Strengths: </span>
                {currentEvaluation.strengthsFeedback}
                <div className="mt-1">
                  <span className="font-bold text-amber-400">Growth Areas: </span>
                  {currentEvaluation.improvementAreas}
                </div>
              </div>

              {/* Human Interviewer Override Action */}
              {user?.role !== 'CANDIDATE' && (
                <button
                  onClick={() => setShowOverrideModal(true)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Human Interviewer Score Override</span>
                </button>
              )}
            </div>
          )}

          {/* In-Room Live Chat */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex-1 flex flex-col justify-between max-h-56">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              <span>In-Interview Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {chatMessages.length === 0 ? (
                <div className="text-slate-600 text-center py-4 text-[11px]">Chat is active for room participants.</div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={idx} className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-indigo-400">{m.senderName}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-200 mt-0.5">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Send message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Human Interviewer Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="font-extrabold text-base text-white">Override AI Generated Score</h3>
            <p className="text-xs text-slate-400">
              Provide documented human evaluator reasoning to adjust score with audit tracking.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Adjusted Score (0-100)</label>
              <input
                type="number"
                value={overrideScoreVal}
                onChange={e => setOverrideScoreVal(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Documented Justification</label>
              <textarea
                rows={3}
                value={overrideReasonVal}
                onChange={e => setOverrideReasonVal(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentEvaluation) {
                    setCurrentEvaluation({
                      ...currentEvaluation,
                      finalScore: parseFloat(overrideScoreVal),
                      humanOverrideScore: parseFloat(overrideScoreVal),
                      overrideReason: overrideReasonVal
                    });
                  }
                  setShowOverrideModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
