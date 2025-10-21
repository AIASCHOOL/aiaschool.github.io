const groupParamsByKey = (params) => [...params.entries()].reduce((acc, tuple) => {
  // getting the key and value from each tuple
  const [key, val] = tuple;
  if (Object.prototype.hasOwnProperty.call(acc, key)) {
    // if the current key is already an array, we'll add the value to it
    if (Array.isArray(acc[key])) {
      acc[key] = [...acc[key], val]
    } else {
      // if it's not an array, but contains a value, we'll convert it into an array
      // and add the current value to it
      acc[key] = [acc[key], val];
    }
  } else {
    // plain assignment if no special case is present
    acc[key] = val;
  }

  return acc;
}, {});

const toggleBtn = document.getElementById('toggle');
const collapseMenu = document.getElementById('collapseMenu');

function handleClick() {
  if (collapseMenu.style.display === 'block') {
    collapseMenu.style.display = 'none';
  } else {
    collapseMenu.style.display = 'block';
  }
}

toggleBtn.addEventListener('click', handleClick);


/**
 * See https://stackoverflow.com/a/24004942/11784757
 */
const debounce = (func, wait, immediate = true) => {
  let timeout
  return (...args) => {
    const context = this
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }, wait)
    if (callNow) func.apply(context, args)
  }
}

/**
 * Append the child element and wait for the parent's
 * dimensions to be recalculated
 * See https://stackoverflow.com/a/66172042/11784757
 */
const appendChildAwaitLayout = (parent, element) => {
  return new Promise((resolve, _) => {
    const resizeObserver = new ResizeObserver((entries, observer) => {
      observer.disconnect()
      resolve(entries)
    })
    resizeObserver.observe(element)
    parent.appendChild(element)
  })
}

// Swiper轮播图相关功能
const swiperInstances = new Map();

// 图片加载处理函数
function handleImageLoad(img) {
  // 图片加载成功，初始化或更新Swiper
  const swiperContainer = img.closest('.swiper-container');
  if (swiperContainer) {
    const swiperId = swiperContainer.className.match(/swiper-(\w+)/);
    if (swiperId) {
      const instanceId = swiperId[1];
      
      // 如果Swiper还没有初始化，则初始化它
      if (!swiperInstances.has(instanceId)) {
        setTimeout(() => {
          const swiper = new Swiper(swiperContainer, {
            loop: true,
            autoplay: {
              delay: 3000,
              disableOnInteraction: false,
            },
            pagination: {
              el: swiperContainer.querySelector('.swiper-pagination'),
              clickable: true,
            },
            navigation: {
              nextEl: swiperContainer.querySelector('.swiper-button-next'),
              prevEl: swiperContainer.querySelector('.swiper-button-prev'),
            },
            on: {
              imagesReady: function() {
                this.update();
              }
            }
          });
          swiperInstances.set(instanceId, swiper);
        }, 100);
      } else {
        // 如果Swiper已经初始化，更新它
        const swiper = swiperInstances.get(instanceId);
        if (swiper) {
          swiper.update();
        }
      }
    }
  }
}

function handleImageError(img) {
  // 图片加载失败，显示占位符
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
  img.alt = '图片加载失败';
}

// URL参数相关函数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function updateUrlParameter(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

// 分页相关函数
function generatePagination(currentPage, totalPages, language) {
  if (totalPages <= 1) return;
  
  let paginationHtml = '<div class="pagination-container">';
  paginationHtml += '<div class="flex justify-center items-center space-x-2 mt-6 mb-4">';
  
  // 前のページボタン
  if (currentPage > 1) {
    paginationHtml += `<button onclick="goToPage(${currentPage - 1}, '${language}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">前のページ</button>`;
  }
  
  // ページ番号ボタン
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    paginationHtml += `<button onclick="goToPage(1, '${language}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">1</button>`;
    if (startPage > 2) {
      paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    const activeClass = isActive ? 'bg-yellow-500 text-white border-yellow-500' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50';
    paginationHtml += `<button onclick="goToPage(${i}, '${language}')" class="px-3 py-2 text-sm font-medium border rounded-md ${activeClass}">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
    }
    paginationHtml += `<button onclick="goToPage(${totalPages}, '${language}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${totalPages}</button>`;
  }
  
  // 次のページボタン
  if (currentPage < totalPages) {
    paginationHtml += `<button onclick="goToPage(${currentPage + 1}, '${language}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">次のページ</button>`;
  }
  
  paginationHtml += '</div>';
  
  // ページ情報を追加
  paginationHtml += `<div class="text-center text-sm text-gray-500 mb-4">${currentPage}ページ / 総${totalPages}ページ</div>`;
  paginationHtml += '</div>';
  
  $("#news").after(paginationHtml);
}

function goToPage(page, language = 'zh-CN') {
  updateUrlParameter('page', page);
  start(language); // データを再読み込み
}

// Google翻译相关函数
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'jp' }, 'google_translate_element');
}

function hideGoogleTranslateBar() {
  const element = document.querySelector("#\\:1\\.container");
  if (element) {
    element.style.visibility = "hidden";
  }
}

function translateTo(language) {
  const selectField = document.querySelector("select.goog-te-combo");
  if (selectField) {
    selectField.value = language;
    selectField.dispatchEvent(new Event('change'));
    setTimeout(hideGoogleTranslateBar, 100);
  }
}

// 等待元素出现函数
function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// 主要的数据加载和显示函数
const start = async (language = 'zh-CN') => {
  // URLから現在のページ番号を取得、デフォルトは1
  const currentPage = Number.parseInt(getUrlParameter('page')) || 1;
  const limit = 10;
  
  // 総データ数と現在のページデータを取得
  const [totalCount, news] = await Promise.all([
    getTotalCount(),
    read(currentPage, limit)
  ]);
  
  // 総ページ数を計算
  const totalPages = Math.ceil(totalCount / limit);
  
  // 固定状態別ソート：固定された項目が前に、その次に日付別ソート
  news.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.publishDate) - new Date(a.publishDate);
  });
  
  // 既存の内容を削除
  $("#news").empty();
  
  // 前のページネーション要素を削除
  $(".pagination-container").remove();
  
  // 清理旧的Swiper实例
  if (window.swiperInstances) {
    for (const swiper of window.swiperInstances) {
      if (swiper && typeof swiper.destroy === 'function') {
        swiper.destroy(true, true);
      }
    }
    window.swiperInstances.clear();
  }
  
  for (const item of news) {
    let images = "";//
    if (item.images?.length) {
      if (item.images.length === 1) {
        // 单张图片 - 添加lightbox功能
        for (const img of item.images) {
          images += `<a href="${img}" data-lightbox="news-${item.objectId}" data-title="${item.title}">`;
          images += `<img src="${img}" class="w-full cursor-pointer hover:opacity-90 transition-opacity" alt="${item.title}" />`;
          images += '</a>';
        }
      } else {
        // 多张图片 - Swiper轮播 + lightbox功能
        let carouselImg = ''
        for (const [i, img] of item.images.entries()) {
          carouselImg += '<div class="swiper-slide">';
          carouselImg += `<a href="${img}" data-lightbox="news-${item.objectId}" data-title="${item.title}">`;
          carouselImg += `<img src="${img}" class="w-full h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" alt="${item.title}" loading="lazy" onload="handleImageLoad(this)" onerror="handleImageError(this)" />`;
          carouselImg += '</a>';
          carouselImg += '</div>';
        }

        images = `<div class="swiper-container swiper-${item.objectId}" style="height: 240px;">
           <div class="swiper-wrapper">${carouselImg}</div>
           <div class="swiper-button-next swiper-button-white"></div>
           <div class="swiper-button-prev swiper-button-white"></div>
           <div class="swiper-pagination"></div>
         </div>`;
      }
    }

    const pinnedClass = item.pinned ? 'ring-2 ring-yellow-400' : '';
    const pinnedBadge = item.pinned ? '<div class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">📌 </div>' : '';

    $("#news").append(`<div id="newsid-${item.objectId}" class="w-full lg:w-4/5 xl:w-2/3 mx-auto bg-[#F0B55E] p-2 mt-1 mb-2 sm:mb-1 relative ${pinnedClass}">
    ${pinnedBadge}
    <div class= "grid sm:grid-cols-6 gap-3" >
      <div class="sm:col-span-2">${images}</div>
      <div class="sm:col-span-4">
        <div class="grid grid-flow-col gap-0 mb-2">
          <div class="bg-[#7F7F7F] text-white col-span-1 text-center p-1 notranslate">PICK UP</div>
          <div class="bg-white col-span-5 p-1 italic">${item.title}</div>
        </div>
        <div class="bg-[#7F7F7F] bg-opacity-50 text-white p-2 text-sm news-content">${item.context}
          <div class="text-black text-right mt-2">${item.publishDate}</div>
        </div>
      </div>
    </div>
  </div> `)
  }
  
  // ページネーションナビゲーションを生成
  generatePagination(currentPage, totalPages, language);
  
  setTimeout(() => {
    translateTo(language);
  }, "1000");
};

// 将函数和变量暴露到全局作用域，供HTML中的onload和onerror事件使用
window.handleImageLoad = handleImageLoad;
window.handleImageError = handleImageError;
window.swiperInstances = swiperInstances;
window.getUrlParameter = getUrlParameter;
window.updateUrlParameter = updateUrlParameter;
window.generatePagination = generatePagination;
window.goToPage = goToPage;
window.googleTranslateElementInit = googleTranslateElementInit;
window.hideGoogleTranslateBar = hideGoogleTranslateBar;
window.translateTo = translateTo;
window.waitForElm = waitForElm;
window.start = start;

document.addEventListener('alpine:init', () => {
  Alpine.data(
    'Marquee',
    ({ speed = 1, spaceX = 0, dynamicWidthElements = false }) => ({
      dynamicWidthElements,
      async init() {
        if (this.dynamicWidthElements) {
          const images = this.$el.querySelectorAll('img')
          // If there are any images, make sure they are loaded before
          // we start cloning them, since their width might be dynamically
          // calculated
          if (images) {
            await Promise.all(
              Array.from(images).map(image => {
                return new Promise((resolve, _) => {
                  if (image.complete) {
                    resolve()
                  } else {
                    image.addEventListener('load', () => {
                      resolve()
                    })
                  }
                })
              })
            )
          }
        }

        // Store the original element so we can restore it on screen resize later
        this.originalElement = this.$el.cloneNode(true)
        const originalWidth = this.$el.scrollWidth + spaceX * 4
        // Required for the marquee scroll animation 
        // to loop smoothly without jumping 
        this.$el.style.setProperty('--marquee-width', `${originalWidth}px`)
        this.$el.style.setProperty(
          '--marquee-time',
          `${((1 / speed) * originalWidth) / 100}s`
        )
        this.resize()
        // Make sure the resize function can only be called once every 100ms
        // Not strictly necessary but stops lag when resizing window a bit
        window.addEventListener('resize', debounce(this.resize.bind(this), 100))
      },
      async resize() {
        // Reset to original number of elements
        this.$el.innerHTML = this.originalElement.innerHTML

        // Keep cloning elements until marquee starts to overflow
        let i = 0
        while (this.$el.scrollWidth <= this.$el.clientWidth) {
          if (this.dynamicWidthElements) {
            // If we don't give this.$el time to recalculate its dimensions
            // when adding child nodes, the scrollWidth and clientWidth won't
            // change, thus resulting in this while loop looping forever
            await appendChildAwaitLayout(
              this.$el,
              this.originalElement.children[i].cloneNode(true)
            )
          } else {
            this.$el.appendChild(
              this.originalElement.children[i].cloneNode(true)
            )
          }
          i += 1
          i = i % this.originalElement.childElementCount
        }

        // Add another (original element count) of clones so the animation
        // has enough elements off-screen to scroll into view
        let j = 0
        while (j < this.originalElement.childElementCount) {
          this.$el.appendChild(this.originalElement.children[i].cloneNode(true))
          j += 1
          i += 1
          i = i % this.originalElement.childElementCount
        }
      },
    })
  )
})
