export interface BaseWidgetProps<T> {
  screenId: string;
  data: T;
  glossary?: Array<{ term: string; definition: string }>;
  onOpenGlossary?: (term: string) => void;
  onSubmitAnswer: (result: {
    isCorrect: boolean;
    explanation: string;
    bonusFact?: string;
  }) => void;
  isAnswered: boolean;
  onContinue?: () => void;
}
