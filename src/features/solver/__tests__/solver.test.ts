import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { solveWithGemini, GeminiEmptyError, GeminiQuotaError } from '../../../lib/ai/transport';
import { supabase } from '../../../shared/lib/supabase';
import { getSolution, requestSolution, type SolverDocument } from '../api';
import { isSolverQuotaError, SolverTruncatedError, toSolverErrorMessage } from '../errors';
import { solutionKey } from '../queries';

jest.mock('../../../shared/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../../../lib/ai/transport', () => {
  const actual = jest.requireActual('../../../lib/ai/transport') as Record<string, unknown>;
  return { ...actual, solveWithGemini: jest.fn() };
});
const solveMock = jest.mocked(solveWithGemini);
const fromMock = jest.mocked(supabase.from);
const doc: SolverDocument = { id: 'doc-a', user_id: 'a', file_ext: 'pdf', extraction_status: 'done', extracted_text: ' Đề toán ' };
const row = { id: 's1', document_id: 'doc-a', user_id: 'a', solution_text: 'Bước 1', model: 'gemini-3.5-flash' };
beforeEach(() => { jest.clearAllMocks(); });

describe('solver API', () => {
  it('guard sở hữu, DOCX, thiếu text trước mạng và DB', async () => {
    for (const document of [{ ...doc, user_id: 'b' }, { ...doc, file_ext: 'docx' }, { ...doc, extracted_text: '  ' }]) {
      await expect(requestSolution({ document, userId: 'a' })).rejects.toThrow();
    }
    expect(solveMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });
  it('upsert theo document_id, dùng model chung, đọc đúng key', async () => {
    let payload: Record<string, unknown> = {};
    fromMock.mockImplementation((() => ({ upsert: (value: Record<string, unknown>) => {
      payload = value;
      return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
    } })) as unknown as typeof supabase.from);
    solveMock.mockResolvedValue({ solutionText: ' Bước 1 ', truncated: false });
    await expect(requestSolution({ document: doc, userId: 'a' })).resolves.toEqual(row);
    expect(solveMock).toHaveBeenCalledTimes(1);
    expect(solveMock).toHaveBeenCalledWith({ contextText: 'Đề toán' });
    expect(payload).toMatchObject({ document_id: 'doc-a', user_id: 'a', solution_text: 'Bước 1', model: 'gemini-3.5-flash' });
    expect(solutionKey('doc-a')).toEqual(['solution', 'doc-a']);
  });
  it('cứu phần dở rồi báo cắt, rỗng không ghi đè cũ', async () => {
    const upsert = jest.fn(() => ({ select: () => ({ single: async () => ({ data: row, error: null }) }) }));
    fromMock.mockImplementation((() => ({ upsert })) as unknown as typeof supabase.from);
    solveMock.mockResolvedValueOnce({ solutionText: 'Bước 1', truncated: true });
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow(SolverTruncatedError);
    expect(upsert).toHaveBeenCalledTimes(1);
    solveMock.mockRejectedValueOnce(new GeminiEmptyError());
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow(GeminiEmptyError);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
  it('chặn hai lần gọi đồng thời và không retry quota', async () => {
    let resolve!: (value: { solutionText: string; truncated: boolean }) => void;
    solveMock.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    fromMock.mockImplementation((() => ({ upsert: () => ({ select: () => ({ single: async () => ({ data: row, error: null }) }) }) })) as unknown as typeof supabase.from);
    const first = requestSolution({ document: doc, userId: 'a' });
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow('đang chạy');
    resolve({ solutionText: 'Bước 1', truncated: false });
    await first;
    expect(solveMock).toHaveBeenCalledTimes(1);
    solveMock.mockRejectedValueOnce(new GeminiQuotaError());
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow(GeminiQuotaError);
    expect(isSolverQuotaError(new GeminiQuotaError())).toBe(true);
    expect(toSolverErrorMessage(new GeminiQuotaError())).toMatch(/giới hạn/);
  });
  it('getSolution lọc user_id và document_id', async () => {
    const eq = jest.fn().mockReturnThis();
    fromMock.mockImplementation((() => ({ select: () => ({ eq, maybeSingle: async () => ({ data: row, error: null }) }) })) as unknown as typeof supabase.from);
    await expect(getSolution({ documentId: 'doc-a', userId: 'a' })).resolves.toEqual(row);
    expect(eq).toHaveBeenCalledWith('document_id', 'doc-a');
    expect(eq).toHaveBeenCalledWith('user_id', 'a');
  });
  it('gợi ý quá 20.000 ký tự không ghi DB; lỗi upsert được đưa lên UI', async () => {
    solveMock.mockResolvedValueOnce({ solutionText: 'x'.repeat(20001), truncated: false });
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow('20.000');
    expect(fromMock).not.toHaveBeenCalled();

    solveMock.mockResolvedValueOnce({ solutionText: 'Bước 1', truncated: false });
    fromMock.mockImplementation((() => ({ upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('db down') }) }) }) })) as unknown as typeof supabase.from);
    await expect(requestSolution({ document: doc, userId: 'a' })).rejects.toThrow('db down');
    expect(toSolverErrorMessage(new Error('db down'))).toMatch(/Không tạo được/);
  });
});
