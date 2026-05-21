"use client";

import { useEffect } from "react";
import { toPersianDigits } from "@/lib/persian-digits";

function shouldSkipNode(parent: ParentNode | null): boolean {
  if (!(parent instanceof HTMLElement)) return false;
  const tag = parent.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return true;
  if (parent.isContentEditable) return true;
  if (tag === "INPUT") return true;
  return false;
}

function normalizeTextNode(node: Text) {
  if (!node.nodeValue) return;
  if (!/\d/.test(node.nodeValue)) return;
  if (shouldSkipNode(node.parentNode)) return;
  node.nodeValue = toPersianDigits(node.nodeValue);
}

export function PersianDigitsEnforcer() {
  useEffect(() => {
    const root = document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      normalizeTextNode(current as Text);
      current = walker.nextNode();
    }

    const observer = new MutationObserver((mutations) => {
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
          const subtreeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          let textNode = subtreeWalker.nextNode();
          while (textNode) {
            normalizeTextNode(textNode as Text);
            textNode = subtreeWalker.nextNode();
          }
        });
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
