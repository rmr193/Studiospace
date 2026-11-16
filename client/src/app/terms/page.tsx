import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, Scale, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "StudioSpace terms of service for hosts and creators booking peer-to-peer production studios.",
};

const sections = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an account, listing a studio, or booking a production space through StudioSpace, you agree to these Terms of Service. If you do not agree, please do not use the marketplace.",
  },
  {
    title: "2. Accounts and eligibility",
    body: "You must be at least 18 years old and provide accurate account information. You are responsible for keeping your credentials secure and for all activity under your account. StudioSpace uses BetterAuth with HTTPOnly session cookies; never share your password or session with anyone.",
  },
  {
    title: "3. Studio listings",
    body: "Hosts are responsible for the accuracy of listing details, including hourly rates, security deposits, capacity, amenities, location, and availability. Hosts must have the legal right to rent the space and must comply with local permits, insurance, and safety requirements.",
  },
  {
    title: "4. Bookings and availability",
    body: "Bookings are requests until a host confirms them. StudioSpace prevents overlapping Pending and Confirmed reservations for the same studio, date, and time range. A booking that conflicts with an existing reservation will be rejected with a conflict response.",
  },
  {
    title: "5. Pricing, deposits, and invoices",
    body: "The total price shown at checkout includes the hourly rate and any refundable security deposit. Invoices are generated as PDF documents for your records. Hosts and creators are responsible for resolving refund requests directly, subject to the host's cancellation policy.",
  },
  {
    title: "6. Cancellations",
    body: "Creators may cancel Pending bookings from the My Bookings page. Confirmed bookings must be coordinated with the host. Repeated no-shows or abusive cancellations may result in account suspension.",
  },
  {
    title: "7. Acceptable use",
    body: "You may not use StudioSpace to harass other users, publish false listings, circumvent payment, scrape the service, upload malicious content, or violate any applicable law. We may remove content or suspend accounts that breach these rules.",
  },
  {
    title: "8. Intellectual property",
    body: "You retain ownership of images and content you upload. By publishing a listing, you grant StudioSpace a non-exclusive licence to display that content for the purpose of operating and promoting the marketplace.",
  },
  {
    title: "9. Disclaimers and liability",
    body: "StudioSpace provides the marketplace platform only. Hosts are solely responsible for the physical space, equipment, and safety of their premises. To the maximum extent permitted by law, StudioSpace is not liable for indirect or consequential loss arising from a booking.",
  },
  {
    title: "10. Changes and contact",
    body: "We may update these terms as the marketplace evolves. Material changes will be announced on this page. Questions can be sent to the StudioSpace Stage Desk through the contact details in the site footer.",
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 text-white p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative space-y-4 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15">
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            Legal
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            StudioSpace Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Clear rules for creators booking production spaces and hosts listing them. These terms
            explain bookings, pricing, cancellations, and how we keep the marketplace safe.
          </p>
          <p className="text-xs text-slate-400">Last updated: 16 November 2026</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: ShieldCheck,
            title: "Secure by default",
            description: "Sessions use HTTPOnly cookies and verified BetterAuth accounts.",
          },
          {
            icon: Scale,
            title: "Fair bookings",
            description: "Automatic overlap prevention keeps double bookings out.",
          },
          {
            icon: HelpCircle,
            title: "Need help?",
            description: "Contact the Stage Desk from the footer for account support.",
          },
        ].map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2"
          >
            <Icon className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {sections.map((section) => (
          <section key={section.title} className="p-6 sm:p-8 space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </article>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 py-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ready to put these terms to work?
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/studios"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            Explore studios
          </Link>
          <Link
            href="/register"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-500/50 transition-colors"
          >
            Create account
          </Link>
        </div>
      </footer>
    </div>
  );
}
