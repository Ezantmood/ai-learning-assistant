// Smoke AI thật với dữ liệu học tập giả; không in key, không ghi DB.
// node --env-file=.env.local scripts/ai-smoke.mjs [jpeg_fixture] [pdf_fixture]
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-smoke-'));
const checks = [];
const onlyPdf = process.argv.includes('--only=pdf');
function check(name, pass, elapsed) { checks.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${elapsed ? ` ${elapsed}ms` : ''}`); }
async function timed(name, fn) { const start = Date.now(); const result = await fn(); console.log(`TIME ${name} ${Date.now() - start}ms`); return result; }
try {
  for (const name of ['models', 'transport']) {
    const source = (await fs.readFile(`src/shared/ai/${name}.ts`, 'utf8')).replace("from './models'", "from './models.mjs'");
    await fs.writeFile(path.join(temp, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  }
  const ai = await import(pathToFileURL(path.join(temp, 'transport.mjs')).href);
  const { SUMMARY_MODEL } = await import(pathToFileURL(path.join(temp, 'models.mjs')).href);
  console.log(`MODEL ${SUMMARY_MODEL}`);
  if (!onlyPdf) {
  const text = 'Chương 1: Tế bào là đơn vị cơ bản của sự sống.\nChương 2: Định luật Ôm: U = I * R. U là điện áp (V), I là dòng điện (A), R là điện trở (ôm).';
  const summary = await timed('summary-sections', () => ai.summarizeWithGemini({ kind: 'txt', textContent: text }, { level: 'short', scope: 'sections', sectionTitle: 'Chương 2' }));
  check('summary correct section', /Ôm|điện/.test(summary) && !/đơn vị cơ bản của sự sống/.test(summary));
  const first = await timed('question', () => ai.answerWithGemini({ contextText: text, question: 'Định luật Ôm là gì?' }));
  const follow = await timed('follow-up', () => ai.answerWithGemini({ contextText: text, question: 'Nếu điện trở là 4 ôm và điện áp là 8 V thì dòng điện bằng bao nhiêu?', history: [{ question: 'Định luật Ôm là gì?', answer: first }] }));
  check('question/follow-up grounded', /2/.test(follow) && /A|ampe/.test(follow));
  const contextText = 'Giải phương trình 2x + 3 = 7.';
  const analysis = await timed('analysis', () => ai.solveWithGemini({ contextText, kind: 'analysis' }));
  check('analysis identifies topic', /phương trình|đại số/i.test(analysis.solutionText));
  const hint = await timed('hint-1', () => ai.solveWithGemini({ contextText, kind: 'hint', hintStep: 1 }));
  check('hint does not reveal final answer', !/x\s*=\s*2(?:\D|$)/i.test(hint.solutionText));
  const next = await timed('hint-2', () => ai.solveWithGemini({ contextText, kind: 'hint', hintStep: 2, history: [{ kind: 'hint', text: hint.solutionText }] }));
  check('next hint differs', next.solutionText !== hint.solutionText && !/x\s*=\s*2(?:\D|$)/i.test(next.solutionText));
  const explanation = await timed('explanation', () => ai.solveWithGemini({ contextText, kind: 'explanation' }));
  check('explanation nonempty', explanation.solutionText.length > 40);
  const full = await timed('full-solution', () => ai.solveWithGemini({ contextText, kind: 'solution' }));
  check('full solution on request', /x\s*=\s*2/.test(full.solutionText));
  const answer = await timed('solution-follow-up', () => ai.solveWithGemini({ contextText, kind: 'follow_up', question: 'Vì sao trừ 3 ở cả hai vế?', history: [{ kind: 'solution', text: full.solutionText }] }));
  check('solution follow-up', /hai vế|tương đương|cân bằng/i.test(answer.solutionText));
  }
  if (process.argv[2] && !onlyPdf) {
    const jpeg = (await fs.readFile(process.argv[2])).toString('base64');
    const ocr = await timed('ocr', () => ai.ocrWithGemini(jpeg));
    check('OCR reads equation', /2\s*x\s*\+\s*3\s*=\s*7/i.test(ocr.extractedText));
  }
  if (process.argv[3]) {
    const pdf = (await fs.readFile(process.argv[3])).toString('base64');
    const raw = await timed('pdf-extraction', () => ai.summarizeWithGemini({ kind: 'pdf', base64Data: pdf }, { level: 'short', scope: 'whole', sectionTitle: '' }));
    const parsed = ai.parseExtractionJson(raw);
    check('PDF extraction/summary', parsed.extractedText.length > 100 && parsed.summaryText.length > 20 && !parsed.truncated);
  }
  console.log(`AI_SMOKE ${checks.filter(Boolean).length}/${checks.length}`);
  if (!checks.every(Boolean)) process.exitCode = 1;
} catch (error) { console.error(error instanceof Error ? error.message : 'AI_SMOKE_ERROR'); process.exitCode = 1; }
finally { await fs.rm(temp, { recursive: true, force: true }); }
