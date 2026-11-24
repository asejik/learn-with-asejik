import type { ComponentType } from "react";
import type { Screen, WidgetType } from "@/lib/schema";
import type { WidgetProps } from "./types";
import ReadingWidget from "./ReadingWidget";
import ClozeWidget from "./ClozeWidget";
import ChoiceWidget from "./ChoiceWidget";
import SwipeDeckWidget from "./SwipeDeckWidget";
import DiagramExplorerWidget from "./DiagramExplorerWidget";
import MatchPairsWidget from "./MatchPairsWidget";

type DataOf<K extends WidgetType> = Extract<Screen, { widgetType: K }>["widgetData"];

// The player looks widgets up here, so a new widget never touches the player
// shell. A widget type missing from this list (or not in lib/schema.ts) is a
// compile error.
export const WIDGETS: { [K in WidgetType]: ComponentType<WidgetProps<DataOf<K>>> } = {
  reading: ReadingWidget,
  cloze: ClozeWidget,
  choice: ChoiceWidget,
  swipeDeck: SwipeDeckWidget,
  diagramExplorer: DiagramExplorerWidget,
  matchPairs: MatchPairsWidget,
};
