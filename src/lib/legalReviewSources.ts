/**
 * Fontes oficiais usadas pela auditoria.
 * Hostname é a única prova de instituição. Sufixo genérico (.gov.br, .jus.br, .leg.br)
 * não torna uma página evidência adequada.
 */

export type SourceFamily =
  | "LEGISLACAO_FEDERAL"
  | "STF"
  | "STJ"
  | "CNJ"
  | "TSE"
  | "TST"
  | "STM"
  | "DIARIO_OFICIAL"
  | string;

export interface OfficialHost {
  family: SourceFamily;
  label: string;
  hosts: string[];
}

const FEDERAL_LEGISLATION: OfficialHost = {
  family: "LEGISLACAO_FEDERAL",
  label: "Legislação federal",
  hosts: ["planalto.gov.br", "camara.leg.br", "senado.leg.br"],
};

const ALWAYS_OFFICIAL: OfficialHost[] = [
  FEDERAL_LEGISLATION,
  { family: "STF", label: "STF", hosts: ["stf.jus.br"] },
  { family: "STJ", label: "STJ", hosts: ["stj.jus.br"] },
  { family: "CNJ", label: "CNJ", hosts: ["cnj.jus.br"] },
  { family: "TSE", label: "TSE", hosts: ["tse.jus.br"] },
  { family: "TST", label: "TST", hosts: ["tst.jus.br"] },
  { family: "STM", label: "STM", hosts: ["stm.jus.br"] },
  { family: "DIARIO_OFICIAL", label: "Diário Oficial", hosts: ["in.gov.br"] },
];

const STATE_COURT_SIGLAS = [
  "TJAC", "TJAL", "TJAM", "TJAP", "TJBA", "TJCE", "TJDFT", "TJES", "TJGO", "TJMA",
  "TJMG", "TJMS", "TJMT", "TJPA", "TJPB", "TJPE", "TJPI", "TJPR", "TJRJ", "TJRN",
  "TJRO", "TJRR", "TJRS", "TJSC", "TJSE", "TJSP", "TJTO",
];

function courtHost(sigla: string): OfficialHost {
  return {
    family: sigla,
    label: sigla,
    hosts: [`${sigla.toLowerCase()}.jus.br`],
  };
}

const CONDITIONAL_HOSTS: Array<OfficialHost & { pattern: RegExp }> = [
  { ...ALWAYS_OFFICIAL[3], pattern: /\bCNJ\b|Conselho Nacional de Justi[cç]a/i },
  { ...ALWAYS_OFFICIAL[4], pattern: /\bTSE\b|Tribunal Superior Eleitoral/i },
  { ...ALWAYS_OFFICIAL[5], pattern: /\bTST\b|Tribunal Superior do Trabalho/i },
  { ...ALWAYS_OFFICIAL[6], pattern: /\bSTM\b|Superior Tribunal Militar/i },
  { ...ALWAYS_OFFICIAL[7], pattern: /\bDOU\b|Di[aá]rio Oficial/i },
  ...STATE_COURT_SIGLAS.map((sigla) => ({
    ...courtHost(sigla),
    pattern: new RegExp(`\\b${sigla}\\b|Tribunal de Justi[cç]a.{0,40}${sigla.slice(2)}`, "i"),
  })),
  ...Array.from({ length: 6 }, (_, index) => {
    const n = index + 1;
    return {
      family: `TRF${n}`,
      label: `TRF${n}`,
      hosts: [`trf${n}.jus.br`],
      pattern: new RegExp(`\\bTRF-?${n}\\b`, "i"),
    };
  }),
  ...Array.from({ length: 24 }, (_, index) => {
    const n = index + 1;
    return {
      family: `TRT${n}`,
      label: `TRT${n}`,
      hosts: [`trt${n}.jus.br`],
      pattern: new RegExp(`\\bTRT-?${n}\\b`, "i"),
    };
  }),
];

const CORE_SEARCH_DOMAINS = ["planalto.gov.br", "camara.leg.br", "senado.leg.br", "stf.jus.br", "stj.jus.br"];

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const root = domain.toLowerCase();
  return host === root || host.endsWith(`.${root}`);
}

export function httpsHostname(raw: string): string | null {
  try {
    const url = new URL(String(raw || "").trim());
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

export function matchOfficialHost(raw: string): OfficialHost | null {
  const hostname = httpsHostname(raw);
  if (!hostname) return null;
  const catalog = [...ALWAYS_OFFICIAL, ...CONDITIONAL_HOSTS];
  return catalog.find((item) => item.hosts.some((domain) => hostMatches(hostname, domain))) || null;
}

export function isConfiguredOfficialUrl(raw: string): boolean {
  return Boolean(matchOfficialHost(raw));
}

/** Domínios do filtro da ferramenta. Núcleo federal sempre; demais órgãos só se a matéria os cita. */
export function searchDomainsForLesson(text: string): string[] {
  const domains = [...CORE_SEARCH_DOMAINS];
  const blob = text || "";
  for (const item of CONDITIONAL_HOSTS) {
    if (!item.pattern.test(blob)) continue;
    for (const host of item.hosts) {
      if (!domains.includes(host)) domains.push(host);
    }
  }
  return domains.slice(0, 20);
}

const NAMED_PATTERNS: Array<{ family: SourceFamily; pattern: RegExp }> = [
  { family: "STF", pattern: /\bSTF\b|Supremo Tribunal Federal|repercuss[aã]o geral/i },
  { family: "STJ", pattern: /\bSTJ\b|Superior Tribunal de Justi[cç]a|recurso repetitivo|tema repetitivo/i },
  { family: "CNJ", pattern: /\bCNJ\b|Conselho Nacional de Justi[cç]a/i },
  { family: "TSE", pattern: /\bTSE\b|Tribunal Superior Eleitoral/i },
  { family: "TST", pattern: /\bTST\b|Tribunal Superior do Trabalho/i },
  { family: "STM", pattern: /\bSTM\b|Superior Tribunal Militar/i },
  { family: "DIARIO_OFICIAL", pattern: /\bDOU\b|Di[aá]rio Oficial da Uni[aã]o/i },
  ...STATE_COURT_SIGLAS.map((sigla) => ({
    family: sigla,
    pattern: new RegExp(`\\b${sigla}\\b`, "i"),
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    family: `TRF${index + 1}`,
    pattern: new RegExp(`\\bTRF-?${index + 1}\\b`, "i"),
  })),
  ...Array.from({ length: 24 }, (_, index) => ({
    family: `TRT${index + 1}`,
    pattern: new RegExp(`\\bTRT-?${index + 1}\\b`, "i"),
  })),
];

/** Instituições citadas na alteração. Não interpreta a tese; só o órgão nomeado. */
export function institutionsNamedInClaim(text: string, category: string): SourceFamily[] {
  const found: SourceFamily[] = [];
  const blob = text || "";
  for (const item of NAMED_PATTERNS) {
    if (item.pattern.test(blob) && !found.includes(item.family)) found.push(item.family);
  }
  if (category === "LEGISLACAO" && !found.includes("LEGISLACAO_FEDERAL")) {
    found.push("LEGISLACAO_FEDERAL");
  }
  return found;
}
