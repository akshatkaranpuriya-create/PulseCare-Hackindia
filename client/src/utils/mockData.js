/**
 * Hardcoded Mock Data for PulseCare MVP (Zero DB Dependencies)
 * Conforms directly to PRD.md Section 5 schema.
 */

export const MOCK_PATIENTS = [
  {
    id: "p_101",
    name: "Ramesh Kumar",
    age: 45,
    vitals: { temp: 99.1, bp: "120/80", pulse: 76, spo2: 98 },
    symptoms: ["fever", "mild cough", "fatigue"],
    urgency: "consultation",
    village: "Rampur Block A",
    socketId: null,
    joinedAt: Date.now() - 1000 * 60 * 12
  },
  {
    id: "p_102",
    name: "Sunita Devi",
    age: 38,
    vitals: { temp: 101.4, bp: "135/88", pulse: 88, spo2: 97 },
    symptoms: ["throat irritation", "body ache", "headache"],
    urgency: "consultation",
    village: "Kalyanpur West",
    socketId: null,
    joinedAt: Date.now() - 1000 * 60 * 8
  },
  {
    id: "p_103",
    name: "Anand Verma",
    age: 62,
    vitals: { temp: 98.4, bp: "150/95", pulse: 82, spo2: 95 },
    symptoms: ["joint pain in knees", "mild swelling"],
    urgency: "consultation",
    village: "Bhopalpur Block C",
    socketId: null,
    joinedAt: Date.now() - 1000 * 60 * 3
  }
];

export const MOCK_DOCTOR = {
  id: "doc_01",
  name: "Dr. Ananya Sharma, MBBS, MD",
  hubLocation: "District Civil Hospital, Hub 3",
  specialty: "General Medicine & Rural Health",
  available: true
};

export const MOCK_PRESCRIPTIONS = [
  {
    rxId: "rx_999",
    patientId: "p_101",
    patientName: "Ramesh Kumar",
    medication: "Paracetamol 500mg & Cetirizine 10mg",
    dosage: "1 tablet after meals twice a day for 3 days",
    ashaDeliveryRoute: "Village Block B - North Sector",
    ashaWorkerName: "Pooja Devi (ASHA)",
    ashaContact: "+91 98765 43210",
    status: "Routed to Local ASHA Worker",
    disclaimer: "Conceptual integration — not an active partnership with any ASHA program or health authority."
  }
];
