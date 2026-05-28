Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

async function read(page = 1, limit = 10) {
  var News = Parse.Object.extend("aiasoNews");
  var query = new Parse.Query(News);
  // query.equalTo("name", textName);
  query.descending("publishDate");
  
  // 添加分页
  const skip = (page - 1) * limit;
  query.skip(skip);
  query.limit(limit);
  
  // query.first().then(function (pet) {
  var snap = await query.find().catch(function (error) {
    console.log("Error: " + error.code + " " + error.message);
  })
  const obj = snap.map(data => data.toJSON());
  // console.table(obj)
  return obj;
}

// 获取总数据量
async function getTotalCount() {
  var News = Parse.Object.extend("aiasoNews");
  var query = new Parse.Query(News);
  query.descending("publishDate");
  
  const count = await query.count().catch(function (error) {
    console.log("Error: " + error.code + " " + error.message);
    return 0;
  });
  
  return count;
}