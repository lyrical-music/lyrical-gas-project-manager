/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

function getSheetByName(sheetName: string, sheetId?: string) {
  // スプレッドシート ID が指定されていなければ、アクティブなスプレッドシートを使用
  const spreadsheet = sheetId
    ? SpreadsheetApp.openById(sheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('スプレッドシートが見つかりません');
  }

  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`シート "${sheetName}" が見つかりません`);
  }

  return sheet;
}

function setFormula(sheetName: string, cellAddress: string, formula: string) {
  const sheet = getSheetByName(sheetName); // 毎回読み取るのは効率が悪いが、そんなに関数書き込むこともないので許容する
  const cell = sheet.getRange(cellAddress);
  cell.setFormula(formula);
}

// if you want to get 'A', pass 1
function getColumnLetter(columnIndex: number) {
  let columnLetter = '';

  while (columnIndex > 0) {
    const remainder = (columnIndex - 1) % 26;
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
    columnIndex = Math.floor((columnIndex - 1) / 26);
  }

  return columnLetter;
}
