export interface StreamingChartPoint {
  date: string;
  streams: number;
  dailyStreams: number;
}

export interface ParsedSpotifyStreamingCsv {
  points: StreamingChartPoint[];
  stats: {
    totalRows: number;
    validRows: number;
    duplicateDates: number;
    ignoredRows: number;
  };
}

const DATE_HEADER_CANDIDATES = ['date', 'data', 'day', 'dia'];
const STREAM_HEADER_CANDIDATES = ['streams', 'streaming', 'streamings', 'ouvintes', 'listeners', 'plays'];

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function detectDelimiter(headerLine: string) {
  const delimiters = [',', ';', '\t'];
  let bestDelimiter = ',';
  let bestScore = 0;

  delimiters.forEach((delimiter) => {
    const score = headerLine.split(delimiter).length;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
}

function splitCsvLine(line: string, delimiter: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result.map((value) => value.replace(/^"|"$/g, '').trim());
}

function findColumnIndex(headers: string[], candidates: string[]) {
  const exactMatch = headers.findIndex((header) => candidates.includes(header));
  if (exactMatch >= 0) {
    return exactMatch;
  }

  return headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)));
}

function buildIsoDate(year: number, month: number, day: number) {
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  const isoMonth = String(month).padStart(2, '0');
  const isoDay = String(day).padStart(2, '0');
  return `${year}-${isoMonth}-${isoDay}`;
}

function parseDateToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoFormatMatch = trimmed.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
  if (isoFormatMatch) {
    const [, yearRaw, monthRaw, dayRaw] = isoFormatMatch;
    return buildIsoDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  const brFormatMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (brFormatMatch) {
    const [, dayRaw, monthRaw, yearRaw] = brFormatMatch;
    return buildIsoDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function parseStreamValue(value: string) {
  const cleaned = value.replace(/[^\d-]/g, '');
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseInt(cleaned, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function parseSpotifyStreamingCsv(csvContent: string): ParsedSpotifyStreamingCsv {
  const rows = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rows.length < 2) {
    throw new Error('O CSV precisa ter cabeçalho e pelo menos uma linha de dados.');
  }

  const delimiter = detectDelimiter(rows[0]);
  const headers = splitCsvLine(rows[0], delimiter).map(normalizeHeader);
  const dateColumnIndex = findColumnIndex(headers, DATE_HEADER_CANDIDATES);
  const streamsColumnIndex = findColumnIndex(headers, STREAM_HEADER_CANDIDATES);

  if (dateColumnIndex < 0 || streamsColumnIndex < 0) {
    throw new Error('Não encontrei colunas de data e streams no CSV.');
  }

  const streamsByDate = new Map<string, number>();
  const totalRows = rows.length - 1;
  let validRows = 0;
  let duplicateDates = 0;

  rows.slice(1).forEach((line) => {
    const columns = splitCsvLine(line, delimiter);
    const dateValue = columns[dateColumnIndex] ?? '';
    const streamsValue = columns[streamsColumnIndex] ?? '';

    const date = parseDateToIso(dateValue);
    const streams = parseStreamValue(streamsValue);

    if (!date || streams === null) {
      return;
    }

    validRows += 1;

    const previousStreams = streamsByDate.get(date);
    if (typeof previousStreams === 'number') {
      duplicateDates += 1;
      streamsByDate.set(date, previousStreams + streams);
      return;
    }

    streamsByDate.set(date, streams);
  });

  if (streamsByDate.size === 0) {
    throw new Error('Nenhuma linha válida foi encontrada no CSV.');
  }

  const orderedDates = [...streamsByDate.keys()].sort((a, b) => a.localeCompare(b));
  let accumulatedStreams = 0;

  const points = orderedDates.map((date) => {
    const dailyStreams = streamsByDate.get(date) ?? 0;
    accumulatedStreams += dailyStreams;

    return {
      date,
      streams: accumulatedStreams,
      dailyStreams,
    };
  });

  return {
    points,
    stats: {
      totalRows,
      validRows,
      duplicateDates,
      ignoredRows: totalRows - validRows,
    },
  };
}