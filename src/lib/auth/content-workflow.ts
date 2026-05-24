export type AppRole = "user" | "editor" | "reviewer" | "admin";
export type PostWorkflowStatus = "draft" | "review" | "published";

export function canAccessContentWorkflow(role: string | undefined): boolean {
  return role === "admin" || role === "editor" || role === "reviewer";
}

export function canCreateContent(role: string | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canDeleteContent(role: string | undefined): boolean {
  return role === "admin";
}

export function canTransitionPostStatus(
  role: string | undefined,
  fromStatus: string | null | undefined,
  toStatus: string
): boolean {
  const from = fromStatus ?? "draft";
  if (role === "admin") return true;
  if (role === "editor") {
    return (
      (from === "draft" && (toStatus === "draft" || toStatus === "review")) ||
      (from === "review" && toStatus === "draft")
    );
  }
  if (role === "reviewer") {
    return (
      (from === "review" && (toStatus === "review" || toStatus === "published")) ||
      (from === "published" && toStatus === "review")
    );
  }
  return false;
}

export function editablePostStatusesForRole(role: string | undefined): string[] {
  if (role === "admin") return ["draft", "review", "published"];
  if (role === "editor") return ["draft", "review"];
  if (role === "reviewer") return ["review", "published"];
  return [];
}

export function isPostEditableByRole(role: string | undefined, status: string): boolean {
  if (role === "admin") return true;
  if (role === "editor") return status === "draft" || status === "review";
  if (role === "reviewer") return status === "review" || status === "published";
  return false;
}
