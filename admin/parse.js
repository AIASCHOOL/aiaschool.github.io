Parse.initialize('myappID', 'infowin');
Parse.serverURL = 'https://parse3.infowin.com.tw/parse';

// 兼容 admin 使用：将 URLSearchParams 展平成对象（支持同名键变数组）
function groupParamsByKey(params) {
  return [...params.entries()].reduce((acc, tuple) => {
    const [key, val] = tuple;
    if (Object.prototype.hasOwnProperty.call(acc, key)) {
      if (Array.isArray(acc[key])) {
        acc[key] = [...acc[key], val]
      } else {
        acc[key] = [acc[key], val];
      }
    } else {
      acc[key] = val;
    }
    return acc;
  }, {});
}

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
  const classDb = Parse.Object.extend("aiasoImages");
  const newDoc = new classDb();
  newDoc.set('image', theFile1);
  newDoc.set('image' + 'Dim', dim1);
  const doc = await newDoc.save();

  return doc.toJSON()
};

function createNews() {
  var id = $("#modal-confirm").data('id');
  var str = '追加'

  var obj = $('form').getForm2obj()
  obj.context = quill.getSemanticHTML();
  
  // 获取PIN状态
  var pinned = $("#input-pinned").is(':checked');
  
  if (!obj.context) {
    alert("コンテンツなし");
    return;
  }
  var News = Parse.Object.extend("aiasoNews");
  var data = new News();

  if (id !== 'new') {
    data.set("id", id);
    str = '保存';
  }
  data.set("title", obj.title);
  data.set("context", obj.context);
  data.set("images", obj.images);
  data.set("publishDate", obj.publishDate);
  data.set("pinned", pinned); // 添加PIN字段

  data.save().then(function (savedData) {
    toggleModal('modal-id')
    alert(str + "成功");
    location.reload();
  }).catch(function (error) {
    console.log('Error: ' + error.message);
  });
}

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

async function del(objectId) {
  if (!confirm("このまま削除しますか")) {
    return;
  }

  const classDb = Parse.Object.extend("aiasoNews");
  const delObj = new classDb();
  delObj.id = objectId;
  await delObj.destroy().catch(err => console.error(err));

  $("#newsid-" + objectId).remove();
}

// 注册 Alpine.js Marquee 组件
document.addEventListener('alpine:init', () => {
  Alpine.data('Marquee', ({ speed = 1, spaceX = 0, dynamicWidthElements = false }) => ({
    dynamicWidthElements,
    init() {
      // 简单的滚动动画实现
      this.$el.style.setProperty('animation', `marquee ${60 / speed}s linear infinite`);
      // CSS动画定义
      if (!document.getElementById('marquee-style')) {
        const style = document.createElement('style');
        style.id = 'marquee-style';
        style.textContent = `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          .marquee li {
            display: inline-block;
            padding-right: 1rem;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }));
});