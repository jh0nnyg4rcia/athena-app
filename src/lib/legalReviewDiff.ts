export type DiffLine = { kind: "same" | "add" | "remove"; text: string };

function collapseSame(lines: DiffLine[]): DiffLine[] {
  const out: DiffLine[] = [];
  let buffer: DiffLine[] = [];
  const flush = () => {
    if (buffer.length > 4) {
      out.push({ kind: "same", text: `… ${buffer.length} linhas inalteradas …` });
    } else {
      out.push(...buffer);
    }
    buffer = [];
  };
  for (const line of lines) {
    if (line.kind === "same") {
      buffer.push(line);
      continue;
    }
    flush();
    out.push(line);
  }
  flush();
  return out;
}

function fallbackDiff(before: string[], after: string[]): DiffLine[] {
  const remaining = new Map<string, number>();
  for (const line of after) remaining.set(line, (remaining.get(line) || 0) + 1);
  const out: DiffLine[] = [];
  for (const line of before) {
    const count = remaining.get(line) || 0;
    if (count > 0) {
      remaining.set(line, count - 1);
      out.push({ kind: "same", text: line });
    } else {
      out.push({ kind: "remove", text: line });
    }
  }
  for (const line of after) {
    const count = remaining.get(line) || 0;
    if (count > 0) {
      remaining.set(line, count - 1);
      out.push({ kind: "add", text: line });
    }
  }
  return out;
}

function buildDiff(before: string, after: string): DiffLine[] {
  const a = (before || "").split("\n");
  const b = (after || "").split("\n");
  if (a.length * b.length > 1_200_000) return fallbackDiff(a, b);

  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    const row = dp[i];
    const next = dp[i + 1];
    for (let j = m - 1; j >= 0; j -= 1) {
      row[j] = a[i] === b[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "remove", text: a[i] });
      i += 1;
    } else {
      out.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    out.push({ kind: "remove", text: a[i] });
    i += 1;
  }
  while (j < m) {
    out.push({ kind: "add", text: b[j] });
    j += 1;
  }
  return out;
}

/** Diff completo, sem colapsar trechos iguais. Serve para cobrir alterações. */
export function diffOperations(before: string, after: string): DiffLine[] {
  return buildDiff(before, after);
}

export interface ChangeHunk {
  kind: "add" | "remove" | "replace";
  original: string;
  revised: string;
}

/**
 * Agrupa remove/add consecutivos. Uma correção no meio do parágrafo deixa de ser
 * exigida linha a linha: o bloco guarda o texto removido e o texto acrescentado.
 */
export function changeHunks(before: string, after: string): ChangeHunk[] {
  const hunks: ChangeHunk[] = [];
  let removed: string[] = [];
  let added: string[] = [];
  const flush = () => {
    if (!removed.length && !added.length) return;
    const kind = removed.length && added.length ? "replace" : removed.length ? "remove" : "add";
    hunks.push({
      kind,
      original: removed.join("\n"),
      revised: added.join("\n"),
    });
    removed = [];
    added = [];
  };
  for (const line of diffOperations(before, after)) {
    if (line.kind === "same") {
      flush();
      continue;
    }
    if (line.kind === "remove") removed.push(line.text);
    else added.push(line.text);
  }
  flush();
  return hunks;
}

/** Diff por linha para a tela, com trechos iguais longos resumidos. */
export function diffLines(before: string, after: string): DiffLine[] {
  return collapseSame(buildDiff(before, after));
}
