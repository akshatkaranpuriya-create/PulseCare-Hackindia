import React, { useState, useEffect } from 'react';
import { Activity, User, Stethoscope, ShieldCheck, Wifi, Truck, HeartPulse } from 'lucide-react';
import Navbar from './components/common/Navbar.jsx';
import SymptomChecker from './components/patient/SymptomChecker.jsx';
import CallInterface from './components/patient/CallInterface.jsx';
import AshaTimeline from './components/patient/AshaTimeline.jsx';
import PatientQueue from './components/doctor/PatientQueue.jsx';
import PatientVitals from './components/doctor/PatientVitals.jsx';
import PrescriptionForm from './components/doctor/PrescriptionForm.jsx';
import VideoPlayer from './components/webrtc/VideoPlayer.jsx';
import CallControls from './components/webrtc/CallControls.jsx';
import { useSignaling } from './hooks/useSignaling.js';
import { useWebRTC } from './hooks/useWebRTC.js';
import { MOCK_PATIENTS, MOCK_DOCTOR, MOCK_PRESCRIPTIONS } from './utils/mockData.js';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/doctor')) return 'doctor';
    if (path.includes('/patient')) return 'patient';
    if (path.includes('/asha')) return 'asha';
    return 'home';
  });

  // In-memory queue of patients (initialized with mock data per PRD Section 5)
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [activePrescriptions, setActivePrescriptions] = useState(MOCK_PRESCRIPTIONS);

  // Patient view state
  const [patientQueueState, setPatientQueueState] = useState(null); // null = filling questionnaire, object = in queue/call
  const [activeRoomId, setActiveRoomId] = useState(null);

  // Active call & WebRTC state
  const [isDoctorInCall, setIsDoctorInCall] = useState(false);
  const [isPatientInCall, setIsPatientInCall] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('stable'); // 'stable' | 'degraded'
  const [simulatedRtt, setSimulatedRtt] = useState(120);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

  // WebRTC Hook
  const webrtc = useWebRTC({
    onRemoteStream: (stream) => {
      console.log('[PulseCare] Attached remote stream');
    },
    onDegradationStateChange: (degraded, rttValue) => {
      setNetworkStatus(degraded ? 'degraded' : 'stable');
      if (rttValue) setSimulatedRtt(rttValue);
    },
    onSendOffer: (offer, roomId) => {
      signaling.sendOffer(offer, roomId);
    },
    onSendAnswer: (answer, roomId) => {
      signaling.sendAnswer(answer, roomId);
    },
    onSendIceCandidate: (candidate, roomId) => {
      signaling.sendIceCandidate(candidate, roomId);
    },
  });

  // Signaling Bridge Hook
  const signaling = useSignaling({
    onQueueUpdated: (serverQueue) => {
      if (serverQueue && serverQueue.length > 0) {
        // Merge server queue with mock baseline so demo always has rich data
        const serverIds = new Set(serverQueue.map((p) => p.id));
        const combined = [...serverQueue, ...MOCK_PATIENTS.filter((p) => !serverIds.has(p.id))];
        setPatients(combined);
      }
    },
    onIncomingCall: async ({ callerId, roomId }) => {
      console.log(`[PulseCare] Incoming call from doctor ${callerId} in room ${roomId}`);
      setActiveRoomId(roomId);
      setIsPatientInCall(true);
      await webrtc.startLocalMedia();
    },
    onOffer: async ({ sdp, roomId }) => {
      console.log('[PulseCare] Received SDP offer');
      setActiveRoomId(roomId);
      await webrtc.handleReceiveOffer(sdp, roomId);
    },
    onAnswer: async ({ sdp }) => {
      console.log('[PulseCare] Received SDP answer');
      await webrtc.handleReceiveAnswer(sdp);
    },
    onIceCandidate: async ({ candidate }) => {
      await webrtc.handleAddIceCandidate(candidate);
    },
  });

  const navigateTo = (route) => {
    const path = route === 'home' ? '/' : `/${route}`;
    window.history.pushState({}, '', path);
    setCurrentRoute(route);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/doctor')) setCurrentRoute('doctor');
      else if (path.includes('/patient')) setCurrentRoute('patient');
      else if (path.includes('/asha')) setCurrentRoute('asha');
      else setCurrentRoute('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle patient joining queue from offline SymptomChecker
  const handleJoinQueue = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatient(newPatient);
    setPatientQueueState(newPatient);

    // Emit join-queue to signaling server
    signaling.joinQueue(newPatient);
  };

  // Doctor initiates consultation with selected patient
  const handleInitiateCall = async (patient) => {
    setSelectedPatient(patient);
    setIsDoctorInCall(true);
    const roomId = `room_${patient.id}_${Date.now()}`;
    setActiveRoomId(roomId);

    // Emit call-initiate via signaling
    signaling.initiateCall(patient.socketId || patient.id, roomId);

    // Doctor initiates offer
    await webrtc.initiateOffer(roomId);

    if (patientQueueState && patientQueueState.id === patient.id) {
      setIsPatientInCall(true);
    }
  };

  // Toggle simulated network cliff (>500ms RTT fallback)
  const handleSimulateDegradation = () => {
    if (networkStatus === 'stable') {
      webrtc.setDegradedMode(true, 580);
      setNetworkStatus('degraded');
      setSimulatedRtt(580);
    } else {
      webrtc.setDegradedMode(false, 95);
      setNetworkStatus('stable');
      setSimulatedRtt(95);
    }
  };

  const handleEndConsultation = () => {
    webrtc.endCall();
    setIsDoctorInCall(false);
    setIsPatientInCall(false);
    setPatientQueueState(null);
  };

  // Doctor issues prescription -> syncs to ASHA timeline
  const handleIssuePrescription = (rxRecord) => {
    setActivePrescriptions((prev) => [rxRecord, ...prev]);
    setPatients((prev) => prev.filter((p) => p.id !== rxRecord.patientId));
    handleEndConsultation();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {/* Universal Top Header */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        networkStatus={networkStatus}
        rtt={simulatedRtt}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* ROUTE 1: HOME / ROLE SELECTOR */}
        {currentRoute === 'home' && (
          <div className="max-w-4xl mx-auto px-4 py-12 w-full flex flex-col items-center justify-center flex-1 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold border border-emerald-300 mb-6">
              <Wifi className="w-4 h-4" />
              <span>Low-Bandwidth WebRTC Adaptive Layer</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4 max-w-2xl">
              Resilient Telemedicine for Weak Rural Connections
            </h1>
            <p className="text-lg text-neutral-600 mb-10 max-w-2xl">
              Deterministic offline triage rule engine paired with automated audio-fallback WebRTC. Prevents mid-consultation drops even on rural 2G/3G networks.
            </p>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
              {/* Patient / ASHA Portal */}
              <div
                onClick={() => navigateTo('patient')}
                className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:border-brand-marigold cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-marigold/10 text-brand-marigold flex items-center justify-center mb-4 group-hover:bg-brand-marigold group-hover:text-white transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 mb-2">Patient / ASHA Portal</h2>
                  <p className="text-sm text-neutral-600 mb-6">
                    Mobile-optimized offline symptom checker, local triage evaluation, and low-bandwidth consultation room.
                  </p>
                </div>
                <button className="w-full h-14 bg-brand-marigold hover:bg-brand-marigoldDark text-white font-semibold rounded-xl px-6 flex items-center justify-center transition-colors">
                  Open Patient Interface
                </button>
              </div>

              {/* Doctor Hub */}
              <div
                onClick={() => navigateTo('doctor')}
                className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:border-brand-teal cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-4 group-hover:bg-brand-teal group-hover:text-white transition-colors">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 mb-2">Doctor Hub Station</h2>
                  <p className="text-sm text-neutral-600 mb-6">
                    Real-time waiting room queue, pre-gathered patient vitals, high-contrast video grid, and Rx dispatch.
                  </p>
                </div>
                <button className="w-full h-14 bg-brand-teal hover:bg-brand-tealDark text-white font-semibold rounded-xl px-6 flex items-center justify-center transition-colors">
                  Open Doctor Hub
                </button>
              </div>
            </div>

            {/* Third demo action: ASHA Delivery Route */}
            <div className="mt-6 w-full max-w-2xl">
              <button
                onClick={() => navigateTo('asha')}
                className="w-full h-12 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Truck className="w-4 h-4 text-brand-marigold" />
                <span>View ASHA Community Delivery Route Mockup</span>
              </button>
            </div>

            {/* Architecture Highlights */}
            <div className="mt-12 pt-8 border-t border-neutral-200 w-full max-w-2xl flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Zero DB / In-Memory
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-marigold" />
                RTT &gt; 500ms Fallback
              </span>
              <span className="flex items-center gap-1.5">
                <Wifi className="w-4 h-4 text-brand-teal" />
                STUN + TURN Resilient
              </span>
            </div>
          </div>
        )}

        {/* ROUTE 2: PATIENT VIEW */}
        {currentRoute === 'patient' && (
          <div className="flex-1 flex flex-col">
            {patientQueueState ? (
              <CallInterface
                patientData={patientQueueState}
                isInCall={isPatientInCall}
                doctor={MOCK_DOCTOR}
                localStream={webrtc.localStream}
                remoteStream={webrtc.remoteStream}
                isAudioOnly={networkStatus === 'degraded'}
                rtt={simulatedRtt}
                isAudioMuted={isAudioMuted}
                isVideoDisabled={isVideoDisabled}
                onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
                onToggleVideo={() => setIsVideoDisabled(!isVideoDisabled)}
                onEndCall={handleEndConsultation}
                onSimulateDegradation={handleSimulateDegradation}
              />
            ) : (
              <SymptomChecker onJoinQueue={handleJoinQueue} />
            )}
          </div>
        )}

        {/* ROUTE 3: DOCTOR HUB WORKSPACE (CSS Grid grid-cols-12 per design.md) */}
        {currentRoute === 'doctor' && (
          <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
              {/* Left Sidebar: Patient Queue (col-span-3, bg-brand-tealDark) */}
              <div className="md:col-span-4 lg:col-span-3 h-[600px] md:h-auto">
                <PatientQueue
                  patients={patients}
                  selectedPatientId={selectedPatient?.id}
                  onSelectPatient={(p) => setSelectedPatient(p)}
                  onInitiateCall={handleInitiateCall}
                />
              </div>

              {/* Main Canvas: Video Grid + Vitals + Rx Generator (col-span-9, bg-neutral-50) */}
              <div className="md:col-span-8 lg:col-span-9 space-y-6">
                {/* Active Video Call Interface */}
                {isDoctorInCall && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Patient Remote Video */}
                      <VideoPlayer
                        stream={webrtc.remoteStream}
                        isLocal={false}
                        isAudioOnly={networkStatus === 'degraded'}
                        peerName={selectedPatient?.name || 'Patient'}
                        rtt={simulatedRtt}
                      />
                      {/* Doctor Local Self Video */}
                      <VideoPlayer
                        stream={webrtc.localStream}
                        isLocal={true}
                        isAudioOnly={isVideoDisabled}
                        peerName="Dr. Ananya Sharma (You)"
                      />
                    </div>

                    <CallControls
                      isAudioMuted={isAudioMuted}
                      isVideoDisabled={isVideoDisabled}
                      onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
                      onToggleVideo={() => setIsVideoDisabled(!isVideoDisabled)}
                      onEndCall={handleEndConsultation}
                      onSimulateDegradation={handleSimulateDegradation}
                      isDegraded={networkStatus === 'degraded'}
                    />
                  </div>
                )}

                {/* Patient Clinical Vitals Summary */}
                <PatientVitals patient={selectedPatient} />

                {/* Prescription & ASHA Dispatch Form */}
                <PrescriptionForm
                  patient={selectedPatient}
                  onIssuePrescription={handleIssuePrescription}
                />
              </div>
            </div>
          </div>
        )}

        {/* ROUTE 4: ASHA DELIVERY TIMELINE (Static Mockup per PRD Section 4.4 & Flow D) */}
        {currentRoute === 'asha' && (
          <AshaTimeline
            prescription={activePrescriptions[0]}
            onBack={() => navigateTo('home')}
          />
        )}
      </main>
    </div>
  );
}
