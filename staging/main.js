const groupParamsByKey = (params) => [...params.entries()].reduce((acc, tuple) => {
  // getting the key and value from each tuple
  const [key, val] = tuple;
  if (acc.hasOwnProperty(key)) {
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

var toggleBtn = document.getElementById('toggle');
var collapseMenu = document.getElementById('collapseMenu');

function handleClick() {
  if (collapseMenu.style.display === 'block') {
    collapseMenu.style.display = 'none';
  } else {
    collapseMenu.style.display = 'block';
  }
}

toggleBtn.addEventListener('click', handleClick);

// Swiper 輪播圖相關（供各語系 index 的圖片 onload 使用）
const swiperInstances = new Map();

function handleImageLoad(img) {
  const swiperContainer = img.closest('.swiper-container');
  if (swiperContainer) {
    const swiperId = swiperContainer.className.match(/swiper-(\w+)/);
    if (swiperId) {
      const instanceId = swiperId[1];
      if (!swiperInstances.has(instanceId)) {
        setTimeout(() => {
          if (typeof Swiper === 'undefined') return;
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
        const swiper = swiperInstances.get(instanceId);
        if (swiper) swiper.update();
      }
    }
  }
}

function handleImageError(img) {
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
  img.alt = '图片加载失败';
}

function initializeNewsCarousels(root = document) {
  root.querySelectorAll('[data-news-carousel]').forEach((carousel) => {
    if (carousel.dataset.newsCarouselReady === 'true') return;

    const items = Array.from(carousel.querySelectorAll('[data-news-carousel-item]'));
    if (items.length === 0) return;

    let activeIndex = Math.max(0, items.findIndex((item) => item.dataset.newsCarouselItem === 'active'));

    const render = () => {
      items.forEach((item, index) => {
        item.classList.toggle('hidden', index !== activeIndex);
        item.classList.toggle('block', index === activeIndex);
        item.dataset.newsCarouselItem = index === activeIndex ? 'active' : '';
      });
    };

    carousel.querySelectorAll('[data-news-carousel-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        render();
      });
    });

    carousel.querySelectorAll('[data-news-carousel-next]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = (activeIndex + 1) % items.length;
        render();
      });
    });

    carousel.dataset.newsCarouselReady = 'true';
    render();
  });
}

window.handleImageLoad = handleImageLoad;
window.handleImageError = handleImageError;
window.initializeNewsCarousels = initializeNewsCarousels;

/**
 * See https://stackoverflow.com/a/24004942/11784757
 */
const debounce = (func, wait, immediate = true) => {
  let timeout
  return (...args) => {
    const context = this
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(function () {
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
        this.resize()
        // Make sure the resize function can only be called once every 100ms
        // Not strictly necessary but stops lag when resizing window a bit
        window.addEventListener('resize', debounce(this.resize.bind(this), 100))
      },
      async resize() {
        if (!this.originalElement || this.originalElement.childElementCount === 0) return

        // Reset to original number of elements
        this.$el.innerHTML = this.originalElement.innerHTML

        const originalWidth = this.$el.scrollWidth + spaceX * 4
        const elementWidth = this.$el.clientWidth

        if (originalWidth === 0 || elementWidth === 0) return

        // Required for the marquee scroll animation
        // to loop smoothly without jumping
        this.$el.style.setProperty('--marquee-width', originalWidth + 'px')
        this.$el.style.setProperty(
          '--marquee-time',
          ((1 / speed) * originalWidth) / 100 + 's'
        )

        // Keep cloning elements until marquee starts to overflow
        let i = 0
        let cloneCount = 0
        const maxCloneCount = this.originalElement.childElementCount * 20
        while (this.$el.scrollWidth <= this.$el.clientWidth) {
          if (cloneCount >= maxCloneCount) break

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
          cloneCount += 1
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

// Alpine.start()

// News management functions
// 获取URL参数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 更新URL参数
function updateUrlParameter(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

function getNewsLocale(language) {
  return language || window.AIASCHOOL_LOCALE || document.documentElement.lang || 'ja';
}

function getNewsText(key) {
  const labels = window.AIASCHOOL_NEWS_I18N || {};
  const fallback = {
    pickUp: 'PICK UP',
    previous: '前のページ',
    next: '次のページ',
    pageInfo: '{current}ページ / 総{total}ページ'
  };
  return labels[key] || fallback[key] || '';
}

function formatNewsPageInfo(currentPage, totalPages) {
  return getNewsText('pageInfo')
    .replace('{current}', currentPage)
    .replace('{total}', totalPages);
}

function localizedNewsField(item, field, locale) {
  const normalized = locale === 'ja' ? 'ja' : locale;
  const candidates = [
    `${field}_${normalized}`,
    `${field}${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`,
    `${field}_${normalized.replace('-', '_')}`,
    `${field}_${normalized.toLowerCase()}`
  ];

  for (const key of candidates) {
    if (item[key]) return item[key];
  }

  return item[field] || '';
}

function hideGoogleTranslateBar() {
  const element = document.querySelector("#\\:1\\.container");
  if (element) {
    element.style.visibility = "hidden";
  }
}

function translateTo(language, attempts = 20) {
  if (!language || language === 'ja') return;

  const selectField = document.querySelector("select.goog-te-combo");
  const hasTargetOption = selectField && Array.from(selectField.options).some((option) => option.value === language);
  if (selectField && hasTargetOption) {
    selectField.value = language;
    selectField.dispatchEvent(new Event('change'));
    setTimeout(hideGoogleTranslateBar, 100);
    return;
  }

  if (attempts > 0) {
    setTimeout(() => {
      translateTo(language, attempts - 1);
    }, 500);
  }
}

window.translateTo = translateTo;

const hasPageNewsStart = typeof start === 'function'
const startNewsList = async function (language) {
  const locale = getNewsLocale(language);
  if (
    !document.getElementById('news') ||
    typeof window.$ !== 'function' ||
    typeof window.getTotalCount !== 'function' ||
    typeof window.read !== 'function'
  ) {
    return;
  }

  // 从URL获取当前页码，默认为1
  const currentPage = parseInt(getUrlParameter('page')) || 1;
  const limit = 10;
  
  // 获取总数据量和当前页数据
  const [totalCount, news] = await Promise.all([
    window.getTotalCount(),
    window.read(currentPage, limit)
  ]);
  
  // 计算总页数
  const totalPages = Math.ceil(totalCount / limit);
  
  // 按钉选状态排序：钉选的在前面，然后按日期排序
  news.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.publishDate) - new Date(a.publishDate);
  });
  
  // 清空现有内容
  $("#news").empty();
  
  // 清除之前的分页元素
  $(".pagination-container").remove();
  
  news.forEach(item => {
    var images = "";//
    const itemTitle = localizedNewsField(item, 'title', locale);
    const itemContext = localizedNewsField(item, 'context', locale);

    if (item.images && item.images.length) {
      if (item.images.length === 1) {
        // 单张图片 - 添加lightbox功能
        item.images.forEach(img => {
          images += '<a href="' + img + '" data-lightbox="news-' + item.objectId + '" data-title="' + itemTitle + '">';
          images += '<img src="' + img + '" class="w-full cursor-pointer hover:opacity-90 transition-opacity" alt="' + itemTitle + '" />';
          images += '</a>';
        });
      } else {
        // 多张图片 - 轮播 + lightbox功能
        var carouselImg = ''
        item.images.forEach((img, i) => {
          carouselImg += '<div id="carousel-item-' + item.objectId + i + '" class="hidden duration-700 ease-in-out" data-news-carousel-item="' + (i === 0 ? 'active' : '') + '">';
          carouselImg += '<a href="' + img + '" data-lightbox="news-' + item.objectId + '" data-title="' + itemTitle + '">';
          carouselImg += '<img src="' + img + '" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 cursor-pointer hover:opacity-90 transition-opacity" alt="' + itemTitle + '" />';
          carouselImg += '</a>';
          carouselImg += '</div>';
        });

        images = '<div id="carousel-' + item.objectId + '" class="relative w-full " data-news-carousel>\
           <div class="relative h-60 overflow-hidden rounded-lg md:h-60">'+ carouselImg + '</div>\
      <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-news-carousel-prev>\
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">\
          <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true"\
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">\
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4" />\
          </svg>\
          <span class="sr-only">Previous</span>\
        </span>\
      </button>\
      <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-news-carousel-next>\
        <span\
          class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">\
          <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true"\
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">\
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"\
              d="m1 9 4-4-4-4" />\
          </svg>\
          <span class="sr-only">Next</span>\
        </span>\
      </button>\
     </div>';
      }
    }

    var pinnedClass = item.pinned ? 'ring-2 ring-yellow-400' : '';
    var pinnedBadge = item.pinned ? '<div class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">📌 </div>' : '';
    var imageColumn = images ? '<div class="sm:col-span-2">' + images + '</div>' : '';
    var textColumnClass = images ? 'sm:col-span-4' : 'sm:col-span-6';

    $("#news").append('<div id="newsid-' + item.objectId + '" class="w-full lg:w-4/5 xl:w-2/3 mx-auto bg-[#F0B55E] p-2 mt-1 mb-2 sm:mb-1 relative ' + pinnedClass + '">\
    ' + pinnedBadge + '\
    <div class= "grid sm:grid-cols-6 gap-3" >\
      ' + imageColumn + '\
      <div class="' + textColumnClass + '">\
        <div class="grid grid-flow-col gap-0 mb-2">\
          <div class="bg-[#7F7F7F] text-white col-span-1 text-center p-1">'+ getNewsText('pickUp') + '</div>\
          <div class="bg-white col-span-5 p-1 italic">'+ itemTitle + '</div>\
        </div>\
        <div class="bg-[#7F7F7F] bg-opacity-50 text-white p-2 text-sm news-content">'+ itemContext + '\
          <div class="text-black text-right mt-2">'+ item.publishDate + '</div>\
        </div>\
      </div>\
    </div>\
  </div> ')
  });

  initializeNewsCarousels(document.getElementById('news'));
  
  // 生成分页导航
  generatePagination(currentPage, totalPages, locale);

  setTimeout(() => {
    translateTo(locale);
  }, 1000);
}

// 生成分页导航
function generatePagination(currentPage, totalPages, locale) {
  if (totalPages <= 1) return;
  
  let paginationHtml = '<div class="pagination-container">';
  paginationHtml += '<div class="flex justify-center items-center space-x-2 mt-6 mb-4">';
  
  // 上一页按钮
  if (currentPage > 1) {
    paginationHtml += `<button onclick="goToPage(${currentPage - 1}, '${locale}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${getNewsText('previous')}</button>`;
  }
  
  // 页码按钮
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    paginationHtml += `<button onclick="goToPage(1)" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">1</button>`;
    if (startPage > 2) {
      paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    const activeClass = isActive ? 'bg-yellow-500 text-white border-yellow-500' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50';
    paginationHtml += `<button onclick="goToPage(${i})" class="px-3 py-2 text-sm font-medium border rounded-md ${activeClass}">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
    }
    paginationHtml += `<button onclick="goToPage(${totalPages})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${totalPages}</button>`;
  }
  
  // 下一页按钮
  if (currentPage < totalPages) {
    paginationHtml += `<button onclick="goToPage(${currentPage + 1}, '${locale}')" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${getNewsText('next')}</button>`;
  }
  
  paginationHtml += '</div>';
  
  // 添加页面信息
  paginationHtml += `<div class="text-center text-sm text-gray-500 mb-4">${formatNewsPageInfo(currentPage, totalPages)}</div>`;
  paginationHtml += '</div>';
  
  $("#news").after(paginationHtml);
}

// 跳转到指定页面
const goToSharedNewsPage = function(page, language) {
  updateUrlParameter('page', page);
  startNewsList(language); // 重新加载数据
}

if (!hasPageNewsStart && typeof window.start !== 'function') {
  window.start = startNewsList;
}

if (typeof window.goToPage !== 'function') {
  window.goToPage = goToSharedNewsPage;
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', function() {
  if (!hasPageNewsStart) {
    startNewsList();
  }
});

// 语言菜单延迟关闭功能
let languageMenuTimeout;

// 显示语言菜单
function showLanguageMenu() {
  const languageDropdown = document.getElementById('languageDropdown');
  if (languageDropdown) {
    clearTimeout(languageMenuTimeout);
    languageDropdown.classList.remove('hidden');
    languageDropdown.classList.add('block');
  }
}

// 隐藏语言菜单（带延迟）
function hideLanguageMenu() {
  const languageDropdown = document.getElementById('languageDropdown');
  if (languageDropdown) {
    languageMenuTimeout = setTimeout(() => {
      languageDropdown.classList.remove('block');
      languageDropdown.classList.add('hidden');
    }, 300); // 300毫秒延迟
  }
}

// 初始化语言菜单功能
function initLanguageMenu() {
  const languageMenu = document.getElementById('languageMenu');
  const languageDropdown = document.getElementById('languageDropdown');

  if (languageMenu && languageDropdown) {
    languageMenu.addEventListener('mouseenter', showLanguageMenu);
    languageMenu.addEventListener('mouseleave', hideLanguageMenu);
    languageDropdown.addEventListener('mouseenter', showLanguageMenu);
    languageDropdown.addEventListener('mouseleave', hideLanguageMenu);
  }
}

window.showLanguageMenu = showLanguageMenu;
window.hideLanguageMenu = hideLanguageMenu;
window.initLanguageMenu = initLanguageMenu;
