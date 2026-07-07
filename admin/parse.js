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

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'image/heic', 'image/heif',
]);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif)$/i;

function isHeicFile(file) {
  return /\.(heic|heif)$/i.test(file.name) ||
    file.type === 'image/heic' || file.type === 'image/heif';
}

function isAllowedImage(file) {
  if (ALLOWED_TYPES.has(file.type)) return true;
  return ALLOWED_EXTENSIONS.test(file.name);
}

function validateImageFile(file) {
  if (!file) throw new Error('ファイルが選択されていません');
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('ファイルサイズは8MB以下にしてください（現在: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB）');
  }
  if (!isAllowedImage(file)) {
    throw new Error('対応形式：JPG、PNG、GIF、WebP、HEIC');
  }
}

const getDimensions = (image) => {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('画像のサイズ取得に失敗しました'));
    img.src = image;
  });
};

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
});

async function convertHeicToJpeg(file) {
  if (typeof heic2any === 'undefined') {
    throw new Error('HEIC変換ライブラリの読み込みに失敗しました。ページを再読み込みしてください');
  }
  try {
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const name = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([jpegBlob], name, { type: 'image/jpeg' });
  } catch (err) {
    throw new Error('HEIC画像の変換に失敗しました。設定で「互換性優先」にするか、JPG形式でお試しください');
  }
}

async function convertToJpegViaCanvas(file) {
  const dataUrl = await toBase64(file);
  const dim = await getDimensions(dataUrl);
  const jpegFile = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('画像の変換に失敗しました'));
        const name = file.name.replace(/\.[^.]+$/, '.jpg');
        resolve(new File([blob], name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = dataUrl;
  });
  if (jpegFile.size > MAX_IMAGE_SIZE) {
    throw new Error('変換後のファイルが8MBを超えています。より小さい画像をお試しください');
  }
  return { file: jpegFile, dim };
}

async function prepareImageFile(file) {
  validateImageFile(file);

  if (isHeicFile(file)) {
    const jpegFile = await convertHeicToJpeg(file);
    if (jpegFile.size > MAX_IMAGE_SIZE) {
      throw new Error('変換後のファイルが8MBを超えています。より小さい画像をお試しください');
    }
    const base64 = await toBase64(jpegFile);
    const dim = await getDimensions(base64);
    return { file: jpegFile, dim, base64 };
  }

  if (file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/i.test(file.name)) {
    const base64 = await toBase64(file);
    const dim = await getDimensions(base64);
    return { file, dim, base64 };
  }

  return convertToJpegViaCanvas(file);
}

const saveImg = async (file) => {
  const { file: uploadFile, dim, base64 } = await prepareImageFile(file);
  const parseFile = new Parse.File('1' + uploadFile.name, { base64 }, 'image/jpeg');
  const theFile = await parseFile.save();
  if (!theFile) throw new Error('画像のアップロードに失敗しました');
  return { theFile, dim };
};

Parse.Images = async (file) => {
  const { theFile, dim } = await saveImg(file);
  const classDb = Parse.Object.extend("aiasoImages");
  const newDoc = new classDb();
  newDoc.set('image', theFile);
  newDoc.set('imageDim', dim);
  const doc = await newDoc.save();
  return doc.toJSON();
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
    data.id = id;
    str = '保存';
  }
  data.set("title", obj.title);
  data.set("context", obj.context);
  data.set("images", obj.images || []);
  data.set("publishDate", obj.publishDate);
  data.set("pinned", pinned);

  data.save().then(function (savedData) {
    toggleModal('modal-id')
    alert(str + "成功");
    location.reload();
  }).catch(function (error) {
    alert('保存に失敗しました: ' + error.message);
    console.error('Error:', error);
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