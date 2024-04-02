Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

async function read() {
  var News = Parse.Object.extend("aiasoNews");
  var query = new Parse.Query(News);
  // query.equalTo("name", textName);
  query.descending("publishDate");
  // query.first().then(function (pet) {
  var snap = await query.find().catch(function (error) {
    console.log("Error: " + error.code + " " + error.message);
  })
  const obj = snap.map(data => data.toJSON());
  // console.table(obj)
  return obj;

}