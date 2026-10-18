import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { getApiErrorDetail } from '@/lib/apiError';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Phase = 'files' | 'review' | 'done';

interface ValidateRow {
  row: number;
  name: string;
  status: 'ok' | 'error';
  errors: string[];
}

interface ValidateReport {
  rows: ValidateRow[];
  warnings: string[];
  total: number;
}

interface ImportReport {
  created: number;
  updated: number;
  errors: { row: number; name?: string; error: string }[];
  warnings?: string[];
}

export default function BulkImportModal({ onClose }: { onClose: () => void }) {
  useBodyScrollLock(true);
  const qc = useQueryClient();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('files');
  const [busy, setBusy] = useState<'validate' | 'import' | null>(null);
  const [report, setReport] = useState<ValidateReport | null>(null);
  const [result, setResult] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const errorCount = report?.rows.filter((r) => r.status === 'error').length ?? 0;

  function buildForm(): FormData {
    const fd = new FormData();
    fd.append('csv_file', csvFile as File);
    if (zipFile) fd.append('images_zip', zipFile);
    return fd;
  }

  function reset() {
    setPhase('files');
    setReport(null);
    setResult(null);
    setError(null);
    setCsvFile(null);
    setZipFile(null);
  }

  async function downloadTemplate() {
    try {
      const { data } = await api.get('/products/bulk-import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'products-import-template.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiErrorDetail(err, 'Could not download the template'));
    }
  }

  async function handleValidate() {
    if (!csvFile) {
      setError('Choose a product file first.');
      return;
    }
    setError(null);
    setBusy('validate');
    try {
      const { data } = await api.post<ValidateReport>('/products/bulk-import/validate', buildForm());
      setReport(data);
      setPhase('review');
    } catch (err) {
      setError(getApiErrorDetail(err, 'Validation failed'));
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    setError(null);
    setBusy('import');
    try {
      const { data } = await api.post<ImportReport>('/products/bulk-import', buildForm());
      setResult(data);
      setPhase('done');
      qc.invalidateQueries({ queryKey: ['products'] });
      if (data.errors.length === 0) {
        toast.success(`Imported: ${data.created} created, ${data.updated} updated`);
      } else {
        toast(`${data.created} created, ${data.updated} updated, ${data.errors.length} failed`);
      }
    } catch (err) {
      setError(getApiErrorDetail(err, 'Import failed'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/55 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-2xl bg-[#FAFAF8] shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bulk Import Products</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload an Excel (.xlsx) or CSV file to create or update many products at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {phase === 'files' && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Product file (Excel or CSV) *
                  </label>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xlsm"
                    className="hidden"
                    onChange={(e) => {
                      setCsvFile(e.target.files?.[0] ?? null);
                      setError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    className="w-full flex items-center justify-between gap-3 border border-dashed border-gray-300 rounded-xl px-4 py-3.5 hover:border-primary/60 hover:bg-primary/5 transition text-left"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FileText size={18} className="text-primary shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800 truncate">
                          {csvFile ? csvFile.name : 'Choose a .xlsx or .csv file'}
                        </span>
                        <span className="block text-[11px] text-gray-400">
                          {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Required · up to 50 rows · pictures go inside the xlsx'}
                        </span>
                      </span>
                    </span>
                    <Upload size={15} className="text-gray-400 shrink-0" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Images ZIP <span className="font-normal text-gray-400">(CSV only, optional)</span>
                  </label>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={(e) => {
                      setZipFile(e.target.files?.[0] ?? null);
                      setError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    className="w-full flex items-center justify-between gap-3 border border-dashed border-gray-300 rounded-xl px-4 py-3.5 hover:border-primary/60 hover:bg-primary/5 transition text-left"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FileText size={18} className="text-gray-400 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800 truncate">
                          {zipFile ? zipFile.name : 'Choose a ZIP of images'}
                        </span>
                        <span className="block text-[11px] text-gray-400">
                          {zipFile
                            ? `${(zipFile.size / 1024).toFixed(1)} KB`
                            : 'Not needed when pictures are embedded in the xlsx'}
                        </span>
                      </span>
                    </span>
                    <Upload size={15} className="text-gray-400 shrink-0" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Download size={13} /> Download Excel template
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 text-xs text-gray-500 space-y-1.5">
                <p className="font-semibold text-gray-700 text-xs">How it works</p>
                <p>· Required columns: <span className="font-medium text-gray-700">name, category, price</span>. Optional: original_price, stock_qty, description, badge, tags.</p>
                <p>· <span className="font-medium text-gray-700">Excel:</span> insert each product's photos into its PICTURE 1–5 cells (max 5, 5MB each, JPG/PNG/WEBP).</p>
                <p>· <span className="font-medium text-gray-700">CSV:</span> list image filenames (from the ZIP) or public http(s) URLs in the image_files column.</p>
                <p>· Separate multiple tags or image entries with <code className="bg-gray-100 px-1 rounded">|</code>.</p>
                <p>· A blank or unknown category puts a new product in <span className="font-medium text-gray-700">Uncategorized</span>; change it later from Products.</p>
                <p>· An existing product is matched by its name (case-insensitive); blank cells keep the current value.</p>
                <p>· Simple products only — products with variants are not supported by bulk import.</p>
              </div>
            </>
          )}

          {phase === 'review' && report && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <span className="text-gray-600">
                  <span className="font-bold text-gray-900">{report.total}</span> rows
                </span>
                <span className="text-green-700">
                  <span className="font-bold">{report.rows.length - errorCount}</span> ready
                </span>
                <span className={errorCount ? 'text-red-600' : 'text-gray-400'}>
                  <span className="font-bold">{errorCount}</span> with errors
                </span>
              </div>

              {report.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3 space-y-1">
                  {report.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 text-gray-500">
                      <tr className="text-left">
                        <th className="px-4 py-2.5 font-semibold w-14">Row</th>
                        <th className="px-4 py-2.5 font-semibold">Product</th>
                        <th className="px-4 py-2.5 font-semibold w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((r) => (
                        <tr key={r.row} className="border-t border-gray-100 align-top">
                          <td className="px-4 py-2.5 text-gray-400">{r.row}</td>
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-800">{r.name || '—'}</span>
                            {r.errors.map((e) => (
                              <p key={e} className="text-red-600 mt-0.5">{e}</p>
                            ))}
                          </td>
                          <td className="px-4 py-2.5">
                            {r.status === 'ok' ? (
                              <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                                <CheckCircle2 size={12} /> Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                <AlertTriangle size={12} /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                Embedded pictures are checked here. Image URLs are checked for format only —
                availability is verified during import, so a broken URL fails that row (and only that row).
              </p>
            </>
          )}

          {phase === 'done' && result && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-green-700">{result.created}</p>
                  <p className="text-[11px] font-semibold text-green-700/80 uppercase tracking-wide">Created</p>
                </div>
                <div className="bg-primary/5 rounded-xl py-4">
                  <p className="text-2xl font-bold text-primary">{result.updated}</p>
                  <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wide">Updated</p>
                </div>
                <div className={`rounded-xl py-4 ${result.errors.length ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${result.errors.length ? 'text-red-600' : 'text-gray-400'}`}>
                    {result.errors.length}
                  </p>
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${result.errors.length ? 'text-red-600/80' : 'text-gray-400'}`}>
                    Failed
                  </p>
                </div>
              </div>

              {(result.warnings?.length ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
                  {result.warnings!.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-xl overflow-hidden">
                  <div className="max-h-56 overflow-y-auto divide-y divide-red-100">
                    {result.errors.map((e) => (
                      <div key={e.row} className="px-4 py-2.5 text-xs">
                        <span className="font-semibold text-red-700">Row {e.row}</span>
                        {e.name ? <span className="text-gray-600"> · {e.name}</span> : null}
                        <p className="text-red-600 mt-0.5">{e.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t bg-white shrink-0 flex gap-3">
          {phase === 'files' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidate}
                disabled={busy !== null}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-60 transition inline-flex items-center justify-center gap-2"
              >
                {busy === 'validate' ? <Loader2 size={15} className="animate-spin" /> : null}
                {busy === 'validate' ? 'Validating...' : 'Validate file'}
              </button>
            </>
          )}

          {phase === 'review' && report && (
            <>
              <button
                type="button"
                onClick={reset}
                disabled={busy !== null}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={busy !== null || report.rows.length === 0 || errorCount === report.rows.length}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-60 transition inline-flex items-center justify-center gap-2"
              >
                {busy === 'import' ? <Loader2 size={15} className="animate-spin" /> : null}
                {busy === 'import'
                  ? 'Importing...'
                  : errorCount === report.rows.length
                  ? 'No importable rows'
                  : `Import ${report.rows.length - errorCount} row${report.rows.length - errorCount === 1 ? '' : 's'}`}
              </button>
            </>
          )}

          {phase === 'done' && (
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>
  );
}
