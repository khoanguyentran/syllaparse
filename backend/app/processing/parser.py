# import fitz  # PyMuPDF
# from google.cloud import storage
# from io import BytesIO
# from .config import OPENAI_API_KEY, DEFAULT_MODEL, MAX_TOKENS
# from openai import OpenAI
# from .types import SyllabusData

# class Parser:
#     """Parser for syllabus data"""
    
#     def __init__(self):
#         self.openai_key = OPENAI_API_KEY
    
#     async def parse_syllabus(self, file_url: str) -> dict:
#         """Parse PDF from URL and extract info using GPT"""
#         try:
#             text = await self._extract_text(file_url)
            
#             # Parse with GPT
#             raw_result = await self._gpt_parse(text)
            
#             # Check if GPT parsing failed
#             if "error" in raw_result:
#                 return {
#                     "success": False,
#                     "error": raw_result["error"],
#                     "text": text[:500] + "..." if len(text) > 500 else text
#                 }
            
#             # Validate and clean the parsed data
#             validated_result = self._validate_parsed_data(raw_result)
            
#             if "error" in validated_result:
#                 return {
#                     "success": False,
#                     "error": validated_result["error"],
#                     "text": text[:500] + "..." if len(text) > 500 else text
#                 }
            
#             return {
#                 "success": True,
#                 "text": text[:500] + "..." if len(text) > 500 else text,
#                 "parsed": validated_result
#             }
            
#         except Exception as e:
#             return {
#                 "success": False,
#                 "error": str(e)
#             }
    
#     async def _extract_text(self, gcs_url: str) -> str:
#         """Extract text from PDF in Google Cloud Storage"""
#         try:
#             # Format: https://storage.googleapis.com/BUCKET_NAME/PATH/TO/FILE
#             if "storage.googleapis.com" in gcs_url:
#                 parts = gcs_url.replace("https://storage.googleapis.com/", "").split("/", 1)
#                 bucket_name = parts[0]
#                 blob_name = parts[1] if len(parts) > 1 else ""
#             else:
#                 raise ValueError("Invalid GCS URL format")
            
#             client = storage.Client()
#             bucket = client.bucket(bucket_name)
#             blob = bucket.blob(blob_name)
            
#             content = blob.download_as_bytes()
            
#             doc = fitz.open(stream=BytesIO(content), filetype="pdf")
#             text = ""
#             for page in doc:
#                 text += page.get_text()
#             doc.close()
            
#             return text
            
#         except Exception as e:
#             raise Exception(f"Failed to extract text from GCS: {str(e)}")
    
#     async def _gpt_parse(self, text: str) -> dict:
#         """Use GPT to parse syllabus text using structured output"""
#         if not self.openai_key:
#             return {"error": "OpenAI API key not configured"}
        
#         prompt = f"""Extract structured data from this syllabus:

# REQUIRED FIELDS:
# - course_name: Course title and number
# - instructor: Professor name and contact  
# - summary: Course description paragraph (topics, objectives, prerequisites)
# - lectures: [{{"day": 0-6, "start_time": "HH:MM", "end_time": "HH:MM", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "location": "string", "type": "lecture/lab/discussion"}}]
# - assignments: [{{"description": "Assignment name only", "date": "YYYY-MM-DD" or "Not Listed", "time_due": "HH:MM or Not Listed", "confidence": 0-100}}]
# - exams: [{{"description": "Exam name", "date": "YYYY-MM-DD" or "Not Listed", "time_due": "HH:MM or Not Listed", "confidence": 0-100}}]
# - grading: {{"categories": [{{"name": "string", "weight": float, "description": "string"}}], "confidence": 0-100}}

# STANDARDS BASED ON REAL SYLLABI:
# - Meetings may list multiple valid lecture time options (e.g., “MWF 9:05–9:55 OR 10:10–11:00”). Include each option as a separate lectures[] item; never choose one.
# - Assignments may be embedded in a schedule table as “#N (Due M/D)” or “Due M/D - weekday”. Extract these as assignments with short description “Problem Set #N”.
# - Exams may appear both in prose (“Prelims: 7:30–9:00p Thurs 2/12…”) and in schedule tables (“EXAM 1”). Merge them: prefer explicit time ranges, keep location as “Not Listed” if not provided.
# - Finals may be “TBA” or “University-assigned time”; in that case date/time must be “Not Listed”.
# - Grading can be percent-based OR points-based. If only points are given, record them in the category description and do not invent percentages.

# PATTERNS TO MATCH:
# - Lecture meetings: lines like “MWF, 9:05-9:55a …” or “Tuesdays & Thursdays, 2:55-4:10 PM …”
# - Schedule tables: headings like “Tentative Schedule”, “Weekly Course Plan”, “Schedule of Topics and Exams”
# - Problem sets: “#1 (Due 1/28)”, “Problem Set #10”, “PS #7”, “Due 2/20 - Fri”
# - Exams: “Prelims”, “Midterm”, “Exam 1”, “Exam 2”, “Final: TBD”, “University-assigned time”
# - Office hours are NOT lectures; do not put them in lectures[].

# SYLLABUS:
# {text}"""
        
#         return await self._run_llm(prompt)
    
#     async def _run_llm(self, prompt: str) -> dict:
#         """Call OpenAI GPT API with structured output"""
#         try:
#             client = OpenAI(api_key=self.openai_key)
            
#             response = client.beta.chat.completions.parse(
#                 model=DEFAULT_MODEL,
#                 messages=[
#                     {"role": "system", "content": "You are a university professor with 20+ years of experience creating syllabi. You understand all syllabi terminology and can perfectly understand other professor's syllabi."},
#                     {"role": "user", "content": prompt}
#                 ],
#                 response_format=SyllabusData,
#                 max_completion_tokens=MAX_TOKENS
#             )
            
#             result = response.choices[0].message.parsed
#             if result:
#                 return result.model_dump()
#             else:
#                 return {"error": "No parsed result returned"}
            
#         except Exception as e:
#             return {"error": f"GPT error: {str(e)}"}
    

#     def _validate_parsed_data(self, data: dict) -> dict:
#         """Validate and clean parsed data - simplified since structured output handles most validation"""
#         if not isinstance(data, dict):
#             return {"error": "Parsed data is not a dictionary"}
        
#         if data.get("grading") and data["grading"].get("categories"):
#             total_weight = sum(cat["weight"] for cat in data["grading"]["categories"] if cat.get("weight"))
#             data["grading"]["total_weight"] = total_weight
        
#         return data

"""
parser.py — syllabus parser with fixes for two-column info tables

Key fixes in this version:
- Two-column syllabus info table extraction (Label | Value layouts like Cornell syllabi)
- Fixed prelim regex: correctly captures "7:30-9:00p - Thurs 2/12; Tues 3/17; Thurs 4/23"
- MWF/TTh lecture expansion: one GPT entry → multiple day entries
- Borderless table reconstruction from span x/y positions
- Semester bounds injection into GPT prompt (anchors year for all dates)
- Chunked parsing for long PDFs
- Deterministic assignment + exam regex fallbacks
- Post-parse date normalization (catches "2/14", "Feb 14" GPT returns)
"""

import re
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF >= 1.23 recommended
from google.cloud import storage
from openai import OpenAI

from .config import OPENAI_API_KEY, DEFAULT_MODEL, MAX_TOKENS
from .types import SyllabusData


# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

CHUNK_CHAR_LIMIT = 60_000

_MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


# ──────────────────────────────────────────────────────────────────────────────
# Prompts
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an information extraction engine for university syllabi.
Produce accurate structured data ONLY from explicit text. Do NOT guess.

RULES:
- If a value is not explicit, use "Not Listed" and set confidence <= 70.
- Days: 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun
- Times: 24-hour HH:MM only. Convert AM/PM when shown.
- Dates: YYYY-MM-DD only. Use the SEMESTER YEAR provided in the prompt to resolve M/D dates.
- Office hours are NOT lectures.
- MWF means three separate lecture entries (Mon, Wed, Fri).
- TTh / Tu/Th means two entries (Tue, Thu).
- Multiple lecture time options (e.g. "9:05-9:55 OR 10:10-11:00") → include each as separate entries for each day.
- "Prelims: TIME - Date1; Date2; Date3" → separate exam entry for each date.
- Do NOT include Final Exams in the exams list.
- Points-only grading → record in description, do not invent percentages.
- Confidence 85-100: explicit. 70-84: minor ambiguity. 50-69: uncertain.
"""

USER_PROMPT_TEMPLATE = """Extract structured data from this syllabus.

SEMESTER: {term_str}
SEMESTER START: {start_date}
SEMESTER END: {end_date}

Use the semester year above to convert ALL partial dates (M/D or Month Day) to YYYY-MM-DD.

REQUIRED FIELDS:
- course_name
- instructor (name + contact)
- summary (description, objectives, prerequisites)
- lectures: [{{"day":0-6,"start_time":"HH:MM","end_time":"HH:MM","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","location":"...","type":"lecture|lab|discussion"}}]
- assignments: [{{"description":"...","date":"YYYY-MM-DD","time_due":"HH:MM","confidence":0-100}}]
- exams: [{{"description":"...","date":"YYYY-MM-DD","time_due":"HH:MM","confidence":0-100}}]
- grading: {{"categories":[{{"name":"...","weight":float,"description":"..."}}],"confidence":0-100}}

Use "Not Listed" for any field not explicitly in the text.

SYLLABUS TEXT:
{text}
"""


# ──────────────────────────────────────────────────────────────────────────────
# PDF extraction
# ──────────────────────────────────────────────────────────────────────────────

def _rects_overlap(r1: Tuple, r2: Tuple, tol: float = 5.0) -> bool:
    ax0, ay0, ax1, ay1 = r1
    bx0, by0, bx1, by1 = r2
    return not (ax1 < bx0 - tol or bx1 < ax0 - tol or ay1 < by0 - tol or by1 < ay0 - tol)


def _table_to_markdown(table) -> str:
    rows = table.extract()
    if not rows:
        return ""
    lines = []
    for i, row in enumerate(rows):
        cells = [str(c or "").replace("\n", " ").strip() for c in row]
        lines.append("| " + " | ".join(cells) + " |")
        if i == 0:
            lines.append("| " + " | ".join(["---"] * len(cells)) + " |")
    return "\n".join(lines)


def _reconstruct_two_column_table(page, col_gap_threshold: float = 40.0) -> Optional[str]:
    """
    Detect and reconstruct two-column info tables (Label | Value)
    Uses span-level x/y positions to pair label and
    value text, emitting clean "LABEL: value" lines.

    Returns a string of reconstructed lines, or None if layout not detected.
    """
    try:
        blocks_dict = page.get_text("dict")
    except Exception:
        return None

    spans = []
    for b in blocks_dict.get("blocks", []):
        for line in b.get("lines", []):
            for span in line.get("spans", []):
                text = span["text"].strip()
                if not text:
                    continue
                spans.append({
                    "text": text,
                    "x0": span["origin"][0],
                    "y0": span["origin"][1],
                })

    if not spans:
        return None

    # Find the dominant column split via largest x0 gap
    x_vals = sorted(s["x0"] for s in spans)
    if len(x_vals) < 4:
        return None

    gaps = [(x_vals[i+1] - x_vals[i], x_vals[i], x_vals[i+1]) for i in range(len(x_vals)-1)]
    significant = [(g, lo, hi) for g, lo, hi in gaps if g > col_gap_threshold]
    if not significant:
        return None

    _, split_lo, split_hi = max(significant, key=lambda g: g[0])
    col_split = (split_lo + split_hi) / 2

    left_spans = [s for s in spans if s["x0"] < col_split]
    right_spans = [s for s in spans if s["x0"] >= col_split]
    if not left_spans or not right_spans:
        return None

    def group_by_row(span_list, row_tol=3.0) -> Dict[float, str]:
        rows: Dict[float, List[str]] = {}
        for s in sorted(span_list, key=lambda x: x["y0"]):
            y = s["y0"]
            matched = next((ry for ry in rows if abs(ry - y) <= row_tol), None)
            if matched is None:
                matched = y
                rows[matched] = []
            rows[matched].append(s["text"])
        return {y: " ".join(texts) for y, texts in rows.items()}

    left_rows = group_by_row(left_spans)
    right_rows = group_by_row(right_spans)

    lines = []
    remaining_right = dict(right_rows)
    for ly, label in sorted(left_rows.items()):
        if not remaining_right:
            lines.append(label)
            continue
        closest_ry = min(remaining_right.keys(), key=lambda ry: abs(ry - ly))
        if abs(closest_ry - ly) < 20:
            value = remaining_right.pop(closest_ry)
            lines.append(f"{label}: {value}")
        else:
            lines.append(label)

    for ry, val in sorted(remaining_right.items()):
        lines.append(f"  {val}")

    return "\n".join(lines) if lines else None


def _page_to_text(page) -> str:
    """
    Extract text from one page:
    1. Try find_tables() for bordered tables → Markdown
    2. Try two-column reconstruction for info tables (if no bordered tables)
    3. Fall back to block-ordered plain text
    """
    parts: List[str] = []
    table_rects: List[Tuple] = []

    # Bordered tables
    try:
        tables = page.find_tables()
        for tbl in tables.tables:
            md = _table_to_markdown(tbl)
            if md:
                parts.append(md)
            table_rects.append(tbl.bbox)
    except AttributeError:
        pass  # PyMuPDF < 1.23

    # Two-column info table (only if no bordered tables found on this page)
    if not table_rects:
        two_col = _reconstruct_two_column_table(page)
        if two_col:
            return two_col

    # Plain block text
    blocks = page.get_text("blocks")
    blocks = sorted(blocks, key=lambda b: (round(b[1] / 5) * 5, round(b[0] / 5) * 5))
    for b in blocks:
        x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
        text = text.strip()
        if not text:
            continue
        if any(_rects_overlap((x0, y0, x1, y1), tr) for tr in table_rects):
            continue
        parts.append(text)

    return "\n\n".join(parts)


# ──────────────────────────────────────────────────────────────────────────────
# Term / semester detection
# ──────────────────────────────────────────────────────────────────────────────

_TERM_PATTERNS = [
    r"\b(Spring|Fall|Summer|Winter|Autumn)\s+(20\d{2})\b",
    r"\b(Sp|FA|SU|Wi)\s+(20\d{2})\b",
    r"\b(Sp|FA|SU|Wi)(2[0-9])\b",
]
_TERM_ABBREV = {
    "sp": "Spring", "fa": "Fall", "su": "Summer", "wi": "Winter",
    "spring": "Spring", "fall": "Fall", "summer": "Summer",
    "winter": "Winter", "autumn": "Fall",
}


def _detect_term_year(text: str) -> Optional[Tuple[str, int]]:
    for pat in _TERM_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            season = _TERM_ABBREV.get(m.group(1).lower(), m.group(1).capitalize())
            yr_raw = m.group(2)
            year = int(yr_raw) if len(yr_raw) == 4 else 2000 + int(yr_raw)
            return (season, year)
    return None


def _detect_semester_bounds(text: str, year: Optional[int]) -> Tuple[Optional[str], Optional[str]]:
    """Return explicit semester start/end as YYYY-MM-DD or None."""
    def _find(patterns):
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if not m:
                continue
            raw = m.group(1).strip()
            # M/D(/YY/YYYY)
            dm = re.match(r"(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?", raw)
            if dm:
                yr = int(dm.group(3)) if dm.group(3) else year
                if yr and yr < 100:
                    yr += 2000
                return f"{yr}-{int(dm.group(1)):02d}-{int(dm.group(2)):02d}" if yr else None
            # "January 21"
            nm = re.match(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})", raw, re.IGNORECASE)
            if nm and year:
                mon = _MONTH_MAP[nm.group(1).lower()[:3]]
                return f"{year}-{mon:02d}-{int(nm.group(2)):02d}"
        return None

    start = _find([
        r"[Cc]lasses?\s+begin[s]?\s+([A-Za-z0-9/ ]+)",
        r"[Ff]irst\s+day\s+of\s+(?:class|instruction)\s*:?\s*([A-Za-z0-9/ ]+)",
    ])
    end = _find([
        r"[Cc]lasses?\s+end[s]?\s+([A-Za-z0-9/ ]+)",
        r"[Ll]ast\s+day\s+of\s+(?:class|instruction)\s*:?\s*([A-Za-z0-9/ ]+)",
    ])
    return start, end


# ──────────────────────────────────────────────────────────────────────────────
# Date / time utilities
# ──────────────────────────────────────────────────────────────────────────────

def _to_date(mm: int, dd: int, year: Optional[int]) -> str:
    return f"{year:04d}-{mm:02d}-{dd:02d}" if year else "Not Listed"


def _normalize_date(raw: str, year: Optional[int]) -> str:
    if not raw or raw.strip().lower() in ("not listed", "tbd", "tba", ""):
        return "Not Listed"
    if re.match(r"\d{4}-\d{2}-\d{2}$", raw.strip()):
        return raw.strip()
    m = re.match(r"(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?$", raw.strip())
    if m:
        yr = int(m.group(3)) if m.group(3) else year
        if yr and yr < 100:
            yr += 2000
        return _to_date(int(m.group(1)), int(m.group(2)), yr)
    m = re.match(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})$", raw.strip(), re.IGNORECASE)
    if m:
        return _to_date(_MONTH_MAP[m.group(1).lower()[:3]], int(m.group(2)), year)
    return "Not Listed"


def _normalize_time(raw: str) -> str:
    if not raw or raw.strip().lower() in ("not listed", ""):
        return "Not Listed"
    if re.match(r"\d{2}:\d{2}$", raw.strip()):
        return raw.strip()
    m = re.match(r"(\d{1,2}):(\d{2})\s*([aApP]\.?[mM]?\.?)?$", raw.strip())
    if m:
        h, mn = int(m.group(1)), int(m.group(2))
        ap = (m.group(3) or "").lower().replace(".", "")
        if ap.startswith("p") and h != 12:
            h += 12
        if ap.startswith("a") and h == 12:
            h = 0
        return f"{h:02d}:{mn:02d}"
    return "Not Listed"


def _parse_time_range(blob: str) -> Tuple[str, str]:
    """
    Parse "7:30-9:00p", "9:05-9:55a", "2:55-4:10 PM" → (start HH:MM, end HH:MM).
    AM/PM indicator is on the END time; start time period is inferred.
    """
    m = re.search(
        r"(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*([aApP]\.?[mM]?\.?)",
        blob,
    )
    if not m:
        return "Not Listed", "Not Listed"

    h1, m1, h2, m2 = int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
    ap = m.group(5).lower().replace(".", "")

    if ap.startswith("p"):
        if h2 != 12:
            h2 += 12
        if h1 + 12 <= h2:
            h1 += 12
    elif ap.startswith("a"):
        if h2 == 12:
            h2 = 0
        if h1 == 12:
            h1 = 0

    return f"{h1:02d}:{m1:02d}", f"{h2:02d}:{m2:02d}"


# ──────────────────────────────────────────────────────────────────────────────
# Deterministic lecture extraction
# ──────────────────────────────────────────────────────────────────────────────

def _parse_day_string(day_str: str) -> List[int]:
    """
    Convert abbreviation strings to day integers.
    "MWF" → [0,2,4], "TTh" → [1,3], "Tu/Th" → [1,3], "Tuesdays & Thursdays" → [1,3]
    """
    s = day_str.strip()
    days = []
    # Two-char abbreviations first (order matters to avoid M matching Monday before MWF)
    for abbr, val in [("Tu", 1), ("Th", 3), ("Sa", 5), ("Su", 6)]:
        if re.search(abbr, s, re.IGNORECASE):
            days.append(val)
            s = re.sub(abbr, "", s, flags=re.IGNORECASE)
    # Named full days
    if re.search(r"\bMonday", s, re.IGNORECASE):
        days.append(0)
    if re.search(r"\bWednesday", s, re.IGNORECASE):
        days.append(2)
    if re.search(r"\bFriday", s, re.IGNORECASE):
        days.append(4)
    # Single-char abbreviations
    if "M" in s:
        days.append(0)
    if "W" in s:
        days.append(2)
    if "F" in s:
        days.append(4)
    return sorted(set(days))


def _extract_lectures_regex(text: str) -> List[Dict[str, Any]]:
    """
    Extract lecture meeting times. Key pattern for this syllabus:
    "MWF, 9:05-9:55a, or 10:10-11:00a, in 200 Baker Laboratory"
    Also handles "Tuesdays & Thursdays, 2:55-4:10 PM, Olin Hall 155"
    """
    lectures: List[Dict[str, Any]] = []

    lecture_line_re = re.compile(
        r"(?:Lectures?\s*:?\s*)?"
        r"(MWF|MW|TTh|Tu/?Th|"
        r"(?:Mon(?:day)?s?(?:\s*[,&/]\s*)?)?(?:Wed(?:nesday)?s?(?:\s*[,&/]\s*)?)?(?:Fri(?:day)?s?)?"
        r"|Tuesdays?\s*(?:[&and]+\s*Thursdays?)?)"
        r"[,\s]+"
        r"([\d:]+\s*[-–]\s*[\d:]+\s*[aApP]\.?[mM]?\.?)"
        r"(?:\s*(?:,\s*)?(?:or|OR)\s*([\d:]+\s*[-–]\s*[\d:]+\s*[aApP]\.?[mM]?\.?))?"
        r"(?:[,\s]+(?:in\s+)?([^\n,]{3,50?}))?",
        re.IGNORECASE | re.MULTILINE,
    )

    for m in lecture_line_re.finditer(text):
        day_str = m.group(1).strip()
        time1 = m.group(2).strip() if m.group(2) else None
        time2 = m.group(3).strip() if m.group(3) else None
        location = m.group(4).strip() if m.group(4) else "Not Listed"

        days = _parse_day_string(day_str)
        if not days or not time1:
            continue

        time_options = [t for t in [time1, time2] if t]
        for time_str in time_options:
            start_t, end_t = _parse_time_range(time_str)
            for day in days:
                lectures.append({
                    "day": day,
                    "start_time": start_t,
                    "end_time": end_t,
                    "start_date": "Not Listed",
                    "end_date": "Not Listed",
                    "location": location,
                    "type": "lecture",
                })

    return lectures


def _expand_lectures(gpt_lectures: List[Dict], raw_text: str) -> List[Dict]:
    """Merge GPT lectures with regex-extracted ones, preferring regex for day expansion."""
    regex_lectures = _extract_lectures_regex(raw_text)

    if not gpt_lectures and regex_lectures:
        return regex_lectures

    existing = {(e.get("day"), e.get("start_time"), e.get("end_time")) for e in gpt_lectures}
    merged = list(gpt_lectures)
    for rl in regex_lectures:
        k = (rl.get("day"), rl.get("start_time"), rl.get("end_time"))
        if k not in existing:
            merged.append(rl)
    return merged


# ──────────────────────────────────────────────────────────────────────────────
# Deterministic exam extraction
# ──────────────────────────────────────────────────────────────────────────────

def _extract_exams_regex(text: str, term: Optional[Tuple[str, int]]) -> List[Dict[str, Any]]:
    year = term[1] if term else None
    confidence = 95 if year else 70
    exams: List[Dict[str, Any]] = []

    # "Prelims: 7:30-9:00p - Thurs 2/12; Tues 3/17; Thurs 4/23"
    prelim_m = re.search(
        r"\bPrelims?\s*:\s*"
        r"([\d:]+\s*[-–]\s*[\d:]+\s*[aApP]\.?[mM]?\.?)"
        r"\s*[-–]\s*"
        r"([^\n.]{5,120})",
        text, re.IGNORECASE,
    )
    if prelim_m:
        start_t, end_t = _parse_time_range(prelim_m.group(1))
        for i, (mm, dd) in enumerate(re.findall(r"(\d{1,2})/(\d{1,2})", prelim_m.group(2)), start=1):
            exams.append({
                "description": f"Prelim {i}",
                "date": _to_date(int(mm), int(dd), year),
                "time_due": start_t,
                "end_time": end_t,
                "confidence": confidence,
            })

    # "M/D EXAM N" or "EXAM N ... M/D"
    for mm, dd, n in re.findall(r"\b(\d{1,2})/(\d{1,2})\s+(?:EXAM|Exam)\s+(\d+)\b", text):
        exams.append({"description": f"Exam {n}", "date": _to_date(int(mm), int(dd), year),
                      "time_due": "Not Listed", "confidence": confidence})
    for n, mm, dd in re.findall(r"\b(?:EXAM|Exam)\s+(\d+)\b[^\n]{0,40}?\b(\d{1,2})/(\d{1,2})\b", text):
        exams.append({"description": f"Exam {n}", "date": _to_date(int(mm), int(dd), year),
                      "time_due": "Not Listed", "confidence": confidence})

    # "PRELIM N ... Feb 12"
    for name, mon_str, day_str in re.findall(
        r"\b((?:PRELIM|MIDTERM)\s*\d*)\b[^\n]{0,60}"
        r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})\b",
        text, re.IGNORECASE,
    ):
        exams.append({"description": name.strip().title(),
                      "date": _to_date(_MONTH_MAP[mon_str.lower()[:3]], int(day_str), year),
                      "time_due": "Not Listed", "confidence": confidence})

    # "Midterm — Thursday, March 6"
    for mon_str, day_str in re.findall(
        r"\bMidterm\b[^\n]{0,40}"
        r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})\b",
        text, re.IGNORECASE,
    ):
        exams.append({"description": "Midterm",
                      "date": _to_date(_MONTH_MAP[mon_str.lower()[:3]], int(day_str), year),
                      "time_due": "Not Listed", "confidence": confidence})

    # Final exam intentionally omitted

    return _dedupe_items(exams, keys=("description", "date"))


# ──────────────────────────────────────────────────────────────────────────────
# Deterministic assignment extraction
# ──────────────────────────────────────────────────────────────────────────────

def _extract_assignments_regex(text: str, term: Optional[Tuple[str, int]]) -> List[Dict[str, Any]]:
    year = term[1] if term else None
    confidence = 90 if year else 65
    assignments: List[Dict[str, Any]] = []

    # "#N (Due M/D)" or "PS #N (Due M/D)"
    for prefix, n, mm, dd in re.findall(
        r"\b(PS|HW|Problem\s+Set|Assignment)?\s*#?(\d{1,2})\s*\(?\s*[Dd]ue\s+(\d{1,2})/(\d{1,2})\)?",
        text,
    ):
        label = prefix.strip() if prefix.strip() else "Problem Set"
        assignments.append({"description": f"{label} #{n}",
                            "date": _to_date(int(mm), int(dd), year),
                            "time_due": "Not Listed", "confidence": confidence})

    # "Problem Set #N due Feb 14"
    for n, mon_str, day_str in re.findall(
        r"\b(?:Problem\s+Set|PS|HW|Assignment)\s*#?(\d{1,2})\b[^\n]{0,30}?"
        r"[Dd]ue\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})\b",
        text, re.IGNORECASE,
    ):
        assignments.append({"description": f"Problem Set #{n}",
                            "date": _to_date(_MONTH_MAP[mon_str.lower()[:3]], int(day_str), year),
                            "time_due": "Not Listed", "confidence": confidence})

    # "HW3 due 3/5"
    for prefix, n, mm, dd in re.findall(
        r"\b(HW|PS|Lab|Quiz)\s*(\d{1,2})\s+[Dd]ue\s+(\d{1,2})/(\d{1,2})\b", text,
    ):
        assignments.append({"description": f"{prefix}{n}",
                            "date": _to_date(int(mm), int(dd), year),
                            "time_due": "Not Listed", "confidence": confidence})

    # "Due M/D - Weekday"
    for mm, dd in re.findall(
        r"[Dd]ue\s+(\d{1,2})/(\d{1,2})\s*[-–]\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)", text,
    ):
        assignments.append({"description": "Assignment",
                            "date": _to_date(int(mm), int(dd), year),
                            "time_due": "Not Listed", "confidence": max(confidence - 15, 50)})

    return _dedupe_items(assignments, keys=("description", "date"))


# ──────────────────────────────────────────────────────────────────────────────
# Dedup / merge helpers
# ──────────────────────────────────────────────────────────────────────────────

def _dedupe_items(items: Any, keys: Tuple[str, ...] = ("description", "date", "time_due")) -> List[Dict]:
    if not isinstance(items, list):
        return []
    seen: set = set()
    out = []
    for it in items:
        if not isinstance(it, dict):
            continue
        k = tuple(str(it.get(key) or "").strip().lower() for key in keys)
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out


def _merge_items(
    gpt: Optional[List[Dict]], regex: List[Dict],
    keys: Tuple[str, ...] = ("description", "date"),
) -> List[Dict]:
    gpt = gpt or []
    existing = {tuple(str(e.get(k) or "").strip().lower() for k in keys) for e in gpt}
    merged = list(gpt)
    for item in regex:
        k = tuple(str(item.get(k) or "").strip().lower() for k in keys)
        if k not in existing:
            merged.append(item)
    return merged


def _normalize_item_dates(items: List[Dict], year: Optional[int]) -> List[Dict]:
    for item in items:
        if "date" in item:
            item["date"] = _normalize_date(str(item.get("date") or ""), year)
        if "time_due" in item:
            item["time_due"] = _normalize_time(str(item.get("time_due") or ""))
        for f in ("start_date", "end_date"):
            if f in item:
                item[f] = _normalize_date(str(item.get(f) or ""), year)
        for f in ("start_time", "end_time"):
            if f in item:
                item[f] = _normalize_time(str(item.get(f) or ""))
    return items


# ──────────────────────────────────────────────────────────────────────────────
# Chunking
# ──────────────────────────────────────────────────────────────────────────────

def _chunk_text(text: str, max_chars: int) -> List[str]:
    if len(text) <= max_chars:
        return [text]
    pages = re.split(r"(?=\[PAGE \d+\])", text)
    chunks, current = [], ""
    for page in pages:
        if len(current) + len(page) <= max_chars:
            current += page
        else:
            if current:
                chunks.append(current.strip())
            if len(page) > max_chars:
                for para in page.split("\n\n"):
                    if len(current) + len(para) + 2 <= max_chars:
                        current += para + "\n\n"
                    else:
                        if current:
                            chunks.append(current.strip())
                        current = para + "\n\n"
            else:
                current = page
    if current.strip():
        chunks.append(current.strip())
    return chunks or [text]


# ──────────────────────────────────────────────────────────────────────────────
# Parser class
# ──────────────────────────────────────────────────────────────────────────────

class Parser:
    """Parser for syllabus data"""

    def __init__(self):
        self.openai_key = OPENAI_API_KEY
        self._client = OpenAI(api_key=self.openai_key) if self.openai_key else None

    async def parse_syllabus(self, file_url: str) -> dict:
        try:
            extracted = await self._extract_text(file_url)
            full_text = extracted["full_text"]
            term = extracted["term"]

            chunks = _chunk_text(full_text, CHUNK_CHAR_LIMIT)
            if len(chunks) == 1:
                raw_result = await self._gpt_parse(chunks[0], term, full_text)
            else:
                raw_result = await self._gpt_parse_chunked(chunks, term, full_text)

            if "error" in raw_result:
                return {"success": False, "error": raw_result["error"],
                        "text": full_text[:500] + ("..." if len(full_text) > 500 else "")}

            validated = self._validate_and_merge(raw_result, full_text, term)
            if "error" in validated:
                return {"success": False, "error": validated["error"],
                        "text": full_text[:500] + ("..." if len(full_text) > 500 else "")}

            return {"success": True,
                    "text": full_text[:500] + ("..." if len(full_text) > 500 else ""),
                    "parsed": validated}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _extract_text(self, gcs_url: str) -> dict:
        if "storage.googleapis.com" not in gcs_url:
            raise ValueError("Invalid GCS URL format")
        parts = gcs_url.replace("https://storage.googleapis.com/", "").split("/", 1)
        bucket_name, blob_name = parts[0], parts[1] if len(parts) > 1 else ""
        if not bucket_name or not blob_name:
            raise ValueError("Invalid GCS URL format (missing bucket or object path)")

        client = storage.Client()
        content = client.bucket(bucket_name).blob(blob_name).download_as_bytes()
        doc = fitz.open(stream=BytesIO(content), filetype="pdf")

        full_parts = []
        for i, page in enumerate(doc, start=1):
            page_text = _page_to_text(page)
            if page_text.strip():
                full_parts.append(f"[PAGE {i}]\n{page_text}")
        doc.close()

        full_text = "\n\n".join(full_parts)
        return {"full_text": full_text, "term": _detect_term_year(full_text)}

    async def _gpt_parse(self, text: str, term: Optional[Tuple[str, int]], full_text: str) -> dict:
        if not self.openai_key or not self._client:
            return {"error": "OpenAI API key not configured"}

        year = term[1] if term else None
        start_date, end_date = _detect_semester_bounds(full_text, year)
        prompt = USER_PROMPT_TEMPLATE.format(
            term_str=f"{term[0]} {term[1]}" if term else "Unknown",
            start_date=start_date or "Not Listed",
            end_date=end_date or "Not Listed",
            text=text,
        )
        return await self._run_llm(prompt)

    async def _gpt_parse_chunked(
        self, chunks: List[str], term: Optional[Tuple[str, int]], full_text: str
    ) -> dict:
        results = []
        for chunk in chunks:
            r = await self._gpt_parse(chunk, term, full_text)
            if "error" not in r:
                results.append(r)
        if not results:
            return {"error": "All chunks failed to parse"}
        merged = results[0]
        for subsequent in results[1:]:
            for field in ("assignments", "exams", "lectures"):
                if isinstance(subsequent.get(field), list):
                    merged.setdefault(field, [])
                    merged[field] = _merge_items(merged[field], subsequent[field])
            for field in ("course_name", "instructor", "summary"):
                if not merged.get(field) and subsequent.get(field):
                    merged[field] = subsequent[field]
        return merged

    async def _run_llm(self, prompt: str) -> dict:
        try:
            response = self._client.beta.chat.completions.parse(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                response_format=SyllabusData,
                max_completion_tokens=MAX_TOKENS,
            )
            result = response.choices[0].message.parsed
            return result.model_dump() if result else {"error": "No parsed result returned"}
        except Exception as e:
            return {"error": f"GPT error: {str(e)}"}

    def _validate_and_merge(
        self, data: dict, full_text: str, term: Optional[Tuple[str, int]]
    ) -> dict:
        if not isinstance(data, dict):
            return {"error": "Parsed data is not a dictionary"}

        year = term[1] if term else None

        # Normalize dates GPT returned (catches "2/14", "Feb 14", etc.)
        data["assignments"] = _normalize_item_dates(data.get("assignments") or [], year)
        data["exams"] = _normalize_item_dates(data.get("exams") or [], year)
        data["lectures"] = _normalize_item_dates(data.get("lectures") or [], year)

        # Regex fallbacks fill in what GPT missed
        data["exams"] = _merge_items(data["exams"], _extract_exams_regex(full_text, term))
        data["assignments"] = _merge_items(data["assignments"], _extract_assignments_regex(full_text, term))

        # Lecture expansion (MWF → Mon+Wed+Fri entries, etc.)
        data["lectures"] = _expand_lectures(data.get("lectures") or [], full_text)

        # Final dedup
        data["exams"] = _dedupe_items(data["exams"], keys=("description", "date", "time_due"))
        data["assignments"] = _dedupe_items(data["assignments"], keys=("description", "date", "time_due"))
        data["lectures"] = _dedupe_items(data["lectures"], keys=("day", "start_time", "end_time"))

        # Grading total
        grading = data.get("grading")
        if grading and isinstance(grading.get("categories"), list):
            data["grading"]["total_weight"] = sum(
                float(c.get("weight") or 0) for c in grading["categories"]
            )

        return data