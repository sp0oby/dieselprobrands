"use client";
import { useMemo, useState } from "react";
import { Briefcase, Check, ChevronDown, MapPin, Mail, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Job } from "./jobs";

export function JobsList({ jobs, careersEmail }: { jobs: Job[]; careersEmail: string }) {
  const departments = useMemo(() => ["All", ...Array.from(new Set(jobs.map((j) => j.department)))], [jobs]);
  const [filter, setFilter] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = filter === "All" ? jobs : jobs.filter((j) => j.department === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {departments.map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm transition-colors",
              filter === d
                ? "border-brand bg-brand text-white"
                : "border-black/10 bg-bg-panel text-ink-muted hover:text-ink",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <p className="card-surface p-12 text-center text-sm text-ink-muted">
            No openings in this department right now. Check back soon or send us a general application.
          </p>
        )}
        {filtered.map((job) => {
          const isOpen = openId === job.id;
          const mailto = `mailto:${careersEmail}?subject=${encodeURIComponent(`Application — ${job.title}`)}&body=${encodeURIComponent(
            `Hi DieselPro team,\n\nI'd like to apply for the ${job.title} role (${job.department}, ${job.location}).\n\nName:\nLocation:\nLinkedIn / portfolio:\nResume: (attach to this email)\nWhy I'm a fit:\n\n— Sent from dieselprobrands.com/careers`,
          )}`;
          return (
            <article key={job.id} className="card-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">{job.title}</h3>
                    {job.remote && <Badge variant="info">Remote</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1"><Briefcase className="size-3.5" /> {job.department}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {job.location}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {job.type}</span>
                    <span className="inline-flex items-center gap-1"><DollarSign className="size-3.5" /> {job.salary}</span>
                  </div>
                </div>
                <Button asChild>
                  <a href={mailto}><Mail className="size-4" /> Apply Now</a>
                </Button>
              </div>

              <p className="mt-4 text-sm text-ink-muted leading-relaxed">{job.blurb}</p>

              {isOpen && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-bold text-ink">Responsibilities</h4>
                    <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                      {job.responsibilities.map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <span className="text-brand-400 mt-1">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Qualifications</h4>
                    <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                      {job.qualifications.map((q) => (
                        <li key={q} className="flex items-start gap-2">
                          <Check className="size-4 text-brand-400 mt-0.5 shrink-0" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4 text-xs text-ink-dim">
                <span>Posted {new Date(job.postedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                <button
                  onClick={() => setOpenId(isOpen ? null : job.id)}
                  className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-600"
                >
                  {isOpen ? "Hide details" : "View full description"}
                  <ChevronDown className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
