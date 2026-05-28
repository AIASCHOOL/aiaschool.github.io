Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

async function read(page = 1, limit = 10) {
  var News = Parse.Object.extend("aiasoNews");
  var query = new Parse.Query(News);
  query.descending("publishDate");
  
  // 计算跳过的记录数
  var skip = (page - 1) * limit;
  query.skip(skip);
  query.limit(limit);
  
  var snap = await query.find().catch(function (error) {
    console.log("Error: " + error.code + " " + error.message);
  })
  const obj = snap.map(data => data.toJSON());
  return obj;
}

async function getTotalCount() {
  var News = Parse.Object.extend("aiasoNews");
  var query = new Parse.Query(News);
  var count = await query.count().catch(function (error) {
    console.log("Error: " + error.code + " " + error.message);
    return 0;
  });
  return count;
}