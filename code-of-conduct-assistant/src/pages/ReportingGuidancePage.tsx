import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Phone,
  Mail,
  ExternalLink,
  Lock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IApplicationSettings } from '../types.ts';

export const ReportingGuidancePage: React.FC = () => {
  const [settings, setSettings] = useState<IApplicationSettings | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    load();
  }, []);

  const contacts = [
    {
      title: 'Ethics & Compliance Hotline',
      role: '24/7 Confidential Reporting',
      phone: settings?.hotlinePhone || '+1 (800) 555-ETHIC (3844)',
      email: settings?.supportEmail || 'conduct-ethics@meridian.org',
      description: 'Anonymous intake service for financial misconduct, conflicts of interest, or policy violations.',
      confidential: true,
    },
    {
      title: 'Title IX & Non-Discrimination Office',
      role: 'Sexual Misconduct & Civil Rights',
      phone: '+1 (555) 019-9800',
      email: 'titleix-coordinator@meridian.org',
      description: 'Investigates sexual harassment, gender discrimination, stalking, and interpersonal violence.',
      confidential: false, // Mandatory reporter
      badge: 'Formal Investigations',
    },
    {
      title: 'Institutional Ombudsperson',
      role: 'Informal & Independent Mediator',
      phone: '+1 (555) 019-9822',
      email: 'ombuds@meridian.org',
      description: 'Strictly confidential, neutral sounding board for conflict resolution without formal filing.',
      confidential: true,
      badge: 'Strictly Confidential',
    },
    {
      title: 'Dean of Students / Academic Affairs',
      role: 'Student Conduct & Honor Board',
      phone: '+1 (555) 019-9844',
      email: 'student-conduct@meridian.org',
      description: 'Handles academic integrity hearings, grade grievance appeals, and student disputes.',
      confidential: false,
    },
    {
      title: 'Information Security & Privacy Office',
      role: 'Cybersecurity Incident Response',
      phone: '+1 (555) 019-SAFE (7233)',
      email: 'security@meridian.org',
      description: 'Immediate response for lost encrypted laptops, phishing, and student privacy (FERPA) disclosures.',
      confidential: true,
    },
  ];

  const documentationSteps = [
    {
      step: '1',
      title: 'Record Date, Time, and Location',
      text: 'Keep a factual chronology of events as close to when they happened as possible.',
    },
    {
      step: '2',
      title: 'Preserve Physical and Digital Evidence',
      text: 'Save unedited emails, chat transcripts, documents, text messages, or photographs in a secure personal folder.',
    },
    {
      step: '3',
      title: 'Note Potential Witnesses',
      text: 'List names of individuals who were present or who may have observed pertinent interactions.',
    },
    {
      step: '4',
      title: 'Separate Objective Facts from Assumptions',
      text: 'Describe exact quotes and observed actions rather than emotional interpretations.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Official Reporting Protocols & Resource Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reporting & Guidance Center
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          The Code of Conduct Assistant is an educational reference platform. If you have witnessed,
          experienced, or suspect misconduct, use the authorized institutional channels below to seek
          confidential guidance or file an official report.
        </p>
      </div>

      {/* Emergency Notice */}
      <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-900 dark:text-rose-200">
          <p className="font-bold text-sm mb-0.5">Emergency & Immediate Safety Threats</p>
          <p className="leading-relaxed">
            If there is immediate physical danger, medical emergency, or ongoing assault, call Campus
            Safety / Police immediately at <strong>911</strong> or <strong>(555) 019-9111</strong>. Do
            not rely on asynchronous chat or online portals for urgent emergencies.
          </p>
        </div>
      </div>

      {/* External Portal Launcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
            Official Incident Intake
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Secure Institutional Intake Portal
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Submit a formal incident report directly to the Office of General Counsel & HR Integrity.
            Anonymous submission options are supported by policy with full anti-retaliation protection.
          </p>
        </div>

        <a
          href={settings?.externalReportingPortalUrl || 'https://secure-ethics-reporting.example.org'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-3 text-xs font-semibold text-white shadow-xs transition-colors shrink-0"
        >
          <span>Launch Official Portal</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Contacts Directory */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Authorized Compliance & Support Directory
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {contact.title}
                  </h3>
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    {contact.role}
                  </span>
                </div>
                {contact.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {contact.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {contact.description}
              </p>

              <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-mono text-xs">{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="font-mono text-xs">{contact.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Checklist */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs mb-8">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>How to Document an Incident Safely</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Follow these guidelines when preparing facts for a consultation or investigation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documentationSteps.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4"
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white font-mono text-[10px]">
                  {s.step}
                </span>
                <span>{s.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Legal and Confidentiality Disclosure */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Important Confidentiality and Mandatory Reporting Disclosures:
        </p>
        <p className="leading-relaxed">
          1. <strong>Mandatory Reporters:</strong> Under institutional policy and Title IX regulations,
          most faculty, managers, and academic advisors are designated Responsible Employees. If you
          disclose sexual assault or discriminatory harassment to them, they are required by law to notify
          the Title IX Coordinator.
        </p>
        <p className="leading-relaxed">
          2. <strong>Confidential Resources:</strong> If you desire strictly confidential counseling
          without initiating a formal investigation, contact the Campus Counseling Center, Student Health
          Clinic, or the Office of the Ombudsperson.
        </p>
        <p className="leading-relaxed">
          3. <strong>Anti-Retaliation Guarantee:</strong> Institutional policy strictly prohibits threats,
          punitive demotions, grade reductions, or harassment against anyone who files a good-faith report
          or participates as a witness. Retaliation is subject to independent immediate dismissal.
        </p>
      </div>
    </div>
  );
};
