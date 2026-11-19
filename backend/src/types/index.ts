/**
 * Core Backend Interfaces and Types
 */

export interface SocketRoomUser {
  socketId: string;
  userId: string;
  userName: string;
  role: string;
}

export interface WebRTCOfferPayload {
  targetSocketId: string;
  sdp: any;
}

export interface WebRTCAnswerPayload {
  targetSocketId: string;
  sdp: any;
}

export interface WebRTCIceCandidatePayload {
  targetSocketId: string;
  candidate: any;
}

export interface ChatMessagePayload {
  id?: string;
  roomCode: string;
  message: string;
  senderName: string;
  senderRole: string;
  timestamp?: string;
}

export interface PushQuestionPayload {
  roomCode: string;
  question: any;
}

export interface AnswerEvaluationRequest {
  interviewId?: string;
  questionId?: string;
  questionText: string;
  candidateAnswer: string;
  jobRole?: string;
  experienceLevel?: string;
  keywords?: string[];
}
