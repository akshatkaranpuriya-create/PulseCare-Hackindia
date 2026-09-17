import React from 'react';
import { Users, Clock, AlertCircle, PhoneCall, ChevronRight } from 'lucide-react';

export default function PatientQueue({ 
  patients = [], 
  selectedPatientId, 
  onSelectPatient,
  onInitiateCall 
}) {
  return (
    <aside className="h-full bg-brand-tealDark text-white flex flex-col rounded-2xl shadow-sm overflow-hidden border border-brand-tealDark">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-marigold" />
          <h2 className="text-base font-bold tracking-tight">Triage Waiting Room</h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal text-white border border-white/20">
          {patients.length} Waiting
        </span>
      </div>

      {/* Queue List with Internal Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {patients.length === 0 ? (
          <div className="p-8 text-center text-neutral-300">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No patients currently in queue.</p>
            <p className="text-xs text-neutral-400 mt-1">
              New submissions from Patient Symptom Checker will appear here in real-time.
            </p>
          </div>
        ) : (
          patients.map((patient) => {
            const isSelected = selectedPatientId === patient.id;
            const isEmergency = patient.urgency === 'emergency';

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3.5 rounded-xl transition-all cursor-pointer border text-left ${
                  isSelected
                    ? 'bg-white/15 border-brand-marigold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-bold text-base text-white truncate">
                    {patient.name}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 ${
                      isEmergency
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {patient.urgency || 'consultation'}
                  </span>
                </div>

                <div className="text-xs text-neutral-300 flex items-center justify-between mb-2">
                  <span>{patient.age} yrs • {patient.village || 'Village Block'}</span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {patient.vitals?.temp ? `${patient.vitals.temp}°F` : ''}
                  </span>
                </div>

                {patient.symptoms && patient.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {patient.symptoms.slice(0, 2).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-neutral-200 truncate max-w-[120px]"
                      >
                        {s}
                      </span>
                    ))}
                    {patient.symptoms.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-neutral-400">
                        +{patient.symptoms.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Call Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onInitiateCall) onInitiateCall(patient);
                  }}
                  className="w-full h-9 rounded-lg bg-brand-marigold hover:bg-brand-marigoldDark text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Start Consultation</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
