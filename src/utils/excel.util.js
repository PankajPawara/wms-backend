const XLSX = require('xlsx');
const AppError = require('./error.util');

// Normalize column header by lowercasing and removing spaces/punctuation
const normalizeHeader = (header) =>
  String(header).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

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

  // Normalize row keys to string values
  const normalizedRows = rawRows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      normalized[key] = String(row[key]).trim();
    });
    return normalized;
  });

  // Check required columns
  const firstRow = normalizedRows[0];
  const requiredCols = ['part_no', 'barcode', 'location'];
  const aliases = {
    part_no: ['part_no', 'partno', 'part_number', 'partnumber', 'part_no.', 'item_no', 'itemno'],
    barcode: ['barcode', 'bar_code', 'barcode_no', 'ean', 'upc'],
    location: ['location', 'loc', 'loc.', 'rack', 'rack_location', 'shelf'],
    description: ['description', 'desc', 'product_name', 'name', 'item_name', 'part_name'],
    price: ['price', 'selling_price', 'mrp', 'rate', 'unit_price', 'sellingprice'],
    stock: ['stock', 'qty', 'quantity', 'in_stock', 'instock', 'available_stock', 'balance'],
  };

  // Map actual column names from the file using normalized matches
  const colMap = {};
  Object.keys(aliases).forEach((field) => {
    const foundKey = Object.keys(firstRow).find((key) => {
      const normKey = normalizeHeader(key);
      return aliases[field].some((alias) => normalizeHeader(alias) === normKey);
    });
    if (foundKey) colMap[field] = foundKey;
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

  const errors = [];
  const groupedByBarcode = {};

  normalizedRows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header row + 1-based index
    const partNo = row[colMap['part_no']] || '';
    const barcode = row[colMap['barcode']] || '';
    let location = row[colMap['location']] || '';
    const description = colMap['description'] ? row[colMap['description']] : '';
    const priceStr = colMap['price'] ? row[colMap['price']] : '';
    const stockStr = colMap['stock'] ? row[colMap['stock']] : '';

    // Default missing locations to LOCATION NOT DEFINED
    if (!location) {
      location = 'LOCATION NOT DEFINED';
    }

    if (!partNo && !barcode) {
      // Skip completely empty lines
      return;
    }

    // Skip records containing hashes (e.g. ### overflow errors)
    if (partNo.includes('#') || barcode.includes('#') || location.includes('#')) {
      return;
    }

    if (!partNo) {
      errors.push(`Row ${rowNum}: part_no is empty`);
      return;
    }
    if (!barcode) {
      errors.push(`Row ${rowNum}: barcode is empty`);
      return;
    }

    const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0.0;
    const stock = parseInt(stockStr.replace(/[^0-9]/g, ''), 10) || 0;

    const key = barcode.trim();
    if (!groupedByBarcode[key]) {
      groupedByBarcode[key] = [];
    }
    groupedByBarcode[key].push({
      rowNum,
      part_no: partNo.trim(),
      barcode: barcode.trim(),
      location: location.trim(),
      description: description.trim(),
      price,
      stock,
    });
  });

  if (errors.length > 0) {
    const err = new AppError('Import validation failed.', 422, 'INVENTORY_IMPORT_FAILED');
    err.validationErrors = errors;
    throw err;
  }

  // Deduplicate and filter groups
  const products = [];
  const seenPartNoLocations = new Set();
  const seenBarcodeLocations = new Set();

  Object.keys(groupedByBarcode).forEach((barcodeKey) => {
    const group = groupedByBarcode[barcodeKey];

    // If duplicate barcode entries exist, filter out LOCATION NOT DEFINED records if a valid location exists
    const hasDefinedLocation = group.some((item) => item.location.toUpperCase() !== 'LOCATION NOT DEFINED');
    let filteredGroup = group;
    if (hasDefinedLocation) {
      filteredGroup = group.filter((item) => item.location.toUpperCase() !== 'LOCATION NOT DEFINED');
    }

    filteredGroup.forEach((item) => {
      const partLocKey = `${item.part_no.toUpperCase()}@${item.location.toUpperCase()}`;
      const barLocKey = `${item.barcode.toUpperCase()}@${item.location.toUpperCase()}`;

      // Prevent duplicating the exact same part or barcode at the same location
      if (!seenPartNoLocations.has(partLocKey) && !seenBarcodeLocations.has(barLocKey)) {
        seenPartNoLocations.add(partLocKey);
        seenBarcodeLocations.add(barLocKey);
        products.push({
          part_no: item.part_no,
          barcode: item.barcode,
          location: item.location,
          description: item.description,
          price: item.price,
          stock: item.stock,
        });
      }
    });
  });

  return products;
};

module.exports = { parseInventoryExcel };
