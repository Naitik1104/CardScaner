const BusinessCardExtractor = (() => {

  const INDUSTRY_KEYWORDS = {
    'Technology': ['software', 'tech', 'digital', 'cyber', 'data', 'cloud', 'ai', 'it ', ' it,', 'computing', 'systems', 'solutions', 'dev', 'code', 'web', 'app', 'saas', 'infosec', 'network', 'blockchain', 'iot', 'robotics'],
    'Healthcare': ['health', 'medical', 'clinic', 'hospital', 'pharma', 'dental', 'therapy', 'wellness', 'care', 'doctor', 'md ', 'dds', 'optom', 'chiro', 'ortho', 'surgery', 'nursing', 'pediatric', 'cardio', 'neuro'],
    'Legal': ['law', 'legal', 'attorney', 'lawyer', 'counsel', 'llp', 'barrister', 'solicitor', 'notary', 'paralegal', 'litigation', 'advocacy', 'firm'],
    'Finance': ['finance', 'financial', 'bank', 'invest', 'capital', 'wealth', 'insurance', 'accounting', 'cpa', 'audit', 'tax', 'mortgage', 'credit', 'trading', 'asset', 'fund', 'equity'],
    'Real Estate': ['real estate', 'realty', 'property', 'homes', 'broker', 'realtor', 'commercial property', 'residential', 'leasing', 'landlord', 'construction'],
    'Education': ['school', 'university', 'college', 'academy', 'education', 'institute', 'learning', 'tutoring', 'professor', 'teacher', 'faculty', 'curriculum'],
    'Restaurant & Food': ['restaurant', 'cafe', 'catering', 'bakery', 'bistro', 'grill', 'kitchen', 'food', 'dining', 'eatery', 'bar ', 'pub', 'brewery', 'winery', 'deli', 'pizza', 'sushi', 'cuisine'],
    'Retail': ['store', 'shop', 'retail', 'boutique', 'market', 'outlet', 'merchandise', 'fashion', 'apparel', 'goods', 'supply', 'wholesale', 'ecommerce'],
    'Marketing': ['marketing', 'advertising', 'brand', 'media', 'pr ', 'public relations', 'creative', 'agency', 'content', 'seo', 'social media', 'communications', 'campaign'],
    'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'management consulting', 'business development', 'operations'],
    'Construction': ['construction', 'engineering', 'architect', 'build', 'contractor', 'plumbing', 'electrical', 'hvac', 'roofing', 'landscaping', 'interior design', 'renovation'],
    'Logistics': ['logistics', 'shipping', 'freight', 'transport', 'delivery', 'supply chain', 'warehouse', 'distribution', 'courier'],
  };

  const PHONE_PATTERNS = [
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?(?:ext|x|ext\.)\s?\d{1,5})?/gi,
    /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/gi,
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/gi,
  ];

  const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;

  const URL_PATTERNS = [
    /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,]*)*/gi,
    /www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,]*)*/gi,
  ];

  const ADDRESS_PATTERNS = [
    /\d{1,5}\s+(?:[A-Za-z0-9\s,\.#-]+?)(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir|Highway|Hwy|Suite|Ste|Floor|Fl)\b[A-Za-z0-9\s,\.#-]*/gi,
    /(?:Suite|Ste|Floor|Unit|Apt|#)\s*\d+[A-Za-z0-9\s,\.-]*/gi,
  ];

  const ZIP_PATTERN = /\b\d{5}(?:-\d{4})?\b/g;
  const STATE_ABBR = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/g;

  const NOISE_WORDS = new Set([
    'tel', 'phone', 'mobile', 'cell', 'fax', 'office', 'direct', 'email',
    'e-mail', 'www', 'web', 'website', 'address', 'location', 'follow', 'us',
    'visit', 'connect', 'contact', 'call', 'scan', 'find', 'like', 'share',
    'hello', 'hi', 'dear', 'sincerely', 'regards', 'p:', 'f:', 'm:', 'e:', 'w:',
  ]);

  const TITLE_KEYWORDS = new Set([
    'ceo', 'cto', 'cfo', 'coo', 'president', 'founder', 'co-founder', 'director',
    'manager', 'engineer', 'developer', 'designer', 'consultant', 'analyst',
    'officer', 'executive', 'partner', 'associate', 'assistant', 'coordinator',
    'specialist', 'representative', 'advisor', 'agent', 'broker', 'attorney',
    'doctor', 'dr.', 'professor', 'vp', 'svp', 'evp', 'principal', 'lead',
    'senior', 'junior', 'head of', 'chief',
  ]);

  function cleanText(text) {
    return text
      .replace(/[|•·▪▸►◆★☆]/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  function extractPhone(text) {
    for (const pattern of PHONE_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const phone = matches[0].trim();
        if (phone.replace(/\D/g, '').length >= 10) return phone;
      }
    }
    return '';
  }

  function extractEmail(text) {
    EMAIL_PATTERN.lastIndex = 0;
    const matches = text.match(EMAIL_PATTERN);
    return matches ? matches[0].toLowerCase() : '';
  }

  function extractWebsite(text, email) {
    const emailDomain = email ? email.split('@')[1] : null;
    const found = new Set();

    for (const pattern of URL_PATTERNS) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        let url = m[0].trim().replace(/[,;.]+$/, '');
        if (EMAIL_PATTERN.test(url)) continue;
        EMAIL_PATTERN.lastIndex = 0;
        const lower = url.toLowerCase();
        if (lower.includes('@')) continue;
        if (/\.(jpg|jpeg|png|gif|pdf|doc|svg)$/i.test(lower)) continue;
        found.add(url);
      }
    }

    const arr = Array.from(found);
    if (!arr.length) return emailDomain ? `www.${emailDomain}` : '';

    const preferred = arr.find(u => emailDomain && u.toLowerCase().includes(emailDomain.split('.')[0]));
    const result = preferred || arr[0];

    if (!/^https?:\/\//i.test(result)) return 'https://' + result.replace(/^www\./i, 'www.');
    return result;
  }

  function extractAddress(text) {
    let best = '';

    for (const pattern of ADDRESS_PATTERNS) {
      pattern.lastIndex = 0;
      const m = pattern.exec(text);
      if (m && m[0].length > best.length) best = m[0].trim();
    }

    if (!best) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (ZIP_PATTERN.test(line) || STATE_ABBR.test(line)) {
          ZIP_PATTERN.lastIndex = 0;
          STATE_ABBR.lastIndex = 0;
          if (line.length > best.length) best = line.trim();
        }
      }
    }

    return best.replace(/\s+/g, ' ').trim();
  }

  function detectIndustry(text) {
    const lower = text.toLowerCase();
    let best = { industry: 'General Business', score: 0 };

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += kw.length > 5 ? 2 : 1;
      }
      if (score > best.score) best = { industry, score };
    }

    return best.industry;
  }

  function isPersonTitle(line) {
    const lower = line.toLowerCase();
    return Array.from(TITLE_KEYWORDS).some(t => lower.includes(t));
  }

  function isNoiseLine(line) {
    const lower = line.toLowerCase().trim();
    if (lower.length < 2) return true;
    if (NOISE_WORDS.has(lower)) return true;
    if (/^[pf]:\s*$|^m:\s*$|^e:\s*$|^w:\s*$/i.test(lower)) return true;
    if (/^(tel|phone|fax|email|web|www)\s*:?\s*$/i.test(lower)) return true;
    return false;
  }

  function extractBusinessName(lines, email, website) {
    const dominated = new Set();

    const emailDomain = email ? email.split('@')[1]?.split('.')[0] : null;
    const siteDomain = website ? website.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0].split('.')[0] : null;

    const candidates = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 2) continue;
      if (isNoiseLine(trimmed)) continue;
      if (EMAIL_PATTERN.test(trimmed)) { EMAIL_PATTERN.lastIndex = 0; continue; }
      if (trimmed.match(/^\d[\d\s\-().+]{6,}/)) continue;
      if (isPersonTitle(trimmed) && !trimmed.includes(',')) continue;

      let score = 0;

      if (emailDomain && trimmed.toLowerCase().includes(emailDomain)) score += 4;
      if (siteDomain && trimmed.toLowerCase().includes(siteDomain)) score += 4;

      if (/\b(inc|llc|ltd|corp|co\.|group|solutions|services|consulting|technologies|systems|associates|partners|enterprises)\b/i.test(trimmed)) score += 3;

      if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) score += 2;

      if (/^[A-Z]/.test(trimmed)) score += 1;

      if (trimmed.length >= 3 && trimmed.length <= 60) score += 1;

      if (lines.indexOf(line) === 0) score += 2;

      candidates.push({ text: trimmed, score });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.text || '';
  }

  function parse(rawText) {
    const cleaned = cleanText(rawText);
    const lines = cleaned.split('\n').filter(Boolean);

    const phone = extractPhone(cleaned);
    const email = extractEmail(cleaned);
    const website = extractWebsite(cleaned, email);
    const address = extractAddress(cleaned);
    const industry = detectIndustry(cleaned);
    const businessName = extractBusinessName(lines, email, website);

    return { businessName, industryType: industry, phone, email, website, address };
  }

  return { parse };
})();

if (typeof module !== 'undefined') module.exports = BusinessCardExtractor;
