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
  // Parse as array of arrays
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length === 0) {
    throw new AppError('The Excel file is empty or has no data rows.', 422, 'INVENTORY_IMPORT_FAILED');
  }

  const firstRow = rawRows[0].map((c) => String(c).trim());
  const headerText = firstRow.join(' ').toLowerCase();
  
  // Auto-detect if first row is a header
  const isHeader = headerText.includes('part') || headerText.includes('barcode') || headerText.includes('loc');

  let colMap = {};
  let dataRows = [];
  let rowOffset = 1;

  if (isHeader) {
    const requiredCols = ['part_no', 'barcode', 'location'];
    const aliases = {
      part_no: ['part_no', 'partno', 'part_number', 'partnumber', 'part_no.', 'item_no', 'itemno'],
      barcode: ['barcode', 'bar_code', 'barcode_no', 'ean', 'upc'],
      location: ['location', 'loc', 'loc.', 'rack', 'rack_location', 'shelf'],
      description: ['description', 'desc', 'product_name', 'name', 'item_name', 'part_name'],
      price: ['price', 'selling_price', 'mrp', 'rate', 'unit_price', 'sellingprice'],
      stock: ['stock', 'qty', 'quantity', 'in_stock', 'instock', 'available_stock', 'balance'],
    };

    Object.keys(aliases).forEach((field) => {
      const idx = firstRow.findIndex((col) => {
        const normKey = normalizeHeader(col);
        return aliases[field].some((alias) => normalizeHeader(alias) === normKey);
      });
      if (idx !== -1) colMap[field] = idx;
    });

    requiredCols.forEach((col) => {
      if (colMap[col] === undefined) {
        throw new AppError(
          `Missing required column: "${col}". File must have columns: part_no, barcode, location.`,
          422,
          'INVENTORY_IMPORT_FAILED'
        );
      }
    });

    dataRows = rawRows.slice(1);
    rowOffset = 2; // +1 for 0-index, +1 for header row
  } else {
    // No header, assume fixed order: Part No, Barcode, Location
    colMap = {
      part_no: 0,
      barcode: 1,
      location: 2,
    };
    if (firstRow.length > 3) colMap.description = 3;
    if (firstRow.length > 4) colMap.price = 4;
    if (firstRow.length > 5) colMap.stock = 5;

    dataRows = rawRows;
    rowOffset = 1;
  }

  const errors = [];
  const groupedByBarcode = {};

  dataRows.forEach((row, index) => {
    const rowNum = index + rowOffset;
    
    // Some rows might be shorter than the full column count
    const getVal = (idx) => idx !== undefined && idx < row.length ? String(row[idx]).trim() : '';

    const partNo = getVal(colMap['part_no']);
    const barcode = getVal(colMap['barcode']);
    let location = getVal(colMap['location']);
    const description = getVal(colMap['description']);
    const priceStr = getVal(colMap['price']);
    const stockStr = getVal(colMap['stock']);

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

    const key = barcode;
    if (!groupedByBarcode[key]) {
      groupedByBarcode[key] = [];
    }
    groupedByBarcode[key].push({
      rowNum,
      part_no: partNo,
      barcode: barcode,
      location: location,
      description: description,
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
