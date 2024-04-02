Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

const getDimensions = (image) => {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.src = image;
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
  })
}

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

const saveImg = async (file, id = '') => {
  const base64 = await toBase64(file);

  const dim = await getDimensions(base64)
  const parseFile = new Parse.File(id + (file.name), { base64 }, 'image/jpg',);
  const theFile = await parseFile.save().catch(err => console.error(err));
  return { theFile, dim };
};

Parse.Images = async (file) => {
  const { theFile: theFile1, dim: dim1 } = await saveImg(file, '1');
  // console.log(theFile1, theFile2)
  const newDoc = new classDb();
  newDoc.set('image', theFile1);
  newDoc.set('image' + 'Dim', dim1);
  const doc = await newDoc.save();

  return doc.toJSON()
};

function createNews() {
  var obj = $('form').getForm2obj()
  obj.context = quill.getSemanticHTML();
  // console.log(obj);
  if (!obj.context) {
    alert("コンテンツなし");
    return;
  }
  var News = Parse.Object.extend("aiasoNews");
  var data = new News();
  data.set("title", obj.title);
  data.set("context", obj.context);
  data.set("images", obj.images);
  data.set("publishDate", obj.publishDate);

  data.save().then(function (data) {
    toggleModal('modal-id')
    alert("追加成功");
    location.reload();
  }).catch(function (error) {
    console.log('Error: ' + error.message);
  });
}

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

async function del(objectId) {
  if (!confirm("消去確認？")) {
    return;
  }

  const classDb = Parse.Object.extend("aiasoNews");
  const delObj = new classDb();
  delObj.id = objectId;
  await delObj.destroy().catch(err => console.error(err));

  $("#newsid-" + objectId).remove();
}