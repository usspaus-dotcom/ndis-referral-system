import React, { useState } from "react";
import { Heart, Phone, Mail, MapPin, CheckCircle, Star, Users, Award, Clock, ChevronDown, ChevronUp, MessageCircle, Shield, Zap, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

const SERVICES = [
  { code: "01", name: "Daily Activities", desc: "Personal care, grooming, meal preparation" },
  { code: "02", name: "Transport", desc: "Travel assistance to appointments and activities" },
  { code: "03", name: "Consumables", desc: "Everyday items related to your disability" },
  { code: "04", name: "Assistance with Social & Community", desc: "Community participation and social activities" },
  { code: "05", name: "Supports Coordination", desc: "Connecting you with the right services" },
  { code: "06", name: "Improved Living Arrangements", desc: "Help finding and maintaining housing" },
  { code: "07", name: "Increased Social & Community", desc: "Building skills for independence" },
  { code: "08", name: "Finding & Keeping a Job", desc: "Employment support and skill building" },
  { code: "09", name: "Improved Health & Wellbeing", desc: "Dietitian, exercise physiology support" },
  { code: "10", name: "Improved Learning", desc: "Education and training support" },
  { code: "11", name: "Improved Life Choices", desc: "Plan management and financial support" },
  { code: "12", name: "Improved Daily Living", desc: "Therapy and skill development" },
];

const FAQS = [
  { q: "Who is eligible for NDIS?", a: "Australians aged 7–65 with a permanent disability that significantly affects daily activities. You must be an Australian citizen, permanent resident, or hold a Protected Special Category Visa." },
  { q: "How much is the referral reward?", a: "You earn a $200 gift card for every person you refer who becomes an enrolled Accurate Home Care client. There is no limit on how many people you can refer." },
  { q: "How long does the referral process take?", a: "We typically contact your referral within 24–48 hours. Enrollment can take 1–4 weeks depending on NDIS plan status." },
  { q: "Can I refer a family member?", a: "Yes! Family members, friends, neighbours, support coordinators, and healthcare professionals can all refer someone." },
  { q: "What areas do you service?", a: "We are based in Melbourne, VIC and service participants across all Australian states and territories." },
];

export default function Home() {
  const [formData, setFormData] = useState({
    participantName: "", participantPhone: "", participantEmail: "",
    suburb: "", state: "", disabilityType: "", supportNeeds: "",
    ndisStatus: "", age: "", citizenship: "",
    referrerName: "", referrerPhone: "", referrerEmail: "", referrerRelation: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.submitLead(formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Accurate Home Care</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#refer" className="hover:text-white transition-colors">Refer & Earn</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <a href="tel:0420686964" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Phone className="w-4 h-4" /> 0420 686 964
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-16 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Currently accepting new participants — Limited spots
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                Quality NDIS Support for<br />
                <span className="text-amber-400">Participants Aged 7–65</span>
              </h1>
              <p className="text-lg text-blue-200 mb-8 leading-relaxed">
                Accurate Home Care delivers compassionate, person-centred NDIS services across Australia.
                Know someone who needs support? <strong className="text-amber-300">Refer them and earn a $200 gift card.</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#refer" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
                  Refer Someone Now <ArrowRight className="w-4 h-4" />
                </a>
                <a href="tel:0420686964" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition-all">
                  <Phone className="w-4 h-4" /> Call Us
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "500+", label: "Participants Supported" },
                { icon: Shield, value: "NDIS", label: "Registered Provider" },
                { icon: Clock, value: "10+", label: "Years Experience" },
                { icon: Award, value: "$200", label: "Gift Card Reward" },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                  <s.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-blue-300 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border-y border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            {["NDIS Registered Provider", "Police-Checked Staff", "Fully Insured", "Person-Centred Care", "All 12 NDIS Support Categories"].map(b => (
              <div key={b} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">All 12 NDIS Support Categories</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We provide comprehensive support across every NDIS funding category, tailored to each participant's unique needs and goals.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SERVICES.map(s => (
              <div key={s.code} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">0{s.code}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{s.name}</h3>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Referral Reward ──────────────────────────────────────────────── */}
      <section id="refer" className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <Award className="w-3.5 h-3.5" /> Earn $200 Gift Card
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Refer Someone &<br />Earn a $200 Gift Card</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Know someone with a disability who needs NDIS support? Refer them to Accurate Home Care.
                When they enroll as a client, we'll send you a <strong>$200 gift card</strong> as our way of saying thank you.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Fill in the referral form with participant details",
                  "We contact them within 24–48 hours",
                  "They enroll as an Accurate Home Care client",
                  "You receive your $200 gift card",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <span className="text-slate-700 text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-amber-200 p-5">
                <p className="text-sm font-semibold text-slate-800 mb-3">Questions? Contact us directly:</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-500" /> 0420 686 964</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-500" /> 0451 796 011</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-500" /> accuratehomecare.cs@gmail.com</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> Melbourne, VIC (servicing all states)</div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Referral Submitted!</h3>
                  <p className="text-slate-600 text-sm">Thank you! We'll contact {formData.participantName} within 24–48 hours. Your $200 gift card will be sent once they enroll.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ participantName: "", participantPhone: "", participantEmail: "", suburb: "", state: "", disabilityType: "", supportNeeds: "", ndisStatus: "", age: "", citizenship: "", referrerName: "", referrerPhone: "", referrerEmail: "", referrerRelation: "" }); }} className="mt-6 text-amber-600 text-sm font-semibold hover:underline">
                    Submit another referral →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900">Referral Form</h3>

                  <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 font-medium">
                    Fill in the participant's details below. All fields marked * are required.
                  </div>

                  {/* Participant */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Participant Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="label">Full Name *</label>
                        <input className="input" value={formData.participantName} onChange={e => update("participantName", e.target.value)} required placeholder="Participant's full name" />
                      </div>
                      <div>
                        <label className="label">Phone *</label>
                        <input className="input" value={formData.participantPhone} onChange={e => update("participantPhone", e.target.value)} required placeholder="04xx xxx xxx" />
                      </div>
                      <div>
                        <label className="label">Age</label>
                        <input className="input" type="number" min="7" max="65" value={formData.age} onChange={e => update("age", e.target.value)} placeholder="Age (7–65)" />
                      </div>
                      <div>
                        <label className="label">Suburb</label>
                        <input className="input" value={formData.suburb} onChange={e => update("suburb", e.target.value)} placeholder="Suburb" />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <select className="input" value={formData.state} onChange={e => update("state", e.target.value)}>
                          <option value="">Select state</option>
                          {["VIC","NSW","QLD","WA","SA","TAS","ACT","NT"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="label">Disability Type</label>
                        <select className="input" value={formData.disabilityType} onChange={e => update("disabilityType", e.target.value)}>
                          <option value="">Select type</option>
                          {["Physical Disability","Intellectual Disability","Autism Spectrum Disorder","Mental Health","Acquired Brain Injury","Sensory Impairment","Neurological Condition","Other"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="label">NDIS Status</label>
                        <select className="input" value={formData.ndisStatus} onChange={e => update("ndisStatus", e.target.value)}>
                          <option value="">Select status</option>
                          <option value="has_plan">Has NDIS Plan</option>
                          <option value="applying">Applying for NDIS</option>
                          <option value="not_sure">Not Sure</option>
                          <option value="no_plan">No NDIS Plan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="label">Citizenship</label>
                        <select className="input" value={formData.citizenship} onChange={e => update("citizenship", e.target.value)}>
                          <option value="">Select</option>
                          <option value="citizen">Australian Citizen</option>
                          <option value="permanent_resident">Permanent Resident</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Referrer */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Your Details (Referrer)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Your Name *</label>
                        <input className="input" value={formData.referrerName} onChange={e => update("referrerName", e.target.value)} required placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="label">Your Phone *</label>
                        <input className="input" value={formData.referrerPhone} onChange={e => update("referrerPhone", e.target.value)} required placeholder="04xx xxx xxx" />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Your Email (for gift card)</label>
                        <input className="input" type="email" value={formData.referrerEmail} onChange={e => update("referrerEmail", e.target.value)} placeholder="your@email.com" />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Relation to Participant</label>
                        <select className="input" value={formData.referrerRelation} onChange={e => update("referrerRelation", e.target.value)}>
                          <option value="">Select relation</option>
                          {["Family Member","Friend","Support Coordinator","Healthcare Professional","Community Worker","Other"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
                  )}

                  <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
                    {submitting ? "Submitting..." : "Submit Referral & Earn $200 Gift Card →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">About Accurate Home Care</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Accurate Home Care is a registered NDIS provider based in Melbourne, Victoria. We are dedicated to delivering high-quality, person-centred disability support services to participants aged 7 to 65 across Australia.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Our team of qualified, police-checked support workers are passionate about empowering individuals with disabilities to live their best lives — with dignity, independence, and community connection.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: "NDIS Registered", desc: "Fully registered provider" },
                  { icon: Users, label: "500+ Clients", desc: "Supported across Australia" },
                  { icon: CheckCircle, label: "Police Checked", desc: "All staff verified" },
                  { icon: Zap, label: "Fast Response", desc: "Contact within 24–48hrs" },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <f.icon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
                      <div className="text-xs text-slate-500">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">Contact Us</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Phone</div>
                    <div className="text-blue-300 text-sm">0420 686 964 · 0451 796 011</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Email</div>
                    <div className="text-blue-300 text-sm">accuratehomecare.cs@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Location</div>
                    <div className="text-blue-300 text-sm">Melbourne, VIC · All states</div>
                  </div>
                </div>
              </div>
              <a href="https://wa.me/61420686964" target="_blank" rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors w-full">
                <MessageCircle className="w-4 h-4" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">Accurate Home Care</span>
            </div>
            <div className="text-sm text-center">
              NDIS Registered Provider · Melbourne, VIC · 0420 686 964 · accuratehomecare.cs@gmail.com
            </div>
            <div className="text-xs">© 2024 Accurate Home Care. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* ── Sticky Mobile CTA ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
        <a href="#refer" className="flex-1 bg-amber-500 text-white text-sm font-bold py-3 rounded-xl text-center">Refer & Earn $200</a>
        <a href="tel:0420686964" className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl">
          <Phone className="w-5 h-5" />
        </a>
      </div>

      {/* ── WhatsApp Float ────────────────────────────────────────────────── */}
      <a href="https://wa.me/61420686964" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
