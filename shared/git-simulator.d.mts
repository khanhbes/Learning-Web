/** Read-only rendering contract for the trusted virtual repository fixture. */
export interface GitSnapshot {
  label: string;
  notice: string;
  branch: string;
  head: string | null;
  files: {
    path: string;
    working: string | null;
    index: string | null;
    committed: string | null;
    staged: boolean;
    modified: boolean;
    untracked: boolean;
    conflict: boolean;
    ignored: boolean;
  }[];
  nodes: {id: string; parents: string[]; message: string; branches: string[]; tags: string[]}[];
  branches: Record<string, string>;
  remoteBranches: Record<string, string>;
  conflicts: string[];
  stashCount: number;
}
export function gitFrame(state: unknown, label?: string): GitSnapshot;
