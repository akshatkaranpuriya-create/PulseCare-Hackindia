import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Gauge } from 'lucide-react';

export default function CallControls({
  isAudioMuted = false,
  isVideoDisabled = false,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onSimulateDegradation = null,
  isDegraded = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-white/90 backdrop-blur rounded-2xl border border-neutral-200 shadow-sm">
      {/* Audio Mute */}
      <button
        type="button"
        onClick={onToggleAudio}
        className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
          isAudioMuted
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
        }`}
        title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Video Toggle */}
      <button
        type="button"
        onClick={onToggleVideo}
        className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
          isVideoDisabled
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
        }`}
        title={isVideoDisabled ? 'Enable Video Track' : 'Disable Video Track'}
      >
        {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {/* Demo helper: Force / Simulate Network Cliff toggle */}
      {onSimulateDegradation && (
        <button
          type="button"
          onClick={onSimulateDegradation}
          className={`h-12 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
            isDegraded
              ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-500 shadow-sm'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
          }`}
          title="Simulate Network Latency Spike (>500ms RTT)"
        >
          <Gauge className="w-4 h-4" />
          <span>{isDegraded ? 'Recover Network' : 'Test Latency Drop'}</span>
        </button>
      )}

      {/* End Call */}
      <button
        type="button"
        onClick={onEndCall}
        className="h-12 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
      >
        <PhoneOff className="w-4 h-4" />
        <span>End Consultation</span>
      </button>
    </div>
  );
}
