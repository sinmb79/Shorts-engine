export const CONCEPT_TO_VISUAL = {
  "AI": ["artificial intelligence screen", "digital interface", "neural network visualization"],
  "인공지능": ["robot brain", "digital mind", "AI hologram"],
  "자동화": ["gears mechanism", "conveyor belt", "robot arm factory"],
  "코딩": ["computer code screen", "programmer keyboard", "dark terminal code"],
  "데이터": ["data visualization", "bar chart analytics", "network nodes"],
  "알고리즘": ["flowchart diagram", "binary code", "decision tree"],
  "앱": ["smartphone screen", "mobile app interface", "app store"],
  "소프트웨어": ["software development", "code editor", "programming laptop"],
  "돈": ["money cash bills", "coins pile", "dollar bills"],
  "수익": ["profit growth chart", "rising arrow money", "income cash"],
  "투자": ["stock market chart", "investment portfolio", "financial growth"],
  "절약": ["piggy bank savings", "money jar coins", "budget planning"],
  "부자": ["luxury lifestyle", "wealthy business person", "success achievement"],
  "무료": ["gift present box", "unlocked padlock", "free tag label"],
  "할인": ["sale discount tag", "percent off sign", "price reduction"],
  "비즈니스": ["business meeting", "office workspace", "professional handshake"],
  "창업": ["startup launch rocket", "entrepreneur office", "business idea lightbulb"],
  "마케팅": ["marketing strategy board", "social media icons", "advertising billboard"],
  "브랜드": ["brand logo design", "brand identity", "premium label"],
  "고객": ["customer service smile", "client meeting", "happy customer"],
  "성공": ["success achievement trophy", "winner podium", "goal celebration"],
  "실패": ["failure mistake frustrated", "broken plan", "problem obstacle"],
  "건강": ["healthy lifestyle", "fitness exercise", "fresh vegetables"],
  "다이어트": ["diet food salad", "weight loss scale", "healthy eating"],
  "운동": ["gym workout exercise", "running sport", "fitness training"],
  "수면": ["peaceful sleep bedroom", "sleeping person night", "rest relaxation"],
  "스트레스": ["stress anxiety person", "overwhelmed work", "headache pressure"],
  "행복": ["happy smiling person", "joy celebration", "positive energy"],
  "공부": ["studying books desk", "student learning", "open textbook"],
  "독서": ["reading book cozy", "bookshelf library", "person reading"],
  "교육": ["classroom teaching", "education school", "learning knowledge"],
  "자격증": ["certificate diploma award", "achievement credential", "professional certification"],
  "소통": ["communication talking", "conversation speech bubble", "people talking"],
  "관계": ["relationship people together", "friendship bond", "social connection"],
  "가족": ["family together happy", "family portrait", "home family"],
  "친구": ["friends together laughing", "friendship bond", "social gathering"],
  "자연": ["nature landscape scenic", "green forest trees", "outdoor beauty"],
  "환경": ["environment ecology", "green earth planet", "sustainability"],
  "도시": ["city skyline urban", "modern architecture", "downtown cityscape"],
  "여행": ["travel adventure journey", "wanderlust explore", "tourism destination"],
  "시간": ["clock time management", "hourglass countdown", "calendar schedule"],
  "생산성": ["productivity work desk", "efficient workflow", "organized workspace"],
  "습관": ["habit routine daily", "calendar habit tracker", "consistent practice"],
  "목표": ["goal target arrow", "achievement milestone", "success roadmap"],
  "음식": ["food meal delicious", "restaurant dining", "cooking kitchen"],
  "커피": ["coffee cup cafe", "espresso morning", "coffee shop cozy"],
  "요리": ["cooking chef kitchen", "recipe preparation", "homemade food"],
  "유튜브": ["youtube play button", "video content creator", "streaming platform"],
  "틱톡": ["social media video", "short video content", "viral content"],
  "인스타그램": ["instagram photo aesthetic", "social media post", "influencer lifestyle"],
  "콘텐츠": ["content creation studio", "digital content", "creative media"],
  "시작": ["starting launch beginning", "new start fresh", "launch rocket"],
  "변화": ["change transformation", "before after contrast", "evolution progress"],
  "성장": ["growth plant sprouting", "growth chart rising", "development progress"],
  "문제": ["problem solving puzzle", "challenge obstacle", "issue question mark"],
  "해결": ["solution lightbulb", "problem solved checkmark", "resolution answer"],
  "비교": ["comparison side by side", "versus contrast", "pros cons balance"],
  "순위": ["ranking top list", "leaderboard winners", "chart comparison"],
  "방법": ["how-to guide steps", "tutorial instruction", "method process"],
  "팁": ["tips tricks advice", "helpful hints", "pro tip star"],
  "비밀": ["secret reveal hidden", "mystery unlock", "insider knowledge"],
  "진실": ["truth reveal facts", "reality check", "honest disclosure"],
  "놀라운": ["surprising amazing wow", "unexpected revelation", "shocking discovery"],
  "1위": ["number one winner", "first place gold", "top ranked best"],
  "100%": ["one hundred percent complete", "full capacity", "perfect score"],
  "한국": ["korea seoul cityscape", "korean culture", "hanbok traditional"],
  "직장": ["office workplace corporate", "work desk professional", "business office"],
  "취업": ["job interview hiring", "employment opportunity", "career success"],
  "부동산": ["real estate property", "house home investment", "property market"],
  "가능성": ["possibility open door", "opportunity horizon", "potential unlimited"],
  "미래": ["future technology vision", "futuristic landscape", "innovation tomorrow"],
  "트렌드": ["trend arrow upward", "trending popular", "hot topic social"],
  "사무실": ["modern office interior", "soft overhead lighting", "focused workspace"],
  "서울 골목": ["narrow Seoul alleyway", "neon reflections on wet pavement", "urban night atmosphere"],
  "비 내리는 밤": ["heavy rain", "volumetric light through droplets", "cinematic wet street"],
} as const satisfies Record<string, readonly string[]>;

export const VISUAL_STYLE_MODIFIERS = [
  "cinematic",
  "4k",
  "professional",
  "high quality",
  "vibrant colors",
  "sharp focus",
  "natural lighting",
  "smooth motion",
] as const;

export const NEGATIVE_TERMS = [
  "blurry",
  "low quality",
  "watermark",
  "text overlay",
  "distorted",
  "pixelated",
  "grainy",
  "overexposed",
  "underexposed",
  "shaky camera",
] as const;

const CORNER_FALLBACKS = {
  technology: ["technology future", "digital workflow", "modern interface"],
  business: ["professional business", "modern office", "team collaboration"],
  finance: ["financial growth", "market analysis", "money strategy"],
  education: ["learning environment", "focused study", "classroom scene"],
  lifestyle: ["modern lifestyle", "daily routine", "personal growth"],
} as const satisfies Record<string, readonly string[]>;

const GENERIC_FALLBACK = [
  "professional business",
  "modern lifestyle",
  "technology future",
] as const;

export function translateToVisual(koreanConcept: string, corner?: string): string {
  const matched = findVisualMatches(koreanConcept);
  const baseTerms = matched.length > 0 ? matched : resolveFallbackVisuals(corner);

  return dedupe([
    ...baseTerms.slice(0, 6),
    ...VISUAL_STYLE_MODIFIERS.slice(0, 3),
  ]).join(", ");
}

export function sentenceToVisualQueries(
  sentence: string,
  count = 3,
): string[] {
  const matched = findVisualMatches(sentence);
  const queries = matched.length > 0 ? matched : resolveFallbackVisuals();

  return dedupe(queries).slice(0, Math.max(1, count));
}

export function buildNegativeVisualPrompt(extraTerms: string[] = []): string {
  return dedupe([...NEGATIVE_TERMS, ...extraTerms]).join(", ");
}

function findVisualMatches(input: string): string[] {
  const matched: string[] = [];
  const concepts = Object.keys(CONCEPT_TO_VISUAL).sort(
    (left, right) => right.length - left.length,
  ) as Array<keyof typeof CONCEPT_TO_VISUAL>;

  for (const concept of concepts) {
    if (input.includes(concept)) {
      matched.push(...CONCEPT_TO_VISUAL[concept]);
    }
  }

  return dedupe(matched);
}

function resolveFallbackVisuals(corner?: string): string[] {
  if (corner) {
    const normalizedCorner = corner.trim().toLowerCase();
    if (normalizedCorner in CORNER_FALLBACKS) {
      return [...CORNER_FALLBACKS[normalizedCorner as keyof typeof CORNER_FALLBACKS]];
    }
  }

  return [...GENERIC_FALLBACK];
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}
