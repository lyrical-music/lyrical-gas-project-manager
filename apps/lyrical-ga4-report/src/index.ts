/* eslint-disable @typescript-eslint/no-unused-vars */

function runGA4DataForDateRange() {
  const startDate = new Date();
  const endDate = new Date();

  // --- 「comment」シートからコメントID（1列目） を取得 ---
  const commentSheet = getSheetByName('comment');
  const commentValues = commentSheet.getRange('A2:A').getValues();
  const commentIds = commentValues.map(row => {
    return row[0];
  });

  // --- 日付のループ（呼び出し側で処理） ---
  let currentDate = startDate;
  const commentIdsChunked = chunkArray(commentIds, 100);
  while (currentDate <= endDate) {
    const formatedDate = Utilities.formatDate(currentDate, 'JST', 'yyyy-MM-dd');
    // コメントIDを100個ずつ取得してGA4データを取得
    commentIdsChunked.forEach((ids) => {
      getGA4DataForCommentsForDate(formatedDate, ids);
    });

    // 翌日に進む
    currentDate.setDate(currentDate.getDate() + 1);
  }

  Logger.log('GA4 data retrieval complete for date range.');
}

function getGA4DataForCommentsForDate(
  targetDate: string,
  commentIds: string[]
) {
  if (!commentIds || commentIds.length === 0) {
    throw new Error('Comment IDs are required.');
  }

  const commentViewEventSheet = getSheetByName('comment_view_event');
  const filters = commentIds.map((commentID) => {
    return {
      filter: {
        fieldName: 'customEvent:comment_id',
        stringFilter: {
          matchType: 'EXACT',
          value: commentID,
        },
      },
    };
  });

  const config = {
    dimensions: [{ name: 'customEvent:comment_id' }],
    metrics: [{ name: 'eventCount' }],
    dateRanges: [{ startDate: targetDate, endDate: targetDate }],
    dimensionFilter: {
      orGroup: {
        expressions: filters,
      },
    },
  };

  try {
    const response = AnalyticsData.Properties.runReport(
      createRunReportRequest(config),
      'properties/475784610'
    );

    const data: any[] = [];

    // データ行が存在する場合は出力
    response.rows.forEach((row: any) => {
      const commentID = row.dimensionValues[0].value;
      const eventCount = row.metricValues[0].value;

      if (!commentID || !eventCount) {
        return;
      }

      data.push([
        targetDate,
        commentID,
        eventCount,
      ]);
    });

    // データがある場合はシートに出力
    if (data.length > 0) {
      const range = commentViewEventSheet.getRange(
        commentViewEventSheet.getLastRow() + 1,
        1,
        data.length,
        data[0].length
      );
      range.setValues(data);
    }
  } catch (error) {
    Logger.log('Error for date: ' + targetDate + ' - ' + error);
  }
}

function chunkArray(array: any[], chunkSize: number) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize));
  }
  return chunkedArray;
}
