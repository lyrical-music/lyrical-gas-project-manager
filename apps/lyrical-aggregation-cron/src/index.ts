function fetchEndpoint(endpoint: string): boolean {
  try {
    const response = UrlFetchApp.fetch(`https://www.lyricalmusic.jp${endpoint}`);
    const result = JSON.parse(response.getContentText());
    return result.success;
  } catch (error) {
    return false;
  }
}

function main() {
  const endpoints = [
    '/api/ga4/fetch',
    '/api/aggregation/artist-views',
    '/api/aggregation/likes'
  ];
  
  endpoints.forEach(endpoint => {
    const success = fetchEndpoint(endpoint);
    console.log(`${endpoint}: ${success ? '成功' : '失敗'}`);
  });
}

main();
