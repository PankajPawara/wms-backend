const XLSX = require('xlsx');
const AppError = require('./error.util');

// Normalize column header to lowercase snake_case
const normalizeHeader = (header) =>
  String(header).trim().toLowerCase().replace(/\s+/g, '_');

/**
 * Parse an inventory Excel file.
 * Required columns: part_no, barcode, location
 * Optional: description
 * Returns array of validated row objects.
 */
const parseInventoryExcel = (filePath) => {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch {
    throw new AppError('Cannot read uploaded file. Make sure it is a valid .xlsx or .xls file.', 422, 'INVENTORY_IMPORT_FAILED');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new AppError('The Excel file is empty or has no data rows.', 422, 'INVENTORY_IMPORT_FAILED');
  }

  // Normalize headers on first row to detect columns
  const normalizedRows = rawRows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      normalized[normalizeHeader(key)] = String(row[key]).trim();
    });
    return normalized;
  });

  // Check required columns
  const firstRow = normalizedRows[0];
  const requiredCols = ['part_no', 'barcode', 'location'];
  // Also accept common aliases
  const aliases = {
    part_no: ['part_no', 'partno', 'part_number', 'partnumber', 'part_no.', 'item_no', 'itemno'],
    barcode: ['barcode', 'bar_code', 'barcode_no', 'ean', 'upc'],
    location: ['location', 'loc', 'loc.', 'rack', 'rack_location', 'shelf'],
    description: ['description', 'desc', 'product_name', 'name', 'item_name', 'part_name'],
  };

  // Map actual column names from the file
  const colMap = {};
  Object.keys(aliases).forEach((field) => {
    const found = aliases[field].find((alias) => Object.prototype.hasOwnProperty.call(firstRow, alias));
    if (found) colMap[field] = found;
  });

  requiredCols.forEach((col) => {
    if (!colMap[col]) {
      throw new AppError(
        `Missing required column: "${col}". File must have columns: part_no, barcode, location.`,
        422,
        'INVENTORY_IMPORT_FAILED'
      );
    }
  });

  // Parse and validate rows
  const products = [];
  const errors = [];
  const seenPartNos = new Set();
  const seenBarcodes = new Set();

  normalizedRows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header row + 1-based
    const partNo = row[colMap['part_no']];
    const barcode = row[colMap['barcode']];
    const location = row[colMap['location']];
    const description = colMap['description'] ? row[colMap['description']] : '';

    if (!partNo) { errors.push(`Row ${rowNum}: part_no is empty`); return; }
    if (!barcode) { errors.push(`Row ${rowNum}: barcode is empty`); return; }
    if (!location) { errors.push(`Row ${rowNum}: location is empty`); return; }

    if (seenPartNos.has(partNo)) {
      errors.push(`Row ${rowNum}: Duplicate part_no "${partNo}" in file`);
      return;
    }
    if (seenBarcodes.has(barcode)) {
      errors.push(`Row ${rowNum}: Duplicate barcode "${barcode}" in file`);
      return;
    }

    seenPartNos.add(partNo);
    seenBarcodes.add(barcode);

    products.push({ part_no: partNo, barcode, location, description });
  });

  if (errors.length > 0) {
    const err = new AppError('Import validation failed. Fix the listed errors and re-upload.', 422, 'INVENTORY_IMPORT_FAILED');
    err.validationErrors = errors;
    throw err;
  }

  return products;
};

module.exports = { parseInventoryExcel };
