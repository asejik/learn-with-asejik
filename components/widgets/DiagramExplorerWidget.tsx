"use client";

import { useState } from "react";
import { Check, Info, Compass, CheckCircle2 } from "lucide-react";
import { BaseWidgetProps, ExploredHandler } from "./types";
import { z } from "zod";
import { DiagramExplorerWidgetDataSchema } from "@/lib/schema";

type DiagramData = z.infer<typeof DiagramExplorerWidgetDataSchema>;

// Exploring is not a test, so finishing reports an Info outcome
// (onExplored), never a correct answer.
export default function DiagramExplorerWidget({
  data,
  onExplored,
  isAnswered,
}: BaseWidgetProps<DiagramData> & { onExplored: ExploredHandler }) {
  const [activeNodeId, setActiveNodeId] = useState<string>(
    data.nodes[0]?.id || ""
  );
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([
    data.nodes[0]?.id || "",
  ]);

  const activeNode =
    data.nodes.find((n) => n.id === activeNodeId) || data.nodes[0];
  const allNodesVisited = data.nodes.every((n) => visitedNodeIds.includes(n.id));

  const handleSelectNode = (nodeId: string) => {
    setActiveNodeId(nodeId);
    if (!visitedNodeIds.includes(nodeId)) {
      const updated = [...visitedNodeIds, nodeId];
      setVisitedNodeIds(updated);

      // The final unexplored step completes the screen
      if (data.nodes.every((n) => updated.includes(n.id))) {
        onExplored({ explanation: data.completionMessage, bonusFact: data.completionBonusFact });
      }
    }
  };

  const handleCompleteManual = () => {
    if (!allNodesVisited || isAnswered) return;
    onExplored({ explanation: data.completionMessage, bonusFact: data.completionBonusFact });
  };

  return (
    <div className="space-y-5">
      {/* Header & Instruction */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interactive Diagram Explorer
            </span>
          </div>
          <span
            className={`text-xs font-extrabold px-2.5 py-1 rounded-full transition-colors ${
              allNodesVisited
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {visitedNodeIds.length} of {data.nodes.length} Inspected
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-700">
          {data.instruction}
        </p>
      </div>

      {/* SVG Diagram Canvas */}
      {data.diagramSvg && (
        <div
          className="p-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
          dangerouslySetInnerHTML={{
            __html: data.diagramSvg,
          }}
        />
      )}

      {/* Node Selection Tabs / Pills (Thumb Ergonomics >= 44x44px) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Tap each component to inspect:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {data.nodes.map((node) => {
            const isActive = activeNodeId === node.id;
            const isVisited = visitedNodeIds.includes(node.id);

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelectNode(node.id)}
                className={`min-h-tap p-3 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-between gap-2 active:scale-98 text-left ${
                  isActive
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-200"
                    : isVisited
                    ? "bg-brand-50 text-brand-900 border-brand-200 hover:bg-brand-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{node.label}</span>
                {isVisited ? (
                  <Check
                    className={`w-3.5 h-3.5 shrink-0 stroke-[3] ${
                      isActive ? "text-white" : "text-brand-600"
                    }`}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Inspector Detail Card */}
      {activeNode && (
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {activeNode.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {activeNode.definition}
          </p>
          {activeNode.bonusFact && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-800">Key Insight: </span>
              {activeNode.bonusFact}
            </div>
          )}
        </div>
      )}

      {/* Gated Unlocking State Action */}
      {!isAnswered && (
        <div className="pt-2">
          {allNodesVisited ? (
            <button
              type="button"
              onClick={handleCompleteManual}
              className="w-full min-h-tap px-4 py-3.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Continue with Inspection Complete</span>
            </button>
          ) : (
            <div className="w-full min-h-tap p-3 rounded-full bg-slate-100 border border-slate-200 text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
              <span>
                Tap the remaining {data.nodes.length - visitedNodeIds.length}{" "}
                step(s) above to unlock Continue.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
