function fetchEndpoint(endpoint: string): boolean {
  try {
    const response = UrlFetchApp.fetch(`https://www.lyricalmusic.jp${endpoint}`);
    return response.getResponseCode() == 200;
  } catch (error) {
    return false;
  }
}

function main() {
  const endpoints = [
    '/api/aggregation/likes',
    '/api/aggregation/comment',
    '/api/aggregation/track',
    '/api/aggregation/artist',
  ];
  
  endpoints.forEach(endpoint => {
    const success = fetchEndpoint(endpoint);
    console.log(`${endpoint}: ${success ? '成功' : '失敗'}`);
  });
}
