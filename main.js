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
        const originalWidth = this.$el.scrollWidth + spaceX * 4
        // Required for the marquee scroll animation 
        // to loop smoothly without jumping 
        this.$el.style.setProperty('--marquee-width', originalWidth + 'px')
        this.$el.style.setProperty(
          '--marquee-time',
          ((1 / speed) * originalWidth) / 100 + 's'
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

const start = async function () {
  // 从URL获取当前页码，默认为1
  const currentPage = parseInt(getUrlParameter('page')) || 1;
  const limit = 10;
  
  // 获取总数据量和当前页数据
  const [totalCount, news] = await Promise.all([
    getTotalCount(),
    read(currentPage, limit)
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
    if (item.images && item.images.length) {
      if (item.images.length === 1) {
        // 单张图片 - 添加lightbox功能
        item.images.forEach(img => {
          images += '<a href="' + img + '" data-lightbox="news-' + item.objectId + '" data-title="' + item.title + '">';
          images += '<img src="' + img + '" class="w-full cursor-pointer hover:opacity-90 transition-opacity" alt="' + item.title + '" />';
          images += '</a>';
        });
      } else {
        // 多张图片 - 轮播 + lightbox功能
        var carouselImg = ''
        item.images.forEach((img, i) => {
          carouselImg += '<div id="carousel-item-' + item.objectId + i + '" class="hidden duration-700 ease-in-out" data-carousel-item>';
          carouselImg += '<a href="' + img + '" data-lightbox="news-' + item.objectId + '" data-title="' + item.title + '">';
          carouselImg += '<img src="' + img + '" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 cursor-pointer hover:opacity-90 transition-opacity" alt="' + item.title + '" />';
          carouselImg += '</a>';
          carouselImg += '</div>';
        });

        images = '<div id="carousel-' + item.objectId + '" class="relative w-full " data-carousel="slide">\
           <div class="relative h-60 overflow-hidden rounded-lg md:h-60">'+ carouselImg + '</div>\
      <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>\
        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">\
          <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true"\
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">\
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4" />\
          </svg>\
          <span class="sr-only">Previous</span>\
        </span>\
      </button>\
      <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>\
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

    $("#news").append('<div id="newsid-' + item.objectId + '" class="w-full lg:w-4/5 xl:w-2/3 mx-auto bg-[#F0B55E] p-2 mt-1 mb-2 sm:mb-1 relative ' + pinnedClass + '">\
    ' + pinnedBadge + '\
    <div class= "grid sm:grid-cols-6 gap-3" >\
      <div class="sm:col-span-2">'+ images + '</div>\
      <div class="sm:col-span-4">\
        <div class="grid grid-flow-col gap-0 mb-2">\
          <div class="bg-[#7F7F7F] text-white col-span-1 text-center p-1 notranslate">PICK UP</div>\
          <div class="bg-white col-span-5 p-1 italic">'+ item.title + '</div>\
        </div>\
        <div class="bg-[#7F7F7F] bg-opacity-50 text-white p-2 text-sm news-content">'+ item.context + '\
          <div class="text-black text-right mt-2">'+ item.publishDate + '</div>\
        </div>\
      </div>\
    </div>\
  </div> ')
  });
  
  // 生成分页导航
  generatePagination(currentPage, totalPages);
}

// 生成分页导航
function generatePagination(currentPage, totalPages) {
  if (totalPages <= 1) return;
  
  let paginationHtml = '<div class="pagination-container">';
  paginationHtml += '<div class="flex justify-center items-center space-x-2 mt-6 mb-4">';
  
  // 上一页按钮
  if (currentPage > 1) {
    paginationHtml += `<button onclick="goToPage(${currentPage - 1})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">前のページ</button>`;
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
    paginationHtml += `<button onclick="goToPage(${currentPage + 1})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">次のページ</button>`;
  }
  
  paginationHtml += '</div>';
  
  // 添加页面信息
  paginationHtml += `<div class="text-center text-sm text-gray-500 mb-4">${currentPage}ページ目 / 全${totalPages}ページ</div>`;
  paginationHtml += '</div>';
  
  $("#news").after(paginationHtml);
}

// 跳转到指定页面
function goToPage(page) {
  updateUrlParameter('page', page);
  start(); // 重新加载数据
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', function() {
  start();
});