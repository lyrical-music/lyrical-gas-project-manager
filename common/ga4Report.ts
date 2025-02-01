
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const AnalyticsData: any;

function createRunReportRequest(config: any) {
  const request = AnalyticsData.newRunReportRequest();

  // メトリクスを設定
  if (config.metrics && Array.isArray(config.metrics)) {
    request.metrics = config.metrics.map((metricConfig: any) => {
      const metric = AnalyticsData.newMetric();
      Object.assign(metric, metricConfig); // すべてのプロパティをコピー
      return metric;
    });
  }

  // ディメンションを設定
  if (config.dimensions && Array.isArray(config.dimensions)) {
    request.dimensions = config.dimensions.map((dimensionConfig: any) => {
      const dimension = AnalyticsData.newDimension();
      Object.assign(dimension, dimensionConfig);
      return dimension;
    });
  }

  // 日付範囲を設定
  if (config.dateRanges && Array.isArray(config.dateRanges)) {
    request.dateRanges = config.dateRanges.map((dateRangeConfig: any) => {
      const dateRange = AnalyticsData.newDateRange();
      Object.assign(dateRange, dateRangeConfig);
      return dateRange;
    });
  }

  // フィルター（ディメンション & メトリクス）
  if (config.dimensionFilter) {
    request.dimensionFilter = createFilterExpression(config.dimensionFilter);
  }
  if (config.metricFilter) {
    request.metricFilter = createFilterExpression(config.metricFilter);
  }

  // オフセットとリミット
  if (config.offset) {
    request.offset = config.offset;
  }
  if (config.limit) {
    request.limit = config.limit;
  }

  // メトリック集計
  if (config.metricAggregations && Array.isArray(config.metricAggregations)) {
    request.metricAggregations = [...config.metricAggregations];
  }

  // ソート順（orderBys）
  if (config.orderBys && Array.isArray(config.orderBys)) {
    request.orderBys = config.orderBys.map((orderConfig: any) => {
      const order = AnalyticsData.newOrderBy();
      Object.assign(order, orderConfig);
      return order;
    });
  }

  // 通貨コード
  if (config.currencyCode) {
    request.currencyCode = config.currencyCode;
  }

  // コホート分析設定
  if (config.cohortSpec) {
    request.cohortSpec = AnalyticsData.newCohortSpec();
    Object.assign(request.cohortSpec, config.cohortSpec);
  }

  // 空の行を保持するか
  if (typeof config.keepEmptyRows === 'boolean') {
    request.keepEmptyRows = config.keepEmptyRows;
  }

  // プロパティのクォータを返すか
  if (typeof config.returnPropertyQuota === 'boolean') {
    request.returnPropertyQuota = config.returnPropertyQuota;
  }

  // 比較設定
  if (config.comparisons && Array.isArray(config.comparisons)) {
    request.comparisons = config.comparisons.map((comparisonConfig: any) => {
      const comparison = AnalyticsData.newComparison();
      Object.assign(comparison, comparisonConfig);
      return comparison;
    });
  }

  return request;
}

// フィルターを作成するヘルパー関数
function createFilterExpression(filterConfig: any) {
  const filterExpression = AnalyticsData.newFilterExpression();

  if (filterConfig.filter) {
    filterExpression.filter = AnalyticsData.newFilter();
    Object.assign(filterExpression.filter, filterConfig.filter);
  }

  if (filterConfig.orGroup) {
    filterExpression.orGroup = AnalyticsData.newFilterExpressionList();
    filterExpression.orGroup.expressions = filterConfig.orGroup.expressions.map(
      createFilterExpression
    );
  }

  if (filterConfig.andGroup) {
    filterExpression.andGroup = AnalyticsData.newFilterExpressionList();
    filterExpression.andGroup.expressions =
      filterConfig.andGroup.expressions.map(createFilterExpression);
  }

  if (filterConfig.notExpression) {
    filterExpression.notExpression = createFilterExpression(
      filterConfig.notExpression
    );
  }

  return filterExpression;
}
