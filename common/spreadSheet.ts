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
