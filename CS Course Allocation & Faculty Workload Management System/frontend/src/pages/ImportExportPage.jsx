import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  SkipForward,
  RefreshCw,
  Eye,
  ChevronDown,
  Info,
  FileText,
  Table2,
  Layers,
  Users,
  BookOpen,
  Clock
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Validates a faculty row and returns an array of error strings.
 */
function validateFacultyRow(row, idx, existingCodes) {
  const errors = [];
  if (!row['Faculty Name'] || String(row['Faculty Name']).trim() === '') {
    errors.push('Missing required field: Faculty Name');
  }
  if (!row['Code'] || String(row['Code']).trim() === '') {
    errors.push('Missing required field: Code (e.g. FAC-001)');
  } else if (existingCodes.has(String(row['Code']).trim())) {
    errors.push(`Duplicate code: "${row['Code']}" already exists in system`);
  }
  if (!row['Designation']) errors.push('Missing: Designation');
  if (!row['Programme'] || !['BSCS', 'BSSE', 'MSCS'].includes(row['Programme'])) {
    errors.push('Programme must be BSCS, BSSE, or MSCS');
  }
  return errors;
}

/**
 * Validates a course row.
 */
function validateCourseRow(row, idx, existingCodes) {
  const errors = [];
  if (!row['Course Code']) errors.push('Missing: Course Code');
  else if (existingCodes.has(String(row['Course Code']).trim())) {
    errors.push(`Duplicate: Course Code "${row['Course Code']}" already in database`);
  }
  if (!row['Title']) errors.push('Missing: Course Title');
  if (!row['Programme'] || !['BSCS', 'BSSE', 'MSCS'].includes(row['Programme'])) {
    errors.push('Programme must be BSCS, BSSE, or MSCS');
  }
  if (!row['Credits'] || !/^\d+\(\d+,\d+\)$/.test(String(row['Credits']))) {
    errors.push('Credits format must be N(T,L) e.g. 4(3,1)');
  }
  return errors;
}

// ─── Export Engine ──────────────────────────────────────────────────────────

const BSCS_ALLOCATIONS = [
  { 'Course Code': 'CS-101', Title: 'Programming Fundamentals', Semester: 1, Section: 'A', Credits: '4(3,1)', Faculty: 'Engr. Bilal Hassan', 'Prev Faculty': 'Engr. Bilal Hassan (FA24)', Status: 'Approved' },
  { 'Course Code': 'CS-201', Title: 'Data Structures & Algorithms', Semester: 3, Section: 'A', Credits: '4(3,1)', Faculty: 'Dr. Shafiq Ur Rehman', 'Prev Faculty': 'Dr. Shafiq Ur Rehman (FA24)', Status: 'Approved' },
  { 'Course Code': 'CS-202', Title: 'Database Systems', Semester: 3, Section: 'A', Credits: '4(3,1)', Faculty: 'Dr. Amina Tariq', 'Prev Faculty': 'Dr. Amina Tariq (SP24)', Status: 'Under Review' },
  { 'Course Code': 'CS-301', Title: 'Operating Systems', Semester: 5, Section: 'A', Credits: '4(3,1)', Faculty: 'Unassigned', 'Prev Faculty': 'Dr. Kamran Malik (SP24)', Status: 'Draft' },
  { 'Course Code': 'CS-305', Title: 'Artificial Intelligence', Semester: 5, Section: 'B', Credits: '3(3,0)', Faculty: 'Ms. Zainab Farooq (Visiting)', 'Prev Faculty': 'Dr. Sarah Ahmed (FA24)', Status: 'Draft' },
];
const BSSE_ALLOCATIONS = [
  { 'Course Code': 'SE-302', Title: 'Software Requirements Engineering', Semester: 3, Section: 'A', Credits: '3(3,0)', Faculty: 'Dr. Sarah Ahmed', 'Prev Faculty': 'Dr. Sarah Ahmed (FA24)', Status: 'Approved' },
  { 'Course Code': 'SE-401', Title: 'Software Design & Architecture', Semester: 5, Section: 'A', Credits: '3(3,0)', Faculty: 'Unassigned', 'Prev Faculty': 'Dr. Sarah Ahmed (SP24)', Status: 'Draft' },
];
const MSCS_ALLOCATIONS = [
  { 'Course Code': 'CS-701', Title: 'Advanced Analysis of Algorithms', Semester: 1, Section: 'Evening', Credits: '3(3,0)', Faculty: 'Dr. Shafiq Ur Rehman', 'Prev Faculty': 'Dr. Shafiq Ur Rehman (FA24)', Status: 'Approved' },
  { 'Course Code': 'CS-705', Title: 'Advanced Cloud & Distributed Systems', Semester: 2, Section: 'Evening', Credits: '3(3,0)', Faculty: 'Engr. Haris Mehmood (Visiting)', 'Prev Faculty': 'N/A', Status: 'Draft' },
];
const FACULTY_LOAD = [
  { 'Faculty ID': 'FAC-001', Name: 'Dr. Kamran Malik', Designation: 'Professor (HOD)', Programme: 'BSCS', 'Theory Hrs': 3, 'Lab Hrs': 0, 'Total Load': 3, 'Max Allowed': 6, Status: 'Balanced' },
  { 'Faculty ID': 'FAC-002', Name: 'Dr. Shafiq Ur Rehman', Designation: 'Professor', Programme: 'BSCS', 'Theory Hrs': 6, 'Lab Hrs': 0, 'Total Load': 6, 'Max Allowed': 9, Status: 'Balanced' },
  { 'Faculty ID': 'FAC-003', Name: 'Dr. Amina Tariq', Designation: 'Asst. Professor', Programme: 'BSCS', 'Theory Hrs': 12, 'Lab Hrs': 3, 'Total Load': 15, 'Max Allowed': 12, Status: 'OVERLOADED' },
  { 'Faculty ID': 'FAC-004', Name: 'Engr. Bilal Hassan', Designation: 'Lecturer', Programme: 'BSCS', 'Theory Hrs': 6, 'Lab Hrs': 7, 'Total Load': 13, 'Max Allowed': 15, Status: 'Balanced' },
  { 'Faculty ID': 'FAC-005', Name: 'Dr. Sarah Ahmed', Designation: 'Assoc. Professor', Programme: 'BSSE', 'Theory Hrs': 9, 'Lab Hrs': 0, 'Total Load': 9, 'Max Allowed': 12, Status: 'Balanced' },
  { 'Faculty ID': 'VIS-001', Name: 'Ms. Zainab Farooq', Designation: 'Visiting Lecturer', Programme: 'BSCS', 'Theory Hrs': 3, 'Lab Hrs': 3, 'Total Load': 6, 'Max Allowed': 6, Status: 'Balanced' },
  { 'Faculty ID': 'VIS-002', Name: 'Engr. Haris Mehmood', Designation: 'Visiting Lecturer', Programme: 'MSCS', 'Theory Hrs': 3, 'Lab Hrs': 0, 'Total Load': 3, 'Max Allowed': 6, Status: 'Underloaded' },
];
const REMAINING_COURSES = [
  { Programme: 'BSCS', Semester: 5, 'Course Code': 'CS-301', Title: 'Operating Systems', Credits: '4(3,1)', 'Theory Cr': 3, 'Lab Cr': 1, 'Recommended Faculty': 'Dr. Kamran Malik (88%)', Status: 'Unassigned' },
  { Programme: 'BSCS', Semester: 5, 'Course Code': 'CS-305', Title: 'Artificial Intelligence', Credits: '3(3,0)', 'Theory Cr': 3, 'Lab Cr': 0, 'Recommended Faculty': 'Ms. Zainab Farooq (82%)', Status: 'Draft (Pending)' },
  { Programme: 'BSSE', Semester: 5, 'Course Code': 'SE-401', Title: 'Software Design & Architecture', Credits: '3(3,0)', 'Theory Cr': 3, 'Lab Cr': 0, 'Recommended Faculty': 'Dr. Sarah Ahmed (94%)', Status: 'Unassigned' },
];

function exportMasterWorkbook(sessionCode) {
  const wb = XLSX.utils.book_new();

  const toSheet = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    return ws;
  };

  XLSX.utils.book_append_sheet(wb, toSheet(BSCS_ALLOCATIONS), 'BSCS Allocations');
  XLSX.utils.book_append_sheet(wb, toSheet(BSSE_ALLOCATIONS), 'BSSE Allocations');
  XLSX.utils.book_append_sheet(wb, toSheet(MSCS_ALLOCATIONS), 'MSCS Allocations');
  XLSX.utils.book_append_sheet(wb, toSheet(FACULTY_LOAD),     'Faculty Load Report');
  XLSX.utils.book_append_sheet(wb, toSheet(REMAINING_COURSES),'Remaining Courses');

  XLSX.writeFile(wb, `CS_Allocation_${sessionCode}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportSheet(data, sheetName, fileName) {
  const wb   = XLSX.utils.book_new();
  const ws   = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─── Import Preview Table ──────────────────────────────────────────────────

const ImportPreviewTable = ({ rows, importType, onConfirm, onCancel }) => {
  const [rowDecisions, setRowDecisions] = useState(
    () => Object.fromEntries(rows.map((r, i) => [i, r.errors.length > 0 ? 'skip' : 'import']))
  );

  const validCount   = rows.filter((r, i) => r.errors.length === 0 && rowDecisions[i] !== 'skip').length;
  const skippedCount = rows.filter((r, i) => r.errors.length === 0 && rowDecisions[i] === 'skip').length + rows.filter(r => r.errors.length > 0).length;
  const updateCount  = rows.filter((r, i) => r.isDuplicate && rowDecisions[i] === 'update').length;

  const toggleDecision = (idx, current) => {
    if (rows[idx].errors.length > 0 && !rows[idx].isDuplicate) return; // can't import broken rows
    setRowDecisions(prev => ({
      ...prev,
      [idx]: current === 'import' ? 'skip' : current === 'skip' ? 'import' : 'skip',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Preview Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {validCount} Valid rows to import
        </span>
        {updateCount > 0 && (
          <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
            <AlertTriangle size={14} className="text-amber-500" />
            {updateCount} will update existing records
          </span>
        )}
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <SkipForward size={14} className="text-slate-400" />
          {skippedCount} rows will be skipped
        </span>
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                {Object.keys(rows[0]?.data || {}).map(col => (
                  <th key={col} className="py-2 px-3 whitespace-nowrap">{col}</th>
                ))}
                <th className="py-2 px-3 w-24">Errors</th>
                <th className="py-2 px-3 w-28 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const hasErrors = row.errors.length > 0;
                const isDup     = row.isDuplicate;
                const decision  = rowDecisions[idx];

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      hasErrors
                        ? 'bg-red-50/60'
                        : isDup
                        ? 'bg-amber-50/60'
                        : decision === 'skip'
                        ? 'bg-slate-50/80 opacity-60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                    {Object.values(row.data).map((val, ci) => (
                      <td key={ci} className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap max-w-[120px] truncate">
                        {String(val ?? '')}
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      {hasErrors ? (
                        <div className="space-y-0.5">
                          {row.errors.map((e, ei) => (
                            <div key={ei} className="flex items-start gap-1 text-red-700">
                              <XCircle size={11} className="shrink-0 mt-0.5" />
                              <span className="leading-snug">{e}</span>
                            </div>
                          ))}
                        </div>
                      ) : isDup ? (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold">
                          <AlertTriangle size={11} /> Duplicate
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 size={11} /> Valid
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {hasErrors && !isDup ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                          Auto-Skip
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleDecision(idx, decision)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            decision === 'import'
                              ? 'bg-academic-600 text-white'
                              : decision === 'update'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {decision === 'import' ? 'Import' : decision === 'update' ? 'Update' : 'Skip'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm / Cancel */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
        >
          Cancel &amp; Re-upload
        </button>
        <button
          onClick={() => onConfirm({ valid: validCount, skipped: skippedCount, updated: updateCount })}
          disabled={validCount === 0 && updateCount === 0}
          className="px-5 py-2 rounded-xl bg-academic-600 hover:bg-academic-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
        >
          <ArrowRight size={14} />
          <span>Confirm: Import {validCount + updateCount} Records</span>
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

export const ImportExportPage = () => {
  const { currentSession, showToast } = useApp();

  // Import state machine
  const [importType, setImportType] = useState('faculty'); // 'faculty' | 'courses'
  const [importStage, setImportStage] = useState('idle'); // 'idle' | 'preview' | 'done'
  const [previewRows, setPreviewRows] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Simulated existing codes in DB
  const existingFacultyCodes = new Set(['FAC-001', 'FAC-002', 'FAC-003', 'FAC-004', 'FAC-005', 'FAC-006', 'VIS-001', 'VIS-002']);
  const existingCourseCodes  = new Set(['CS-101', 'CS-201', 'CS-202', 'CS-301', 'CS-305', 'SE-302', 'SE-401', 'CS-701', 'CS-705']);

  const parseFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb      = XLSX.read(e.target.result, { type: 'binary' });
        const ws      = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawRows.length === 0) {
          showToast('The uploaded file appears to be empty.', 'error');
          return;
        }

        const processed = rawRows.map((row, idx) => {
          const errors = importType === 'faculty'
            ? validateFacultyRow(row, idx, existingFacultyCodes)
            : validateCourseRow(row, idx, existingCourseCodes);

          const isDuplicate = importType === 'faculty'
            ? existingFacultyCodes.has(String(row['Code'] || '').trim())
            : existingCourseCodes.has(String(row['Course Code'] || '').trim());

          return { data: row, errors, isDuplicate };
        });

        setPreviewRows(processed);
        setImportStage('preview');
      } catch (err) {
        showToast('Failed to parse file. Ensure it is a valid .xlsx or .csv file.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  }, [importType]);

  const handleFileChange = (e) => parseFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    parseFile(e.dataTransfer.files?.[0]);
  };

  const handleConfirmImport = (summary) => {
    setImportResult(summary);
    setImportStage('done');
    showToast(`Import complete: ${summary.valid + summary.updated} records processed successfully.`, 'success');
  };

  const handleReset = () => {
    setImportStage('idle');
    setPreviewRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const templateData = importType === 'faculty'
      ? [{ 'Faculty Name': 'Dr. Example Name', Code: 'FAC-099', Designation: 'Assistant Professor', Programme: 'BSCS', 'Employment Type': 'full_time', Eligibility: 'Theory & Lab', 'Max Hours': 12, 'Min Hours': 9, Specialization: 'Algorithms, Data Structures' }]
      : [{ 'Course Code': 'CS-001', Title: 'Example Course', Programme: 'BSCS', Semester: 3, Credits: '3(3,0)', 'Required Expertise': 'Algorithms, C++' }];

    exportSheet(templateData, 'Template', `${importType}_import_template`);
    showToast('Template downloaded. Fill it and re-upload.', 'info');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet size={24} className="text-academic-600" />
          <span>Import / Export &amp; Master Reports</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate official department allocation Excel workbooks and bulk-import faculty/course data with validation.
        </p>
      </div>

      {/* ══ EXPORT SECTION ═══════════════════════════════════════ */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-academic-100 text-academic-700">
            <Download size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Export Official Department Reports</h2>
            <p className="text-xs text-slate-500">
              Download clean multi-sheet Excel workbooks ready for Dean / Registrar sign-off.
            </p>
          </div>
        </div>

        {/* Master Export */}
        <div className="p-4 rounded-xl bg-academic-50/70 border border-academic-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-academic-950 text-sm">Complete Allocation Workbook</h3>
              <p className="text-xs text-academic-700 mt-0.5">
                Includes: BSCS Allocations, BSSE Allocations, MSCS Allocations, Faculty Load Report, and Remaining Courses — 5 sheets.
              </p>
            </div>
            <button
              onClick={() => {
                exportMasterWorkbook(currentSession.session_code);
                showToast(`Exporting complete workbook for ${currentSession.session_code}...`, 'success');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              <FileSpreadsheet size={15} />
              <span>Download Master Workbook</span>
            </button>
          </div>
        </div>

        {/* Individual Sheet Exports */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'BSCS Allocations',     data: BSCS_ALLOCATIONS,  sheet: 'BSCS', file: 'BSCS_Allocations_FA25',     icon: <Layers  size={15} /> },
            { label: 'BSSE Allocations',     data: BSSE_ALLOCATIONS,  sheet: 'BSSE', file: 'BSSE_Allocations_FA25',     icon: <Layers  size={15} /> },
            { label: 'MSCS Allocations',     data: MSCS_ALLOCATIONS,  sheet: 'MSCS', file: 'MSCS_Allocations_FA25',     icon: <Layers  size={15} /> },
            { label: 'Faculty Load Report',  data: FACULTY_LOAD,      sheet: 'Faculty Load', file: 'Faculty_Load_FA25',   icon: <Users   size={15} /> },
            { label: 'Remaining Courses',    data: REMAINING_COURSES, sheet: 'Remaining', file: 'Remaining_Courses_FA25', icon: <Clock   size={15} /> },
          ].map(({ label, data, sheet, file, icon }) => (
            <button
              key={label}
              onClick={() => {
                exportSheet(data, sheet, file);
                showToast(`Exporting: ${label}...`, 'success');
              }}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-academic-300 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-academic-100 text-slate-500 group-hover:text-academic-700 transition-colors shrink-0">
                {icon}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-xs">{label}</div>
                <div className="text-[10px] text-slate-400">.xlsx • {data.length} records</div>
              </div>
              <Download size={13} className="ml-auto text-slate-400 group-hover:text-academic-600" />
            </button>
          ))}
        </div>
      </div>

      {/* ══ IMPORT SECTION ═══════════════════════════════════════ */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <Upload size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Bulk Data Import with Validation Preview</h2>
            <p className="text-xs text-slate-500">
              Upload .xlsx / .csv files. Validate, preview errors, and choose Skip / Update before committing.
            </p>
          </div>
        </div>

        {importStage === 'idle' && (
          <div className="space-y-4">
            {/* Import Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Import Type:</span>
              {[
                { id: 'faculty', label: 'Faculty Roster', icon: <Users size={13} /> },
                { id: 'courses', label: 'Course Catalog', icon: <BookOpen size={13} /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setImportType(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    importType === t.id
                      ? 'bg-academic-600 text-white border-academic-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}

              <button
                onClick={downloadTemplate}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                <Download size={13} />
                <span>Download Template</span>
              </button>
            </div>

            {/* Required Columns Info */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-xs">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900">Required columns for {importType === 'faculty' ? 'Faculty' : 'Course'} import: </span>
                <span className="text-blue-800">
                  {importType === 'faculty'
                    ? '"Faculty Name", "Code", "Designation", "Programme", "Employment Type", "Eligibility", "Max Hours", "Min Hours", "Specialization"'
                    : '"Course Code", "Title", "Programme", "Semester", "Credits" (format: N(T,L)), "Required Expertise"'}
                </span>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-academic-500 bg-academic-50 scale-[1.01]'
                  : 'border-slate-300 hover:border-academic-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-slate-100">
                  <FileSpreadsheet size={32} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">
                    {isDragOver ? 'Drop file here' : 'Drag & drop your Excel or CSV file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports <strong>.xlsx</strong> and <strong>.csv</strong> formats
                  </p>
                </div>
                <span className="px-4 py-2 rounded-xl bg-academic-600 text-white font-semibold text-xs shadow-sm">
                  Browse Files
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {importStage === 'preview' && previewRows.length > 0 && (
          <ImportPreviewTable
            rows={previewRows}
            importType={importType}
            onConfirm={handleConfirmImport}
            onCancel={handleReset}
          />
        )}

        {importStage === 'done' && importResult && (
          <div className="text-center py-10 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import Successful</h3>
              <p className="text-sm text-slate-600 mt-1">
                <strong className="text-emerald-700">{importResult.valid}</strong> new records imported,{' '}
                <strong className="text-amber-600">{importResult.updated}</strong> existing records updated,{' '}
                <strong className="text-slate-500">{importResult.skipped}</strong> rows skipped.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <RefreshCw size={14} />
              <span>Import Another File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

