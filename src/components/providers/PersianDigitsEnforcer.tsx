"use client";

import { useEffect } from "react";
import { toPersianDigits } from "@/lib/persian-digits";

function shouldSkipNode(parent: ParentNode | null): boolean {
  if (!(parent instanceof HTMLElement)) return false;
  const tag = parent.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return true;
  if (parent.isContentEditable) return true;
  if (tag === "INPUT") return true;
  if (parent.closest("[data-persian-digits='react']")) return true;
  return false;
}

function normalizeTextNode(node: Text) {
  if (!node.nodeValue) return;
  if (!/\d/.test(node.nodeValue)) return;
  if (shouldSkipNode(node.parentNode)) return;
  node.nodeValue = toPersianDigits(node.nodeValue);
}

function normalizeDocument(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    normalizeTextNode(current as Text);
    current = walker.nextNode();
  }
}

function scheduleAfterHydration(task: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const idleId = requestIdleCallback(task, { timeout: 3000 });
    return () => cancelIdleCallback(idleId);
  }
  const timeoutId = window.setTimeout(task, 500);
  return () => window.clearTimeout(timeoutId);
}

export function PersianDigitsEnforcer() {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    const cancelSchedule = scheduleAfterHydration(() => {
      normalizeDocument(document.body);

      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "characterData" && mutation.target instanceof Text) {
            normalizeTextNode(mutation.target);
            continue;
          }

          Array.from(mutation.addedNodes).forEach((node) => {
            if (node instanceof Text) {
              normalizeTextNode(node);
              return;
            }
            if (!(node instanceof HTMLElement)) return;
            normalizeDocument(node);
          });
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    return () => {
      cancelSchedule();
      observer?.disconnect();
    };
  }, []);

  return null;
}
