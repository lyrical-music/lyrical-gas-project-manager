function writeSupabaseDataToSheet() {
  // Supabaseからデータを取得
  const data = getCommentDataFromSupabase();

  // 取得結果がない場合の処理
  if (!data) {
    Logger.log('No data retrieved from Supabase.');
    return;
  }

  // SpreadsheetAppで対象のスプレッドシートとシートを取得
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const commentSheet = ss.getSheetByName('comment');
  if (!commentSheet) {
    throw new Error('Sheet "comment" not found.');
  }

  // シートの既存の内容をクリア
  commentSheet.clearContents();

  // データが空の場合の処理
  if (data.length === 0) {
    commentSheet.getRange(1, 1).setValue('No data available.');
    return;
  }

  // ヘッダー行を作成（最初のオブジェクトのキーを利用）
  const headers = Object.keys(data[0]);
  // ヘッダーを1行目に出力
  commentSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // データ行を作成（各オブジェクトの値をヘッダーの順番に並べる）
  const rows = data.map((item: any) => headers.map(header => item[header]));
  // 2行目以降にデータを出力
  commentSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  Logger.log('Data successfully written to the "comment" sheet.');
}

function getCommentDataFromSupabase() {
  // 環境変数からSupabaseのURLとAPIキーを取得
  const supabaseUrl = getEnvProperty('SUPABASE_URL');
  const supabaseApiKey = getEnvProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (typeof supabaseApiKey !== 'string') {
    throw new Error('Supabase API key is missing');
  }

  const tableName = 'comment'; // 対象のテーブル名
  const limit = 1000; // 1回のリクエストで取得する件数
  let offset = 0;
  let allData: any[] = [];
  let totalRecords = Infinity; // 最初は全体件数が不明なのでInfinityに設定

  while (offset < totalRecords) {
    // APIエンドポイントの作成（全カラム取得）
    const url = supabaseUrl + '/rest/v1/' + tableName + '?select=*';
    // Range ヘッダーで取得範囲を指定（例: "0-999", "1000-1999", ...）
    const rangeHeader = offset + '-' + (offset + limit - 1);

    // APIリクエストのオプション設定
    const options = {
      method: 'get' as GoogleAppsScript.URL_Fetch.HttpMethod,
      headers: {
        'apikey': supabaseApiKey,
        'Authorization': 'Bearer ' + supabaseApiKey,
        'Content-Type': 'application/json',
        'Range': rangeHeader,
        'Prefer': 'count=exact', // レスポンスに正確な全件数を含めてもらう
      },
      muteHttpExceptions: true, // HTTPエラーでもレスポンスを取得する
    };

    try {
      // UrlFetchAppを使ってSupabase REST APIにリクエスト送信
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();

      if (statusCode < 200 || statusCode >= 300) {
        Logger.log('Error (' + statusCode + '): ' + response.getContentText());
        break;
      }

      // レスポンスヘッダーからContent-Rangeを取得して全体件数を把握
      const headers = response.getAllHeaders() as { [key: string]: string };
      const contentRange = headers['Content-Range'] || headers['content-range'];
      if (contentRange) {
        // 例: "0-999/2345" の形式なので、"/"以降の数字が全体件数
        const totalMatch = contentRange.match(/\/(\d+)$/);
        if (totalMatch && totalMatch[1]) {
          totalRecords = parseInt(totalMatch[1], 10);
        }
      }

      // レスポンスボディからデータを取得
      const data = JSON.parse(response.getContentText());
      allData = allData.concat(data);
      offset += data.length;

      Logger.log(
        'Fetched ' + data.length + ' records. Total so far: ' + allData.length
      );

      // もし取得件数がリクエストした件数より少なければ、全件取得完了と判断
      if (data.length < limit) {
        break;
      }
    } catch (e) {
      Logger.log('Exception: ' + e);
      break;
    }
  }

  Logger.log('Total records fetched: ' + allData.length);
  return allData;
}
