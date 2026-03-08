import { useState } from 'react';
import { HelpCircle, BookOpen, Info, MessageCircleQuestion, FileText, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Help() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('usage');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="text-emerald-400" size={28} />
        <h1 className="text-3xl font-light tracking-tight">{t('help.title')}</h1>
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
              <span className="font-medium">{t('help.usage')}</span>
            </button>
            <button
              onClick={() => setActiveTab('lexicon')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'lexicon' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <FileText size={18} />
              <span className="font-medium">{t('help.glossaryTitle')}</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'faq' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <MessageCircleQuestion size={18} />
              <span className="font-medium">{t('help.faq')}</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === 'info' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <Info size={18} />
              <span className="font-medium">{t('help.about')}</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-8 rounded-2xl min-h-[500px]">
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">{t('help.usageTitle')}</h2>
              <p className="text-slate-300 leading-relaxed">
                {t('help.usageIntro')}
              </p>

              <div className="space-y-4 mt-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-emerald-400 mb-2">
                    {t('help.dashboardTitle')}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {t('help.dashboardDesc')}
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-blue-400 mb-2">{t('help.automationTitle')}</h3>
                  <p className="text-sm text-slate-300">
                    {t('help.automationDesc')}
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-medium text-orange-400 mb-2">{t('help.controlTitle')}</h3>
                  <p className="text-sm text-slate-300">
                    {t('help.controlDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lexicon' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">{t('help.glossaryTitle')}</h2>

              <dl className="space-y-4">
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">
                    {t('help.hems')}
                  </dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.hemsDesc')}
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">{t('help.ess')}</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.essDesc')}
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">{t('help.sgReady')}</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.sgReadyDesc')}
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">{t('help.enwg')}</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.enwgDesc')}
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">{t('help.knx')}</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.knxDesc')}
                  </dd>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <dt className="font-medium text-emerald-400">{t('help.soc')}</dt>
                  <dd className="text-sm text-slate-300 mt-1">
                    {t('help.socDesc')}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">{t('help.faqTitle')}</h2>

              <div className="space-y-4">
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    {t('help.faqPowerOutage')}
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
                    {t('help.faqPowerOutageAnswer')}
                  </div>
                </details>

                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    {t('help.faqEnwg')}
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
                    {t('help.faqEnwgAnswer')}
                  </div>
                </details>

                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-200">
                    {t('help.faqSecurity')}
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
                    {t('help.faqSecurityAnswer')}
                  </div>
                </details>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-medium mb-4">{t('help.aboutTitle')}</h2>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <Zap size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{t('common.appName')}</h3>
                    <p className="text-slate-400">{t('help.version')}</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                  <p>
                    {t('help.aboutDesc')}
                  </p>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="font-medium text-slate-200 mb-2">{t('help.techStack')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>{t('help.techFrontend')}</li>
                      <li>{t('help.techState')}</li>
                      <li>{t('help.techVis')}</li>
                      <li>{t('help.techBackend')}</li>
                      <li>{t('help.techStorage')}</li>
                    </ul>
                  </div>

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <h4 className="font-medium text-slate-200 mb-2">{t('help.license')}</h4>
                    <p className="text-slate-400">
                      {t('help.licenseDesc')}
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
