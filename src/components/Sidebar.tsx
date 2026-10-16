import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Cpu, Cloud, Globe } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:block w-80 space-y-4 flex-shrink-0">
      {/* Active Sources Card */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
          <span>Active Sources</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-semibold">
            8 Live
          </span>
        </h3>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {[
            { id: 'David_Ornstein', name: 'David Ornstein', role: 'The Athletic • Tier 1' },
            { id: 'footballontnt', name: 'TNT Sports', role: 'UCL & Premier League' },
            { id: 'ESPNUK', name: 'ESPN UK', role: 'Breaking Football' },
            { id: '433', name: '433', role: 'Global Football' },
            { id: 'MadridXtra', name: 'Madrid Xtra', role: 'Real Madrid 24/7' },
            { id: 'brfootball', name: 'B/R Football', role: 'Culture & Breaking' },
            { id: 'Squawka', name: 'Squawka', role: 'Stats & Tactical' },
            { id: 'UtdDistrict', name: 'United District', role: 'Man United Hub' },
          ].map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/50 transition-colors">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-zinc-200 truncate">{s.name}</span>
                  <CheckCircle2 className="w-3 h-3 text-sky-400 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-zinc-500 truncate">@{s.id} • {s.role}</p>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Cloud & Algorithm Highlights */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Xtra Architecture
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-zinc-300">
            <Cpu className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-100">Gemini 2.0 / 1.5 Flash:</span>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Google AI Studio free tier translation tailored for engaging Mizo football phrasing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-100">0% External Link Penalty:</span>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Facebook captions are pure native text + HD photo. No link cards to harm organic reach.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-zinc-300">
            <Cloud className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-100">Cloudflare D1 & Pages:</span>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                100% Free ₹0/mo serverless stack. Instant global latency on edge nodes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-zinc-300">
            <Clock className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-100">Cron Trigger:</span>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Runs automatically every 15-20 minutes in Cloudflare cloud 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-zinc-500 px-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          <span>Deployed at xtra.pages.dev</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Xtra • Breaking Football News in Mizo</p>
      </div>
    </aside>
  );
};
