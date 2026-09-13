interface FrequencyContentProps {
  frequency: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  Daily: "Quotidien",
  Weekly: "Hebdomadaire",
  "Bi-weekly": "Bi-hebdomadaire",
  "Three-weekly": "Tri-hebdomadaire",
  Monthly: "Mensuel",
  Quarterly: "Trimestriel",
  Yearly: "Annuel",
};

export const FrequencyContent = ({ frequency }: FrequencyContentProps) => {
  return <>{FREQUENCY_LABELS[frequency] ?? frequency}</>;
};
