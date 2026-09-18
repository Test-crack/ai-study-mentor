import { callBackend, uploadFileToBackend, downloadFileFromBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import type { ExamType, BillingStatus } from '@/shared/constants/examTypes';

export type UserRoleFilter = 'ALL' | 'SUPERADMIN' | 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface UserRecord {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    profileImage: string | null;
    instituteId: string | null;
    instituteName: string | null;
}

export interface UsersMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FetchUsersResult {
    data: UserRecord[];
    meta: UsersMeta;
}

// ─── Institutes ───────────────────────────────────────────────────────────────

export interface InstituteOwnerSummary {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
}

export interface InstituteExamRecord {
    examType: ExamType;
    billingStatus: BillingStatus;
    trialEndsAt: string | null;
    seatCap: number | null;
}

export interface InstituteRecord {
    id: string;
    name: string;
    address: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    isActive: boolean;
    createdAt: string;
    studentCount: number;
    instructorCount: number;
    owner: InstituteOwnerSummary | null;
    exams: InstituteExamRecord[];
}

export async function fetchInstitutes(search?: string): Promise<{ data: InstituteRecord[] }> {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    const url = `${getBackendUrl()}/api/superadmin/institutes?${qs.toString()}`;
    return callBackend(url);
}

export async function createInstitute(payload: {
    instituteName: string;
    address?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    examTypes: ExamType[];
}): Promise<{ data: { institute: { id: string; name: string }; owner: { id: string; email: string; name: string | null }; exams: InstituteExamRecord[]; inviteEmailSent: boolean } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes`;
    return callBackend(url, { method: 'POST', body: JSON.stringify(payload) });
}

export async function toggleInstituteStatus(
    id: string,
    isActive: boolean
): Promise<{ data: { id: string; name: string; isActive: boolean } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/status`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}

export async function updateInstitute(
    id: string,
    payload: { name?: string; address?: string; logoUrl?: string; contactEmail?: string; contactPhone?: string; }
): Promise<{ data: { id: string; name: string; address: string | null; logoUrl: string | null; contactEmail: string | null; contactPhone: string | null; } }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify(payload) });
}

/** Set the full list of exams an institute offers (diff handled server-side). */
export async function setInstituteExams(
    id: string,
    examTypes: ExamType[]
): Promise<{ data: InstituteExamRecord[] }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/exams`;
    return callBackend(url, { method: 'PUT', body: JSON.stringify({ examTypes }) });
}

/** Set the billing status of one exam for an institute. */
export async function setExamStatus(
    id: string,
    examType: ExamType,
    billingStatus: BillingStatus
): Promise<{ data: InstituteExamRecord }> {
    const url = `${getBackendUrl()}/api/superadmin/institutes/${id}/exams/${examType}`;
    return callBackend(url, { method: 'PATCH', body: JSON.stringify({ billingStatus }) });
}

// ─── Subscriptions (flat view) ──────────────────────────────────────────────

export interface SubscriptionRecord {
    id: string;
    instituteId: string;
    instituteName: string;
    instituteActive: boolean;
    examType: ExamType;
    billingStatus: BillingStatus;
    trialEndsAt: string | null;
    seatCap: number | null;
    studentCount: number;
    createdAt: string;
}

export interface SubscriptionSummary {
    total: number;
    active: number;
    trial: number;
    cancelled: number;
}

export async function fetchSubscriptions(params?: {
    status?: BillingStatus;
    search?: string;
}): Promise<{ data: SubscriptionRecord[]; summary: SubscriptionSummary }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    const url = `${getBackendUrl()}/api/superadmin/subscriptions?${qs.toString()}`;
    return callBackend(url);
}

// ─── Exam config explorer (read-only; scoring config is file-sourced + code-reviewed) ──

export interface ExamConfigSummary {
    exam_id: string;
    status: string;
    label: string;
}

/** GET /api/superadmin/exams — list exams (status/label) for the config explorer. */
export async function fetchExamsForConfig(): Promise<{ data: ExamConfigSummary[] }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/exams`);
}

/** GET /api/superadmin/exams/:id/config — the full config entry (read-only) for viewing/drafting. */
export async function fetchExamConfig(examId: string): Promise<{ data: any }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/exams/${examId}/config`);
}

// ─── Question-bank inventory (read-only counts) ─────────────────────────────
// Live counts of how many questions exist per exam, broken down by component
// (Diagnostics / Daily Drills / Internal Assessment / Mock Test) and, within
// each, by skill → sub-skill → level. Powers the Question Bank dashboard so an
// admin can see which exam/skill/level is thin. Shape is uniform across
// components; component metadata says which dimensions each actually has.

export interface QBLevelCount {
    key: string;
    count: number;
}
export interface QBSubSkillNode {
    key: string;
    total: number;
    levels: QBLevelCount[];
}
export interface QBSkillNode {
    skill: string;
    total: number;
    levels: QBLevelCount[];
    subSkills: QBSubSkillNode[];
}
export interface QBComponentBreakdown {
    total: number;
    setCount?: number; // diagnostics only
    skills: QBSkillNode[];
}
export type QBComponentKey = 'diagnostic' | 'drill' | 'ia' | 'mock';
export interface QBComponentMeta {
    key: QBComponentKey;
    label: string;
    hasSubSkill: boolean;
    hasLevel: boolean;
    levelLabel: string | null;
}
export interface QBExam {
    examId: string;
    label: string;
    status: string;
    total: number;
    components: Record<QBComponentKey, QBComponentBreakdown>;
}
export interface QuestionBankSummary {
    generatedAt: string;
    components: QBComponentMeta[];
    exams: QBExam[];
}

/** GET /api/superadmin/question-bank/summary — full inventory tree. */
export async function fetchQuestionBankSummary(): Promise<QuestionBankSummary> {
    return callBackend(`${getBackendUrl()}/api/superadmin/question-bank/summary`);
}

// ─── Question-bank verification panel ───────────────────────────────────────
// Thin wrapper around /api/superadmin/verification/*. Backend is forked per
// exam/bank-type the same way the CLI tooling is (see CLAUDE.md) —
// ielts/drill and ielts/diagnostic are wired up server-side.

export interface CoverageSkill {
    skill: string;
    count: number;
}

export interface CoverageEntry {
    examId: string;
    label: string;
    bankType: string;
    skills: CoverageSkill[];
    /** Diagnostic only — content lives in fixed sets (import updates one in place, never creates new). */
    setCount?: number;
}

export async function fetchVerificationCoverage(): Promise<{ data: CoverageEntry[] }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/verification/coverage`);
}

export interface Layer1Finding {
    code: string;
    severity: 'pass' | 'warn' | 'fail';
    message: string;
    line: number | null;
}

export interface Layer1FileResult {
    fileName: string;
    outcome: 'pass' | 'warn' | 'fail';
    findings: Layer1Finding[];
}

function buildBatchForm(examId: string, bankType: string, files: File[], extra?: Record<string, string>): FormData {
    const form = new FormData();
    form.append('examId', examId);
    form.append('bankType', bankType);
    for (const [k, v] of Object.entries(extra ?? {})) form.append(k, v);
    for (const file of files) form.append('files', file);
    return form;
}

export async function runLayer1Verification(
    examId: string,
    bankType: string,
    files: File[],
    expected?: number,
): Promise<{ data: Layer1FileResult[] }> {
    const form = buildBatchForm(examId, bankType, files, expected ? { expected: String(expected) } : undefined);
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/layer1`, form, 'POST');
}

export async function startLayer2Verification(
    examId: string,
    bankType: string,
    files: File[],
): Promise<{ data: { jobId: string } }> {
    const form = buildBatchForm(examId, bankType, files);
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/layer2`, form, 'POST');
}

/**
 * POST /api/superadmin/verification/layer1/report — the CLI's colored .xlsx
 * (Summary sheet with per-file answer-letter distribution, one sheet per
 * file with every finding), not just the plain findings JSON runLayer1Verification returns.
 */
export async function downloadLayer1Report(
    examId: string,
    bankType: string,
    files: File[],
    expected?: number,
): Promise<{ blob: Blob; filename: string }> {
    const form = buildBatchForm(examId, bankType, files, expected ? { expected: String(expected) } : undefined);
    return downloadFileFromBackend(`${getBackendUrl()}/api/superadmin/verification/layer1/report`, form);
}

/**
 * GET /api/superadmin/verification/layer2/:jobId/report — the CLI's colored
 * .xlsx for a completed judge run (green/amber/red/grey per row, blind-solve
 * + adjudicator reasoning). Built from the job already held server-side —
 * never triggers a fresh (paid) judge run.
 */
export async function downloadLayer2Report(jobId: string): Promise<{ blob: Blob; filename: string }> {
    return downloadFileFromBackend(`${getBackendUrl()}/api/superadmin/verification/layer2/${jobId}/report`, undefined, 'GET');
}

export interface Layer2JobStatus {
    status: 'pending' | 'done' | 'error';
    startedAt: number;
    result: unknown | null;
    error: string | null;
}

export async function getLayer2JobStatus(jobId: string): Promise<{ data: Layer2JobStatus }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/verification/layer2/${jobId}`);
}

export interface ImportPlanFile {
    fileName: string;
    gateBlocked: string | null;
    toInsert: number;
    toUpdate: number;
    unchanged: number;
    errors: string[];
    updates: { source_key: string; changed: string[] }[];
}

export async function planImportBatch(
    examId: string,
    bankType: string,
    files: File[],
    expected?: number,
): Promise<{ data: ImportPlanFile[] }> {
    const form = buildBatchForm(examId, bankType, files, expected ? { expected: String(expected) } : undefined);
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/import/plan`, form, 'POST');
}

export interface ImportConfirmFile {
    fileName: string;
    gateBlocked: string | null;
    inserted: number;
    updated: number;
    unchanged: number;
    failed: number;
    errors: string[];
}

/**
 * POST /api/superadmin/verification/tag — stamps source_key onto each row
 * (reusing already-issued keys from the DB, allocating new ones for the
 * rest) and returns one combined tagged CSV, same as the CLI's
 * key-assignment-tool output. Pass one file for a single-file download, or
 * the whole selected batch for one combined "all" file.
 */
export async function tagBatchFiles(
    examId: string,
    bankType: string,
    files: File[],
    expected?: number,
): Promise<{ blob: Blob; filename: string }> {
    const form = buildBatchForm(examId, bankType, files, expected ? { expected: String(expected) } : undefined);
    return downloadFileFromBackend(`${getBackendUrl()}/api/superadmin/verification/tag`, form);
}

export async function confirmImportBatch(
    examId: string,
    bankType: string,
    files: File[],
    layer2Reviewed: boolean,
    expected?: number,
): Promise<{ data: ImportConfirmFile[] }> {
    const form = buildBatchForm(examId, bankType, files, {
        layer2Reviewed: String(layer2Reviewed),
        ...(expected ? { expected: String(expected) } : {}),
    });
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/import/confirm`, form, 'POST');
}

// ─── Diagnostic import (update-in-place — genuinely different shape from
// drills' upsert-by-source_key; see backend CLAUDE.md and the controller's
// own comments). One staging file per request, matched 1:1 by sequence
// against an EXISTING set_id — never inserts, never creates a new set.

export interface DiagnosticRowDiff {
    sequence: number;
    before: { question_type: string; prompt_text: string; correct_answer: string | null };
    after: {
        question_type: string;
        prompt_text: string;
        options: unknown;
        correct_answer: string | null;
        min_words: number | null;
        passage_text: string | null;
        audio_url: string | null;
        created_at: string;
    };
}

export interface DiagnosticImportPlanResult {
    fileName: string;
    setId: string;
    gateBlocked: string | null;
    updates: DiagnosticRowDiff[];
}

export interface DiagnosticImportConfirmResult {
    fileName: string;
    setId: string;
    updated: number;
    backupFile: string;
}

function buildDiagnosticImportForm(
    file: File,
    setId: string,
    sourceSetId: string | undefined,
    audioUrlPrefix: string,
    extra?: Record<string, string>,
): FormData {
    const form = new FormData();
    form.append('examId', 'ielts');
    form.append('bankType', 'diagnostic');
    form.append('setId', setId);
    if (sourceSetId) form.append('sourceSetId', sourceSetId);
    form.append('audioUrlPrefix', audioUrlPrefix);
    for (const [k, v] of Object.entries(extra ?? {})) form.append(k, v);
    form.append('files', file);
    return form;
}

export async function planDiagnosticImportBatch(
    file: File,
    setId: string,
    sourceSetId: string | undefined,
    audioUrlPrefix: string,
): Promise<{ data: DiagnosticImportPlanResult }> {
    const form = buildDiagnosticImportForm(file, setId, sourceSetId, audioUrlPrefix);
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/import/plan`, form, 'POST');
}

export async function confirmDiagnosticImportBatch(
    file: File,
    setId: string,
    sourceSetId: string | undefined,
    audioUrlPrefix: string,
    layer2Reviewed: boolean,
): Promise<{ data: DiagnosticImportConfirmResult }> {
    const form = buildDiagnosticImportForm(file, setId, sourceSetId, audioUrlPrefix, { layer2Reviewed: String(layer2Reviewed) });
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/verification/import/confirm`, form, 'POST');
}

export interface DiagnosticBackup {
    fileName: string;
    modifiedAt: string;
    rowCount: number;
}

export async function fetchDiagnosticBackups(setId: string): Promise<{ data: DiagnosticBackup[] }> {
    const qs = new URLSearchParams({ setId });
    return callBackend(`${getBackendUrl()}/api/superadmin/verification/import/backups?${qs.toString()}`);
}

export interface DiagnosticRestoreResult {
    setId: string;
    rowCount: number;
    wouldRestore: boolean;
    written: boolean;
}

export async function restoreDiagnosticBackup(
    backupFile: string,
    confirm: boolean,
): Promise<{ data: DiagnosticRestoreResult }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/verification/import/restore`, {
        method: 'POST',
        body: JSON.stringify({ backupFile, confirm }),
    });
}

/**
 * GET /api/superadmin/users
 * Fetch all platform users — SUPERADMIN only.
 */
export async function fetchAllUsers(params: {
    role?: UserRoleFilter;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<FetchUsersResult> {
    const { role, search, page = 1, limit = 50 } = params;

    const qs = new URLSearchParams();
    if (role && role !== 'ALL') qs.set('role', role);
    if (search) qs.set('search', search);
    qs.set('page', String(page));
    qs.set('limit', String(limit));

    const url = `${getBackendUrl()}/api/superadmin/users?${qs.toString()}`;
    return callBackend(url);
}

// ---------------------------------------------------------------------------
// Loadout engine
// ---------------------------------------------------------------------------
//
// The generic, config-driven Layer 1. Deliberately separate from the
// verification endpoints above: those fan out to five hand-written forks, this
// drives one engine from an authored loadout. Read-only — a loadout is a file.

export interface LoadoutSummaryRow {
    id: string;
    label: string;
    columnCount?: number;
    hasBucket?: boolean;
    hasSourceKey?: boolean;
    hookCount?: number;
    valid: boolean;
    error?: string;
}

export interface LoadoutColumnView {
    name: string;
    kind: string;
    required?: boolean;
    members?: string[];
    appliesWhen?: { column: string; in: string[] };
    forbiddenWhen?: { column: string; in: string[] };
    variants?: { when?: { column: string; in: string[] }; kind: string; allowed?: string[] }[];
}

export interface LoadoutDetail {
    id: string;
    label: string;
    columns: LoadoutColumnView[];
    bucket: string[] | null;
    sourceKey: string | null;
    conditionalColumns: { column: string; byColumn: string; allowed: Record<string, string[]> }[];
    rowAllowList: { keyColumn: string; valueColumn: string; allowed: Record<string, string[]> } | null;
    hooks: string[];
    checkOrder: string[];
    expectedRows: { fallback: number };
}

export interface LoadoutFinding {
    code: string;
    severity: 'fail' | 'warn';
    scope: string;
    message: string;
    line?: number;
    column?: string;
}

export interface LoadoutFileResult {
    fileName: string;
    outcome: 'pass' | 'warn' | 'fail';
    expectedRowCount: number;
    rowCount: number;
    bucket: Record<string, string> | null;
    fileFindings: LoadoutFinding[];
    rowFindings: LoadoutFinding[];
}

export interface LoadoutVerifyResult {
    loadout: { id: string; label: string };
    expected: number;
    outcome: 'pass' | 'warn' | 'fail';
    runFindings: LoadoutFinding[];
    files: LoadoutFileResult[];
}

export async function fetchLoadouts(): Promise<{ loadouts: LoadoutSummaryRow[]; knownHooks: string[] }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts`);
}

export async function fetchLoadoutDetail(id: string): Promise<{ summary: LoadoutDetail; raw: unknown }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts/${encodeURIComponent(id)}`);
}

// Returns the body as-is: uploadFileToBackend does not wrap it, and this
// endpoint does not nest under `data` the way the older ones do.
export async function verifyWithLoadout(
    loadoutId: string,
    files: File[],
    expected?: number,
    requireSourceKey?: boolean,
): Promise<LoadoutVerifyResult> {
    const form = new FormData();
    form.append('loadoutId', loadoutId);
    if (expected) form.append('expected', String(expected));
    if (requireSourceKey) form.append('requireSourceKey', 'true');
    for (const file of files) form.append('files', file);
    return uploadFileToBackend(`${getBackendUrl()}/api/superadmin/loadouts/verify`, form, 'POST');
}

// --- Authoring a loadout in the panel ------------------------------------
//
// The admin describes columns and rules; the backend expands that into the
// engine's real (much fussier) format. Only loadouts created here are editable —
// the four reference ones are pinned by the parity suite and are refused.

export type DraftColumnKind = 'text' | 'choice' | 'number' | 'options' | 'answer';

export interface DraftColumn {
    name: string;
    kind: DraftColumnKind;
    required?: boolean;
    values?: string[];
    min?: number;
    max?: number;
    optionKeys?: string[];
    onlyWhen?: { column: string; values: string[] };
}

export interface LoadoutDraft {
    id: string;
    label: string;
    columns: DraftColumn[];
    expectedRows: number;
    bucketColumns?: string[];
    checkFilename?: boolean;
    keyPrefix?: string;
    keyColumns?: string[];
}

export async function previewLoadoutDraft(
    draft: LoadoutDraft,
): Promise<{ ok: boolean; message?: string; summary?: LoadoutDetail }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts/preview`, {
        method: 'POST',
        body: JSON.stringify({ draft }),
    });
}

export async function createLoadout(draft: LoadoutDraft): Promise<{ id: string }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts`, {
        method: 'POST',
        body: JSON.stringify({ draft }),
    });
}

export async function updateLoadout(id: string, draft: LoadoutDraft): Promise<{ id: string }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ draft }),
    });
}

export async function deleteLoadout(id: string): Promise<{ deleted: string }> {
    return callBackend(`${getBackendUrl()}/api/superadmin/loadouts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

/** POST /verify/report — the same run as a colour-coded .xlsx, pass or fail. */
export async function downloadLoadoutReport(
    loadoutId: string,
    files: File[],
    expected?: number,
): Promise<{ blob: Blob; filename: string }> {
    const form = new FormData();
    form.append('loadoutId', loadoutId);
    if (expected) form.append('expected', String(expected));
    for (const file of files) form.append('files', file);
    return downloadFileFromBackend(`${getBackendUrl()}/api/superadmin/loadouts/verify/report`, form, 'POST');
}
