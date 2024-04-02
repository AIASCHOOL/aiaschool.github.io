Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

// const imageFileResizer = async (file, maxX, maxY) => {
//   return new Promise((resolve, reject) => {
//     Resizer.imageFileResizer(
//       file,
//       maxX,
//       maxY,
//       'JPEG',
//       75,
//       0,
//       async uri => {
//         // console.log(uri)
//         resolve(uri);
//       },
//       'base64',
//     );
//   });
// };

const getDimensions = (image) => {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.src = image;
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
  })
}

// async function getBase64(file) {
//   var reader = new FileReader();
//   reader.readAsDataURL(file);
//   reader.onload = function () {
//     console.log(reader.result);
//   };
//   reader.onerror = function (error) {
//     console.log('Error: ', error);
//   };
// }
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

const saveImg = async (file, id = '') => {
  // const base64 = await imageFileResizer(file, maxX, maxY);
  const base64 = await toBase64(file);

  const dim = await getDimensions(base64)
  const parseFile = new Parse.File(id + (file.name), { base64 }, 'image/jpg',);
  const theFile = await parseFile.save().catch(err => console.error(err));
  return { theFile, dim };
};

Parse.Images = async (file) => {
  // var data = saveImg(file);
  // console.log(data)

  // return;
  // console.log(dbName, docId, imgName, thumbName)
  // console.log(file);
  // const { theFile: theFile0, dim: dim0 } = await saveImg(file, '0', 10000, 10000);
  const { theFile: theFile1, dim: dim1 } = await saveImg(file, '1');
  // const { theFile: theFile2, dim: dim2 } = await saveImg(file, '2', 640, 360);
  // console.log(theFile1, theFile2)
  const classDb = Parse.Object.extend("aiasoImages");
  const newDoc = new classDb();
  // newDoc.set('img1File0', theFile0);
  // newDoc.set('img1File0Dim', dim0);
  newDoc.set('image', theFile1);
  newDoc.set('image' + 'Dim', dim1);
  // newDoc.set('thumb', theFile2);
  // newDoc.set('thumb' + 'Dim', dim2);
  const doc = await newDoc.save();

  // return { doc, theFile1 };
  return doc.toJSON()
};

//////

function createNews() {
  var obj = $('form').getForm2obj()
  // obj.context = $('#editor').html()
  obj.context = quill.getSemanticHTML();
  console.log(obj);
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
    //  console.log('Pet created successful with name: ' + pet.get("name") + ' and age: ' + pet.get("agePet"));
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
  // if (pet) {
  //   console.log('Pet found successful with name: ' + pet.get("name") + ' and age: ' + pet.get("agePet"));
  // } else {
  //   console.log("Nothing found, please try again");
  // }
  // console.log(snap)
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

  // alert('消去成功');
  $("#newsid-" + objectId).remove();
}