const CardExtractor = (() => {

  const INDUSTRIES = {
    'Technology':        ['software','saas','tech','digital','cyber','cloud','ai','ml','data','computing','network','blockchain','iot','robotics','app','dev','api','platform','startup'],
    'Healthcare':        ['health','medical','clinic','hospital','pharma','dental','therapy','wellness','doctor','md ','dds','chiro','ortho','surgery','nursing','pediatric','cardio','neuro','diagnostics'],
    'Legal':             ['law','legal','attorney','lawyer','counsel','llp','barrister','solicitor','notary','paralegal','litigation','advocacy','esquire'],
    'Finance':           ['finance','financial','bank','invest','capital','wealth','insurance','accounting','cpa','audit','tax','mortgage','credit','trading','asset','fund','equity','fintech'],
    'Real Estate':       ['real estate','realty','property','homes','broker','realtor','residential','leasing','landlord','appraisal'],
    'Education':         ['school','university','college','academy','education','institute','learning','tutoring','professor','faculty','curriculum'],
    'Food & Beverage':   ['restaurant','cafe','catering','bakery','bistro','grill','kitchen','food','dining','eatery','brewery','winery','deli','cuisine','hospitality','hotel'],
    'Retail':            ['store','shop','retail','boutique','market','outlet','merchandise','fashion','apparel','wholesale','ecommerce','luxury'],
    'Marketing':         ['marketing','advertising','brand','media','public relations','creative','agency','content','seo','social media','communications','campaign'],
    'Consulting':        ['consulting','consultant','advisory','strategy','management','business development','operations'],
    'Construction':      ['construction','engineering','architect','contractor','plumbing','electrical','hvac','roofing','landscaping','renovation'],
    'Logistics':         ['logistics','shipping','freight','transport','delivery','supply chain','warehouse','distribution','courier'],
    'Creative':          ['design','photography','film','video','music','art','studio','production','animation','ux','ui','graphic'],
    'Non-Profit':        ['foundation','nonprofit','charity','ngo','volunteer','community','association','society'],
  };

  const RE = {
    phone: [
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?(?:ext|x|ext\.)\s?\d{1,5})?/gi,
      /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/gi,
      /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/gi,
    ],
    email:   /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
    url:     /(?:https?:\/\/)?(?:www\.)[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,;]*)*/gi,
    urlFull: /(?:https?:\/\/)[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s,;]*)*/gi,
    address: [
      /\d{1,5}\s+[A-Za-z0-9\s,\.#\-]+?(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Court|Ct\.?|Place|Pl\.?|Way|Circle|Cir\.?|Highway|Hwy\.?|Parkway|Pkwy)\b[A-Za-z0-9\s,\.#\-]*/gi,
      /(?:Suite|Ste\.?|Floor|Unit|Apt\.?|#)\s*\d+[A-Za-z0-9\s,\.\-]*/gi,
    ],
    zip:      /\b\d{5}(?:-\d{4})?\b/g,
    state:    /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/g,
    postcode: /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/gi,
  };

  const NOISE = new Set(['tel','phone','mobile','cell','fax','office','direct','email','e-mail','www','web','website','address','location','follow us','visit','connect','contact','call','scan','find','like','share','hello','hi','sincerely','regards','p:','f:','m:','e:','w:','t:','c:']);

  const TITLES = new Set(['ceo','cto','cfo','coo','cso','cmo','president','vice president','vp','svp','evp','founder','co-founder','director','manager','engineer','developer','designer','consultant','analyst','officer','executive','partner','associate','assistant','coordinator','specialist','representative','advisor','agent','broker','attorney','doctor','dr.','professor','principal','lead','senior','junior','head','chief','controller','treasurer','secretary','chairman','managing']);

  function clean(text) {
    return text
      .replace(/[|•·▪▸►◆★☆✦✧→←]/g, '\n')
      .replace(/\r/g, '\n').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ')
      .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  }

  function isNoise(line) {
    const l = line.toLowerCase().trim();
    if (l.length < 2) return true;
    if (NOISE.has(l)) return true;
    if (/^[pfmewct]:\s*$/i.test(l)) return true;
    if (/^(tel|phone|fax|email|web|www|address|mobile|cell|office)\s*:?\s*$/i.test(l)) return true;
    if (/^\d+$/.test(l)) return true;
    return false;
  }

  function isTitle(line) {
    const l = line.toLowerCase();
    return Array.from(TITLES).some(t => l.includes(t));
  }

  function extractPhone(text) {
    const found = [];
    for (const p of RE.phone) {
      p.lastIndex = 0;
      for (const m of text.match(p) || []) {
        if (m.replace(/\D/g, '').length >= 10) found.push(m.trim());
      }
    }
    const unique = [...new Set(found)];
    const mobile = unique.find(p => /\b(mob|mobile|cell|m:)\b/i.test(text.slice(Math.max(0, text.indexOf(p) - 20), text.indexOf(p))));
    return mobile || unique[0] || '';
  }

  function extractEmail(text) {
    RE.email.lastIndex = 0;
    const matches = text.match(RE.email) || [];
    return (matches.find(e => !e.includes('example') && !e.includes('domain')) || matches[0] || '').toLowerCase();
  }

  function extractWebsite(text, email) {
    const emailStem = email ? email.split('@')[1] : null;
    const found = new Set();
    for (const p of [RE.url, RE.urlFull]) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(text)) !== null) {
        let url = m[0].trim().replace(/[,;.'"]+$/, '');
        if (url.includes('@') || /\.(jpg|jpeg|png|gif|pdf|doc|xls|svg|zip)$/i.test(url)) continue;
        if (/example\.|domain\.|yourdomain\./.test(url)) continue;
        found.add(url);
      }
    }
    const arr = Array.from(found);
    if (!arr.length) return emailStem ? `https://www.${emailStem}` : '';
    const preferred = arr.find(u => emailStem && u.toLowerCase().includes(emailStem.split('.')[0]));
    const result = preferred || arr[0];
    if (!/^https?:\/\//i.test(result)) return 'https://' + (result.startsWith('www.') ? result : 'www.' + result);
    return result;
  }

  function extractAddress(text) {
    let best = '';
    for (const p of RE.address) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(text)) !== null) if (m[0].trim().length > best.length) best = m[0].trim();
    }
    if (!best) {
      for (const line of text.split('\n')) {
        RE.zip.lastIndex = 0; RE.state.lastIndex = 0; RE.postcode.lastIndex = 0;
        if ((RE.zip.test(line) || RE.state.test(line) || RE.postcode.test(line)) && line.length > best.length) best = line.trim();
      }
    }
    return best.replace(/\s+/g, ' ').trim();
  }

  function detectIndustry(text) {
    const lo = text.toLowerCase();
    let top = { label: 'General Business', score: 0 };
    for (const [label, kws] of Object.entries(INDUSTRIES)) {
      let score = 0;
      for (const kw of kws) if (lo.includes(kw)) score += kw.length > 6 ? 3 : kw.length > 4 ? 2 : 1;
      if (score > top.score) top = { label, score };
    }
    return top.label;
  }

  function extractPersonName(lines) {
    for (const line of lines) {
      const t = line.trim();
      if (t.length < 3 || t.length > 50 || isNoise(t) || /\d|@|http/.test(t)) continue;
      const words = t.split(/\s+/);
      if (words.length < 1 || words.length > 5) continue;
      if (words.every(w => /^[A-Z][a-z]/.test(w) || /^[A-Z]{2,}$/.test(w))) return t;
    }
    return '';
  }

  function extractBusinessName(lines, email, website, person) {
    const emailStem = email ? email.split('@')[1]?.split('.')[0]?.toLowerCase() : null;
    const siteStem  = website ? website.replace(/^https?:\/\/(www\.)?/i,'').split(/[./]/)[0]?.toLowerCase() : null;
    const candidates = [];

    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t || t.length < 2 || t.length > 80) continue;
      if (isNoise(t) || /@/.test(t) || /^https?:\/\//i.test(t)) continue;
      if (/^\+?\d[\d\s\-()+.]{5,}$/.test(t) || t === person) continue;

      let score = 0;
      const lo = t.toLowerCase();
      if (emailStem && lo.includes(emailStem)) score += 6;
      if (siteStem  && lo.includes(siteStem))  score += 6;
      if (/\b(inc\.?|llc\.?|ltd\.?|corp\.?|co\.|group|solutions|services|consulting|technologies|systems|associates|partners|enterprises|holdings|ventures|labs|studio|agency)\b/i.test(t)) score += 4;
      if (t === t.toUpperCase() && t.length > 2) score += 3;
      if (/^[A-Z]/.test(t)) score += 1;
      if (i === 0) score += 3;
      if (i === 1) score += 1;
      if (isTitle(t)) score -= 5;
      if (t.length >= 2 && t.length <= 50) score += 1;
      candidates.push({ text: t, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.text || '';
  }

  function computeConfidence(result, ocrConf) {
    const keys = ['businessName','phone','email','website','address'];
    const filled = keys.filter(k => result[k]?.trim()).length;
    return Math.round((filled / keys.length * 0.6 + Math.min((ocrConf || 0) / 100, 1) * 0.4) * 100);
  }

  function parse(rawText, ocrConf) {
    const cleaned = clean(rawText);
    const lines   = cleaned.split('\n').filter(Boolean);
    const phone   = extractPhone(cleaned);
    const email   = extractEmail(cleaned);
    const website = extractWebsite(cleaned, email);
    const address = extractAddress(cleaned);
    const industry = detectIndustry(cleaned);
    const person   = extractPersonName(lines);
    const business = extractBusinessName(lines, email, website, person);
    const result = { businessName: business, personName: person, industryType: industry, phone, email, website, address };
    result.confidence = computeConfidence(result, ocrConf);
    return result;
  }

  function preprocessCanvas(src) {
    const dst = document.createElement('canvas');
    dst.width = src.width; dst.height = src.height;
    const ctx = dst.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, dst.width, dst.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = Math.round(0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]);
      d[i] = d[i+1] = d[i+2] = gray > 128 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
    return dst;
  }

  function scaleCanvas(src, maxDim = 2400) {
    const { width: w, height: h } = src;
    if (w <= maxDim && h <= maxDim) return src;
    const ratio = Math.min(maxDim/w, maxDim/h);
    const dst = document.createElement('canvas');
    dst.width = Math.round(w*ratio); dst.height = Math.round(h*ratio);
    dst.getContext('2d').drawImage(src, 0, 0, dst.width, dst.height);
    return dst;
  }

  return { parse, preprocessCanvas, scaleCanvas };
})();

if (typeof module !== 'undefined') module.exports = CardExtractor;
