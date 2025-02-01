/* eslint-disable @typescript-eslint/no-unused-vars */

function getData() {
  const config = {
    dimensions: [
      {
        name: 'customEvent:comment_id',
      },
    ],
    metrics: [
      {
        name: 'eventCount',
      },
    ],
    dateRanges: [
      {
        startDate: '2024-01-01',
        endDate: 'today',
      },
    ],
    dimensionFilter: {
      orGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:comment_id',
              stringFilter: {
                matchType: 'EXACT',
                value: '0294c34c-60b6-4211-a931-401ad4f2d240',
              },
            },
          },
        ],
      },
    },
    limit: '100',
  };

  // APIリクエスト
  const response = AnalyticsData.Properties.runReport(
    createRunReportRequest(config),
    'properties/475784610'
  );

  const testSheet = getSheetByName('test');

  // レスポンスをシートに出力
  testSheet.clear();

  testSheet.appendRow([
    ...response.dimensionHeaders.map((header: any) => header.name),
    ...response.metricHeaders.map((header: any) => header.name),
  ]);
  const data: any = [];
  response.rows.forEach((row: any, i: number) => {
    const rowData = [
      ...row.dimensionValues.map((dimensionValue: any) => dimensionValue.value),
      ...row.metricValues.map((metricValue: any) => metricValue.value),
    ];

    data.push(rowData);
  });

  testSheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}
