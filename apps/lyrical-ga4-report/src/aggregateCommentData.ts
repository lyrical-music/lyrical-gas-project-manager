type AggregatedCounts = {
  daily_count: number;
  weekly_count: number;
  monthly_count: number;
  yearly_count: number;
}

type AggregatedCountObject = {
  [key: string]: AggregatedCounts;
}

type CommentAggregation = AggregatedCounts & {
  comment_id: string;
}

function aggregateCommentData() {
  const inputSheet = getSheetByName('comment_view_event');
  let outputSheet = getSheetByName('comment_view_event_mart');
  outputSheet.clearContents();

  // ---------- 基準日の決定（前日） ----------
  // 実行日の前日 0時0分0秒 を基準点とする
  const now = new Date(); // 今日(スクリプト実行時刻)
  const yesterday = new Date(now); // 前日
  yesterday.setDate(now.getDate() - 1); // 前日にする
  yesterday.setHours(0, 0, 0, 0);

  // ---------- 入力データの取得 ----------
  // データ: [ [date, comment_id, eventCount], ... ] の2次元配列
  const dataValues = inputSheet.getDataRange().getValues();
  dataValues.shift(); // ヘッダー行を削除

  const aggregated: AggregatedCountObject = {};

  // ---------- 日数差を求めるヘルパー関数 ----------

  // ---------- データをループして集計 ----------
  for (let i = 1; i < dataValues.length; i++) {
    const row = dataValues[i];
    if (row.length < 3) continue; // データ不備行はスキップ

    const eventDate = row[0];
    const commentId = row[1];
    const eventCount = Number(row[2]) || 0;

    // 差分日数
    const diffDays = getDiffInDays(yesterday, eventDate);

    // まだaggregatedにcommentIdが無ければ初期化
    if (!aggregated[commentId]) {
      aggregated[commentId] = {
        daily_count: 0,
        weekly_count: 0,
        monthly_count: 0,
        yearly_count: 0,
      };
    }

    // 集計範囲に応じて加算
    // （差分 <= 1日以内ならdaily, <=7ならweekly, <=30ならmonthly, <=365ならyearly）
    if (diffDays <= 1) {
      aggregated[commentId].daily_count += eventCount;
    }
    if (diffDays <= 7) {
      aggregated[commentId].weekly_count += eventCount;
    }
    if (diffDays <= 30) {
      aggregated[commentId].monthly_count += eventCount;
    }
    if (diffDays <= 365) {
      aggregated[commentId].yearly_count += eventCount;
    }
  }

  // ---------- 出力データを配列化 ----------
  // 見出し行
  const outputValues = [
    [
      'comment_id',
      'dailyEventCount',
      'weeklyEventCount',
      'monthlyEventCount',
      'yearlyEventCount',
    ],
  ];
  // aggregatedオブジェクトから行を作る
  for (const [commentId, counts] of Object.entries(aggregated)) {
    outputValues.push([
      commentId,
      counts.daily_count.toString(),
      counts.weekly_count.toString(),
      counts.monthly_count.toString(),
      counts.yearly_count.toString(),
    ]);
  }

  // ---------- シートに書き込む ----------
  outputSheet
    .getRange(1, 1, outputValues.length, outputValues[0].length)
    .setValues(outputValues);

  // ---------- SupabaseにデータをUPSERT ----------
  const convertedRecords = Object.entries(aggregated).map(
    ([commentId, record]) => {
      return {
        comment_id: commentId,
        daily_count: record.daily_count,
        weekly_count: record.weekly_count,
        monthly_count: record.monthly_count,
        yearly_count: record.yearly_count,
      };
    }
  );
  // 1000件ずつに分割してリクエストを送信
  const chunkSize = 1000;
  for (let i = 0; i < convertedRecords.length; i += chunkSize) {
    const chunk = convertedRecords.slice(i, i + chunkSize);
    upsertDataToSupabase(chunk);
  }
}

function upsertDataToSupabase(records: CommentAggregation[]) {
  // 環境変数からSupabaseのURLとAPIキーを取得
  const supabaseUrl = getEnvProperty('SUPABASE_URL');
  const supabaseApiKey = getEnvProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (typeof supabaseApiKey !== 'string') {
    throw new Error('Supabase API key is missing');
  }

  const tableName = 'comment_aggregation'; // 対象のテーブル名
  const conflictColumn = 'comment_id'; // UPSERT時の競合解決カラム

  // テーブルに対するエンドポイントURL
  // on_conflictに指定したカラムをもとにUPSERTが行われる
  const url = `${supabaseUrl}/rest/v1/${tableName}?on_conflict=${conflictColumn}`;

  // HTTPリクエストオプション
  const options = {
    method: 'post' as GoogleAppsScript.URL_Fetch.HttpMethod,
    headers: {
      'apikey': supabaseApiKey,
      'Authorization': 'Bearer ' + supabaseApiKey,
      'Content-Type': 'application/json',
      // Upsert(merge)を行う際に必要
      'Prefer': 'resolution=merge-duplicates',
    },
    // 送信データをJSON文字列にする
    payload: JSON.stringify(records),
    muteHttpExceptions: true, // HTTPエラーでもレスポンスを取得する
  };

  try {
    // リクエスト送信
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (statusCode >= 200 && statusCode < 300) {
      Logger.log('Upsertに成功しました。');
      Logger.log('レスポンス: ' + responseBody);
    } else {
      Logger.log(`Upsertに失敗しました。ステータスコード: ${statusCode}`);
      Logger.log('レスポンス: ' + responseBody);
    }
  } catch (error) {
    Logger.log('エラーが発生しました: ' + error);
  }
}

function getDiffInDays(baseDate: Date, targetDate: Date) {
  // getTime()でミリ秒差を取得し、日数に変換
  const diffMs = Math.abs(baseDate.getTime() - targetDate.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
