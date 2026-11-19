import React from 'react';
import { Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLocal?: boolean;
  participantName: string;
  roleBadge?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  waitingMessage?: string;
  onToggleFullscreen?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  isLocal = false,
  participantName,
  roleBadge,
  isMuted = false,
  isVideoOff = false,
  waitingMessage,
  onToggleFullscreen
}) => {
  return (
    <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center shadow-xl group">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent audio feedback
        className={`w-full h-full object-cover transition duration-300 ${
          isLocal ? 'scale-x-[-1]' : ''
        } ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Off Fallback Avatar */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white space-y-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-brand-600 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/20">
            {getInitials(participantName)}
          </div>
          <span className="text-sm font-semibold text-slate-300">{participantName}</span>
          <span className="text-xs text-slate-500 font-medium">Camera is disabled</span>
        </div>
      )}

      {/* Waiting Message if remote not connected yet */}
      {waitingMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Video className="w-7 h-7" />
          </div>
          <p className="text-xs sm:text-sm font-semibold max-w-xs">{waitingMessage}</p>
        </div>
      )}

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/10 shadow-sm flex items-center space-x-1.5">
          <span>{participantName}</span>
          {roleBadge && (
            <span className="text-[10px] uppercase text-indigo-300 font-mono">
              ({roleBadge})
            </span>
          )}
        </span>
      </div>

      {/* Bottom Status Indicators */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        <div
          className={`p-1.5 rounded-full backdrop-blur-md ${
            isMuted ? 'bg-rose-500/80 text-white' : 'bg-slate-900/80 text-slate-300'
          }`}
          title={isMuted ? 'Microphone Muted' : 'Microphone Live'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </div>
        <div
          className={`p-1.5 rounded-full backdrop-blur-md ${
            isVideoOff ? 'bg-rose-500/80 text-white' : 'bg-slate-900/80 text-slate-300'
          }`}
          title={isVideoOff ? 'Video Off' : 'Video Live'}
        >
          {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
        </div>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
