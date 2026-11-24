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

/** For widgets with nothing to get right or wrong (e.g. exploring a diagram) */
export type ExploredHandler = (result: { explanation: string; bonusFact?: string }) => void;

/** What the player gives every widget; a widget uses only the props it needs */
export type WidgetProps<T> = BaseWidgetProps<T> & { onExplored: ExploredHandler };
