import { useState } from 'react';
import { HelpCircle, BookOpen, Info, MessageCircleQuestion, FileText } from 'lucide-react';

export function Help() {
  const [activeTab, setActiveTab] = useState('usage');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="text-emerald-400" size={28} />
        <h1 className="text-3xl font-light tracking-tight">Hilfe & Dokumentation</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'usage' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <BookOpen size={18} />
              <span className="font-medium">Benutzungs-Info</span>
            </button>
            <button
              onClick={() => setActiveTab('lexicon')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'lexicon' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <FileText size={18} />
              <span className="font-medium">Lexikon & Glossar</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'faq' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <MessageCircleQuestion size={18} />
              <span className="font-medium">FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'info' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <Info size={18} />
              <span className="font-medium">Über die App</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-8 rounded-2xl min-h-[500px]">
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">Benutzungs-Informationen</h2>
              <p className="text-slate-300 leading-relaxed">
                Willkommen beim Nexus-HEMS Dash. Diese App dient als zentraler Kontrollpunkt für Ihr
                Home Energy Management System. Hier finden Sie eine Übersicht der wichtigsten
                Funktionen:
              </p>

              <div className="space-y-4 mt-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-emerald-400 mb-2">
                    Dashboard (Echtzeit-Energiefluss)
                  </h3>
                  <p className="text-sm text-slate-300">
                    Das Sankey-Diagramm visualisiert die aktuellen Energieflüsse zwischen PV-Anlage,
                    Netz, Batterie und Verbrauchern. Die Breite der Linien repräsentiert die
                    übertragene Leistung.
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-blue-400 mb-2">Gebäudeautomation (KNX)</h3>
                  <p className="text-sm text-slate-300">
                    Über den interaktiven Grundriss können Sie direkt mit Ihrem Smart Home
                    interagieren. Klicken Sie auf Lampen, Fenster oder Thermostate, um deren Status
                    zu ändern. Die Änderungen werden via Node-RED an den KNX-Bus gesendet.
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-orange-400 mb-2">Steuerung & Optimierung</h3>
                  <p className="text-sm text-slate-300">
                    Hier konfigurieren Sie die Ladestrategie für Ihr Elektrofahrzeug (Wallbox) und
                    den Betriebsmodus der Wärmepumpe (SG Ready). Die App berücksichtigt dabei
                    dynamische Stromtarife und PV-Überschuss.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lexicon' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">Lexikon & Glossar</h2>

              <dl className="space-y-4">
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">
                    HEMS (Home Energy Management System)
                  </dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Ein System zur Überwachung, Steuerung und Optimierung des Energieverbrauchs in
                    einem Gebäude.
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">ESS (Energy Storage System)</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Ein Energiespeichersystem, typischerweise bestehend aus Batterien und
                    Wechselrichtern (z.B. Victron MultiPlus-II).
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">SG Ready (Smart Grid Ready)</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Ein Standard für Wärmepumpen, der es ermöglicht, diese netzdienlich zu steuern
                    (z.B. Einschalten bei PV-Überschuss).
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">§14a EnWG</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Paragraph im Energiewirtschaftsgesetz, der die netzdienliche Steuerung von
                    steuerbaren Verbrauchseinrichtungen (Wallboxen, Wärmepumpen) durch den
                    Netzbetreiber regelt (Dimmen auf 4,2 kW).
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">KNX</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Ein weltweiter Standard für die Haus- und Gebäudeautomation (Sensorik und
                    Aktorik).
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">SoC (State of Charge)</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    Der aktuelle Ladezustand einer Batterie in Prozent.
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">Häufig gestellte Fragen (FAQ)</h2>

              <div className="space-y-4">
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    Was passiert bei einem Stromausfall?
                    <span className="transition group-open:rotate-180">
                      <svg
                        fill="none"
                        height="24"
                        shapeRendering="geometricPrecision"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-400">
                    Das Victron ESS schaltet innerhalb von Millisekunden in den Inselbetrieb um.
                    Wichtige Verbraucher werden weiterhin aus der Batterie versorgt. Das Dashboard
                    bleibt erreichbar, solange der Router und der Cerbo GX mit Strom versorgt
                    werden.
                  </div>
                </details>

                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    Wie funktioniert die §14a EnWG Dimmung?
                    <span className="transition group-open:rotate-180">
                      <svg
                        fill="none"
                        height="24"
                        shapeRendering="geometricPrecision"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-400">
                    Wenn der Netzbetreiber ein Dimmsignal sendet, reduziert das HEMS den maximalen
                    Netzbezug auf 4,2 kW. Die App verteilt die verfügbare Leistung (inklusive
                    PV-Erzeugung und Batterieleistung) intelligent auf Wallbox und Wärmepumpe, um
                    Komforteinbußen zu minimieren.
                  </div>
                </details>

                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    Sind meine Daten sicher?
                    <span className="transition group-open:rotate-180">
                      <svg
                        fill="none"
                        height="24"
                        shapeRendering="geometricPrecision"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-400">
                    Ja. Das System verwendet eine lokale Public Key Infrastructure (PKI) mit mTLS.
                    Die Kommunikation zwischen Dashboard und Backend ist verschlüsselt. Historische
                    Daten werden primär lokal in Ihrem Browser (IndexedDB) gespeichert.
                  </div>
                </details>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">Über die App</h2>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <Zap size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">Nexus-HEMS Dash</h3>
                    <p className="text-slate-400">Version 1.0.0</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                  <p>
                    Das Nexus-HEMS Dash ist eine hochmoderne Visualisierungs- und Steuerungsschicht
                    für integrierte Energiemanagementsysteme. Es wurde entwickelt, um die
                    Komplexität von Sektorenkopplung (Strom, Wärme, Mobilität) beherrschbar zu
                    machen.
                  </p>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="font-medium text-slate-200 mb-2">Technologie-Stack</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Frontend: React 19, Tailwind CSS, Lucide Icons</li>
                      <li>State Management: Zustand</li>
                      <li>Visualisierung: D3.js (Sankey), Framer Motion</li>
                      <li>Backend/Kommunikation: Node.js, WebSockets</li>
                      <li>Lokale Speicherung: Dexie.js (IndexedDB)</li>
                    </ul>
                  </div>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="font-medium text-slate-200 mb-2">Lizenz & Danksagung</h4>
                    <p className="text-slate-400">
                      Basierend auf der strategischen Ausarbeitung zur Integration von Victron
                      Energy, KNX und dynamischen Stromtarifen. Entwickelt für die Dekarbonisierung
                      des privaten Sektors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
