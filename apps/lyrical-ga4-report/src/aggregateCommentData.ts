interface AggregatedCounts {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
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

  const aggregated: { [key: string]: AggregatedCounts } = {};

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
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
      };
    }

    // 集計範囲に応じて加算
    // （差分 <= 1日以内ならdaily, <=7ならweekly, <=30ならmonthly, <=365ならyearly）
    if (diffDays <= 1) {
      aggregated[commentId].daily += eventCount;
    }
    if (diffDays <= 7) {
      aggregated[commentId].weekly += eventCount;
    }
    if (diffDays <= 30) {
      aggregated[commentId].monthly += eventCount;
    }
    if (diffDays <= 365) {
      aggregated[commentId].yearly += eventCount;
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
      counts.daily.toString(),
      counts.weekly.toString(),
      counts.monthly.toString(),
      counts.yearly.toString(),
    ]);
  }

  // ---------- シートに書き込む ----------
  outputSheet
    .getRange(1, 1, outputValues.length, outputValues[0].length)
    .setValues(outputValues);
}

function getDiffInDays(baseDate: Date, targetDate: Date) {
  // getTime()でミリ秒差を取得し、日数に変換
  const diffMs = Math.abs(baseDate.getTime() - targetDate.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
