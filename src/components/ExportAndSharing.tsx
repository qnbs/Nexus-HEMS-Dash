import { useState } from 'react';
import { motion } from 'motion/react';
import { FileDown, Share2, QrCode, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCodeLib from 'qrcode';

import { generateMonthlyStats, downloadPdfReport } from '../lib/pdf-report';
import { generateShareLink, createSharedDashboard } from '../lib/sharing';

export function ExportAndSharing() {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const stats = await generateMonthlyStats(now.getFullYear(), now.getMonth());
      await downloadPdfReport(stats);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const dashboard = await createSharedDashboard(
        'My HEMS Dashboard',
        'user@example.com', // In production, use actual user email
      );

      const link = generateShareLink(dashboard.id, dashboard.shareToken);
      setShareLink(link);

      // Generate QR code
      const qrUrl = await QRCodeLib.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#22ff88',
          light: '#0f172a',
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Share link generation error:', error);
      alert('Share link generation failed. Please try again.');
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6">
      <h3 className="mb-6 text-lg font-semibold text-[color:var(--color-text)]">
        {t('export.title', 'Export & Sharing')}
      </h3>

      <div className="space-y-4">
        {/* PDF Export */}
        <div>
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <FileDown className="h-5 w-5" aria-hidden="true" />
            {isGenerating
              ? t('export.generating', 'Generating...')
              : t('export.downloadPdf', 'Download Monthly Report (PDF)')}
          </button>
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            {t('export.pdfDescription', 'Includes Sankey diagram, cost summary, and CO₂ balance')}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[color:var(--color-border)]" />

        {/* Share Link */}
        <div>
          <button
            onClick={handleGenerateShareLink}
            className="btn-secondary flex w-full items-center justify-center gap-2"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            {t('export.generateShareLink', 'Generate Shareable Link')}
          </button>
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            {t('export.shareLinkDescription', 'Create read-only link for sharing your dashboard')}
          </p>

          {shareLink && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-2xl border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/5 p-4">
                {/* Link */}
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-[color:var(--color-text)] outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/50 text-[color:var(--color-primary)] hover:bg-slate-700/50"
                    aria-label={t('export.copyLink', 'Copy link')}
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
                      <QrCode className="h-4 w-4" />
                      {t('export.qrCode', 'QR Code')}
                    </div>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mt-3 rounded-lg border-2 border-[color:var(--color-primary)]"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
