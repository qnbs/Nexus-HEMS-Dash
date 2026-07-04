interface HelpPerfTipProps {
  text: string;
}

export const HelpPerfTip = ({ text }: HelpPerfTipProps) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-(--color-primary)">•</span>
    <p>{text}</p>
  </div>
);
