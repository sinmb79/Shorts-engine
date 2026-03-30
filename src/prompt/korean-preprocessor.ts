const DIGIT_TO_KOREAN = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"] as const;
const SMALL_UNITS = ["", "십", "백", "천"] as const;
const LARGE_UNITS = ["", "만", "억", "조"] as const;

export const ACRONYM_MAP = {
  "AI": "에이아이",
  "API": "에이피아이",
  "GPT": "지피티",
  "ChatGPT": "챗지피티",
  "Claude": "클로드",
  "GitHub": "깃허브",
  "OpenAI": "오픈에이아이",
  "YouTube": "유튜브",
  "TikTok": "틱톡",
  "SEO": "에스이오",
  "SaaS": "사스",
  "UI": "유아이",
  "UX": "유엑스",
  "LLM": "엘엘엠",
  "NFT": "엔에프티",
  "DeFi": "디파이",
  "IoT": "아이오티",
  "AR": "에이알",
  "VR": "브이알",
  "ML": "머신러닝",
  "NLP": "엔엘피",
  "DevOps": "데브옵스",
  "SQL": "에스큐엘",
  "HTML": "에이치티엠엘",
  "CSS": "씨에스에스",
  "JSON": "제이슨",
  "URL": "유알엘",
  "HTTP": "에이치티티피",
  "HTTPS": "에이치티티피에스",
  "PC": "피씨",
  "CPU": "씨피유",
  "GPU": "지피유",
  "RAM": "램",
  "SSD": "에스에스디",
  "USB": "유에스비",
  "WiFi": "와이파이",
  "Bluetooth": "블루투스",
  "iOS": "아이오에스",
  "Android": "안드로이드",
  "App": "앱",
  "IT": "아이티",
  "ICT": "아이씨티",
  "SNS": "에스엔에스",
  "KPI": "케이피아이",
  "ROI": "알오아이",
  "B2B": "비투비",
  "B2C": "비투씨",
  "MVP": "엠브이피",
  "OKR": "오케이알",
  "CTO": "씨티오",
  "CEO": "씨이오",
  "CFO": "씨에프오",
  "HR": "에이치알",
  "PR": "피알",
  "IR": "아이알",
  "Instagram": "인스타그램",
  "Facebook": "페이스북",
  "Twitter": "트위터",
  "LinkedIn": "링크드인",
  "Netflix": "넷플릭스",
  "Spotify": "스포티파이",
  "Uber": "우버",
  "Airbnb": "에어비앤비",
  "Amazon": "아마존",
  "Google": "구글",
  "Apple": "애플",
  "Microsoft": "마이크로소프트",
  "Samsung": "삼성",
  "LG": "엘지",
  "SK": "에스케이",
  "KT": "케이티",
  "ETF": "이티에프",
  "IPO": "아이피오",
  "S&P": "에스앤피",
  "NASDAQ": "나스닥",
  "KOSPI": "코스피",
  "KOSDAQ": "코스닥",
  "GDP": "지디피",
  "IMF": "아이엠에프",
  "ECB": "이씨비",
  "Fed": "연준",
  "P/E": "주가수익비율",
  "DNA": "디엔에이",
  "RNA": "알엔에이",
  "BMI": "비엠아이",
  "COVID": "코비드",
  "PCR": "피씨알",
  "MBA": "엠비에이",
  "PhD": "박사",
  "IELTS": "아이엘츠",
  "TOEIC": "토익",
  "TOEFL": "토플",
  "OTT": "오티티",
  "VOD": "브이오디",
  "BGM": "비지엠",
  "OST": "오에스티",
  "DJ": "디제이",
  "MC": "엠씨",
  "PD": "피디",
  "CP": "씨피",
  "App Store": "앱 스토어",
  "Play Store": "플레이 스토어",
  "ChatBot": "챗봇",
  "Web3": "웹쓰리",
  "Metaverse": "메타버스",
  "Blockchain": "블록체인",
  "Crypto": "크립토",
  "Bitcoin": "비트코인",
  "Ethereum": "이더리움",
  "Cloud": "클라우드",
  "Big Data": "빅데이터",
  "Startup": "스타트업",
  "Fintech": "핀테크",
  "Edtech": "에드테크",
  "Healthtech": "헬스테크",
  "PropTech": "프롭테크",
  "LegalTech": "리걸테크",
  "FOMO": "포모",
  "YOLO": "욜로",
  "MZ": "엠제트",
  "Python": "파이썬",
  "JavaScript": "자바스크립트",
  "TypeScript": "타입스크립트",
  "React": "리액트",
  "Node.js": "노드제이에스",
  "Docker": "도커",
  "Kubernetes": "쿠버네티스",
  "AWS": "에이더블유에스",
  "GCP": "지씨피",
  "Azure": "애저",
  "Slack": "슬랙",
  "Zoom": "줌",
  "Discord": "디스코드",
  "Notion": "노션",
  "Figma": "피그마",
  "Canva": "캔바",
  "OEM": "오이엠",
  "ODM": "오디엠",
  "SCM": "에스씨엠",
  "ERP": "이알피",
  "CRM": "씨알엠",
  "Reels": "릴스",
  "Stories": "스토리",
  "Live": "라이브",
  "Feed": "피드",
  "DM": "디엠",
  "PM": "피엠",
  "QA": "큐에이",
  "Blog": "블로그",
  "Vlog": "브이로그",
  "Podcast": "팟캐스트",
  "Newsletter": "뉴스레터",
  "Shorts": "쇼츠",
  "Reel": "릴",
  "OK": "오케이",
  "NO": "노",
  "YES": "예스",
  "WOW": "와우",
  "LOL": "엘오엘",
  "BTW": "그런데",
  "FYI": "참고로",
  "ASAP": "최대한 빨리",
  "FAQ": "자주 묻는 질문",
  "Q&A": "질의응답",
  "A/S": "에이에스",
  "DIY": "디아이와이",
  "PPT": "피피티",
  "PDF": "피디에프",
  "ZIP": "집",
  "Gemini": "제미나이",
  "Grok": "그록",
  "Copilot": "코파일럿",
  "Perplexity": "퍼플렉시티",
  "Midjourney": "미드저니",
  "Stable Diffusion": "스테이블 디퓨전",
  "DALL-E": "달리",
  "Sora": "소라",
  "Kling": "클링",
  "Runway": "런웨이",
  "Git": "깃",
  "Linux": "리눅스",
  "Ubuntu": "우분투",
  "Windows": "윈도우",
  "macOS": "맥오에스",
  "Terminal": "터미널",
  "CI/CD": "씨아이씨디",
  "API Gateway": "에이피아이 게이트웨이",
  "PER": "주가수익비율",
  "PBR": "주가순자산비율",
  "EPS": "주당순이익",
  "ROE": "자기자본이익률",
  "CAGR": "연평균성장률",
  "CPC": "클릭당비용",
  "CPM": "천회노출당비용",
  "CTA": "씨티에이",
  "CTR": "클릭률",
  "ROAS": "광고수익률",
  "LTV": "고객생애가치",
} as const satisfies Record<string, string>;

const UNIT_MAP = {
  "km": "킬로미터",
  "kg": "킬로그램",
  "MB": "메가바이트",
  "GB": "기가바이트",
  "TB": "테라바이트",
  "Hz": "헤르츠",
  "MHz": "메가헤르츠",
  "GHz": "기가헤르츠",
} as const satisfies Record<string, string>;

const COUNTER_MAP = {
  "가지": "가지",
  "시간": "시간",
  "명": "명",
  "개": "개",
  "번": "번",
  "배": "배",
  "위": "위",
  "초": "초",
  "분": "분",
  "일": "일",
  "월": "월",
  "년": "년",
} as const satisfies Record<string, string>;

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/giu;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const PLACEHOLDER_PARTICLE_PATTERN =
  /(링크|이메일 주소)\s+(에서|으로|로|와|과|를|을|에|은|는|이|가|도|만)/gu;

const PAUSE_DURATIONS = {
  hook_after: 500,
  question_after: 400,
  normal_after: 300,
  section_break: 600,
  comma: 150,
  exclamation: 200,
} as const;

export interface ScriptSections {
  hook?: string;
  body?: string[];
  closer?: string;
}

export type PauseEngine = "ssml" | "marker";

export function preprocessKorean(text: string): string {
  let processed = text.normalize("NFC").replace(/\r?\n+/gu, " ").trim();

  processed = processed.replace(EMAIL_PATTERN, "이메일 주소");
  processed = processed.replace(URL_PATTERN, "링크");
  processed = replaceMappedTerms(processed, ACRONYM_MAP);
  processed = convertNumbers(processed);
  processed = processed.replace(PLACEHOLDER_PARTICLE_PATTERN, "$1$2");

  return standardizePunctuation(processed);
}

export function insertPauses(
  script: ScriptSections,
  engine: PauseEngine = "ssml",
): ScriptSections {
  const result: ScriptSections = {
    ...(script.hook ? { hook: script.hook } : {}),
    ...(script.body ? { body: [...script.body] } : {}),
    ...(script.closer ? { closer: script.closer } : {}),
  };

  if (result.hook) {
    result.hook = `${result.hook}${pauseMarker(PAUSE_DURATIONS.hook_after, engine)}`;
  }

  if (result.body) {
    result.body = result.body.map((sentence, index) => {
      const withInlinePauses = addInlinePauses(sentence, engine);
      const isLast = index === result.body!.length - 1;
      const pause = isLast
        ? PAUSE_DURATIONS.section_break
        : PAUSE_DURATIONS.normal_after;
      return `${withInlinePauses}${pauseMarker(pause, engine)}`;
    });
  }

  return result;
}

function replaceMappedTerms(
  text: string,
  map: Readonly<Record<string, string>>,
): string {
  let processed = text;
  const entries = Object.entries(map).sort(([left], [right]) => right.length - left.length);

  for (const [source, target] of entries) {
    const pattern = new RegExp(
      `(?<![A-Za-z0-9_])${escapeRegex(source)}(?![A-Za-z0-9_])`,
      "gu",
    );
    processed = processed.replace(pattern, target);
  }

  return processed;
}

function convertNumbers(text: string): string {
  let processed = text;

  processed = processed.replace(/(-?\d[\d,]*)\s*%/gu, (match, rawNumber: string) => {
    const parsed = parseInteger(rawNumber);
    return parsed === null ? match : `${integerToKorean(parsed)} 퍼센트`;
  });

  for (const [unit, koreanUnit] of Object.entries(UNIT_MAP)) {
    const pattern = new RegExp(`(-?\\d[\\d,]*)\\s*${escapeRegex(unit)}`, "gu");
    processed = processed.replace(pattern, (match, rawNumber: string) => {
      const parsed = parseInteger(rawNumber);
      return parsed === null ? match : `${integerToKorean(parsed)} ${koreanUnit}`;
    });
  }

  const counters = Object.keys(COUNTER_MAP).sort((left, right) => right.length - left.length);
  for (const counter of counters) {
    const koreanCounter = COUNTER_MAP[counter as keyof typeof COUNTER_MAP];
    const pattern = new RegExp(`(-?\\d[\\d,]*)\\s*${escapeRegex(counter)}`, "gu");
    processed = processed.replace(pattern, (match, rawNumber: string) => {
      const parsed = parseInteger(rawNumber);
      return parsed === null ? match : `${integerToKorean(parsed)} ${koreanCounter}`;
    });
  }

  processed = processed.replace(/(?<![A-Za-z])(-?\d[\d,]*)(?![A-Za-z])/gu, (match, rawNumber: string) => {
    const parsed = parseInteger(rawNumber);
    return parsed === null ? match : integerToKorean(parsed);
  });

  return processed;
}

function parseInteger(rawNumber: string): number | null {
  const normalized = rawNumber.replaceAll(",", "");
  if (!/^-?\d+$/u.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function integerToKorean(value: number): string {
  if (value === 0) {
    return "영";
  }

  if (value < 0) {
    return `마이너스 ${integerToKorean(-value)}`;
  }

  let remaining = value;
  let unitIndex = 0;
  let result = "";

  while (remaining > 0 && unitIndex < LARGE_UNITS.length) {
    const chunk = remaining % 10_000;
    if (chunk > 0) {
      result = `${fourDigitsToKorean(chunk)}${LARGE_UNITS[unitIndex]}${result}`;
    }
    remaining = Math.floor(remaining / 10_000);
    unitIndex += 1;
  }

  return result;
}

function fourDigitsToKorean(value: number): string {
  let remaining = value;
  let result = "";

  for (let index = SMALL_UNITS.length - 1; index >= 0; index -= 1) {
    const unitValue = 10 ** index;
    const digit = Math.floor(remaining / unitValue);
    remaining %= unitValue;

    if (digit === 0) {
      continue;
    }

    if (!(digit === 1 && index > 0)) {
      result += DIGIT_TO_KOREAN[digit];
    }

    result += SMALL_UNITS[index];
  }

  return result;
}

function standardizePunctuation(text: string): string {
  return text
    .replace(/[“”]/gu, "\"")
    .replace(/[‘’]/gu, "'")
    .replace(/\.{2,}/gu, ".")
    .replace(/,{2,}/gu, ",")
    .replace(/!{2,}/gu, "!")
    .replace(/\?{2,}/gu, "?")
    .replace(/\s+([,!?./])/gu, "$1")
    .replace(/([,!?])(?!\s|$)/gu, "$1 ")
    .replace(/\.(?!\s|$)/gu, ". ")
    .replace(/\s+/gu, " ")
    .trim();
}

function addInlinePauses(sentence: string, engine: PauseEngine): string {
  return sentence
    .replace(/,\s*/gu, `,${pauseMarker(PAUSE_DURATIONS.comma, engine)}`)
    .replace(/\?\s*/gu, `?${pauseMarker(PAUSE_DURATIONS.question_after, engine)}`)
    .replace(/!\s*/gu, `!${pauseMarker(PAUSE_DURATIONS.exclamation, engine)}`);
}

function pauseMarker(milliseconds: number, engine: PauseEngine): string {
  if (engine === "ssml") {
    return `<break time="${milliseconds}ms"/>`;
  }

  return ` [[PAUSE_${milliseconds}ms]] `;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
