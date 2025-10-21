// 批量更新所有语言版本的PIN和分页功能
// 这个脚本展示了需要添加到每个语言版本的代码

const languageConfigs = {
  'cn': { translateTo: 'zh-CN', prevText: '上一页', nextText: '下一页', pageText: '第{current}页，共{total}页' },
  'tw': { translateTo: 'zh-TW', prevText: '上一頁', nextText: '下一頁', pageText: '第{current}頁，共{total}頁' },
  'ko': { translateTo: 'ko', prevText: '이전', nextText: '다음', pageText: '{current}페이지 / 총{total}페이지' },
  'vi': { translateTo: 'vi', prevText: 'Trang trước', nextText: 'Trang sau', pageText: 'Trang {current} / {total} trang' },
  'th': { translateTo: 'th', prevText: 'ก่อนหน้า', nextText: 'ถัดไป', pageText: 'หน้า {current} / {total} หน้า' },
  'id': { translateTo: 'id', prevText: 'Sebelumnya', nextText: 'Selanjutnya', pageText: 'Halaman {current} dari {total}' }
};

// 需要添加到每个语言版本的JavaScript代码模板
const getJavaScriptCode = (config) => `
  <script type="text/javascript">
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
        var images = "";
        if (item.images && item.images.length) {
          if (item.images.length === 1) {
            item.images.forEach(img => images += '<img src="' + img + '" class="w-full" />')
          } else {
            var carouselImg = ''
            item.images.forEach(img => carouselImg += '<div class="hidden duration-700 ease-in-out" data-carousel-item><img src="' + img + '" class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..."></div>')

            images = '<div id="default-carousel" class="relative w-full " data-carousel="slide">\\
              <div class="relative h-40 overflow-hidden rounded-lg md:h-40">'+ carouselImg + '</div>\\
          <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>\\
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">\\
              <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true"\\
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">\\
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4" />\\
              </svg>\\
              <span class="sr-only">Previous</span>\\
            </span>\\
          </button>\\
          <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>\\
            <span\\
              class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">\\
              <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true"\\
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">\\
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"\\
                  d="m1 9 4-4-4-4" />\\
              </svg>\\
              <span class="sr-only">Next</span>\\
            </span>\\
          </button>\\
        </div>'
          }
        }

        var pinnedClass = item.pinned ? 'ring-2 ring-yellow-400' : '';
        var pinnedBadge = item.pinned ? '<div class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">📌 </div>' : '';

        $("#news").append('<div id="newsid-' + item.objectId + '" class="w-full lg:w-4/5 xl:w-2/3 mx-auto bg-[#F0B55E] p-2 mt-1 mb-2 sm:mb-1 relative ' + pinnedClass + '">\\
        ' + pinnedBadge + '\\
        <div class= "grid sm:grid-cols-6 gap-3" >\\
          <div class="sm:col-span-2">'+ images + '</div>\\
          <div class="sm:col-span-4">\\
            <div class="grid grid-flow-col gap-0 mb-2">\\
              <div class="bg-[#7F7F7F] text-white col-span-1 text-center p-1 notranslate">PICK UP</div>\\
              <div class="bg-white col-span-5 p-1 italic">'+ item.title + '</div>\\
            </div>\\
            <div class="bg-[#7F7F7F] bg-opacity-50 text-white p-2 text-sm">'+ item.context + '\\
              <div class="text-black text-right mt-2">'+ item.publishDate + '</div>\\
            </div>\\
          </div>\\
        </div>\\
      </div> ')
      });
      
      // 生成分页导航
      generatePagination(currentPage, totalPages);
      
      setTimeout(() => {
        translateTo('${config.translateTo}');
      }, "1000");
    };

    // 生成分页导航
    function generatePagination(currentPage, totalPages) {
      if (totalPages <= 1) return;
      
      let paginationHtml = '<div class="pagination-container">';
      paginationHtml += '<div class="flex justify-center items-center space-x-2 mt-6 mb-4">';
      
      // 上一页按钮
      if (currentPage > 1) {
        paginationHtml += \`<button onclick="goToPage(\${currentPage - 1})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${config.prevText}</button>\`;
      }
      
      // 页码按钮
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      if (startPage > 1) {
        paginationHtml += \`<button onclick="goToPage(1)" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">1</button>\`;
        if (startPage > 2) {
          paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        const activeClass = isActive ? 'bg-yellow-500 text-white border-yellow-500' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50';
        paginationHtml += \`<button onclick="goToPage(\${i})" class="px-3 py-2 text-sm font-medium border rounded-md \${activeClass}">\${i}</button>\`;
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
        }
        paginationHtml += \`<button onclick="goToPage(\${totalPages})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">\${totalPages}</button>\`;
      }
      
      // 下一页按钮
      if (currentPage < totalPages) {
        paginationHtml += \`<button onclick="goToPage(\${currentPage + 1})" class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">${config.nextText}</button>\`;
      }
      
      paginationHtml += '</div>';
      
      // 添加页面信息
      paginationHtml += \`<div class="text-center text-sm text-gray-500 mb-4">${config.pageText.replace('{current}', '${currentPage}').replace('{total}', '${totalPages}')}</div>\`;
      paginationHtml += '</div>';
      
      $("#news").after(paginationHtml);
    }

    // 跳转到指定页面
    function goToPage(page) {
      updateUrlParameter('page', page);
      start(); // 重新加载数据
    }
  </script>
`;

console.log('需要为每个语言版本添加的功能：');
console.log('1. PIN排序功能');
console.log('2. 分页功能（每页10条）');
console.log('3. URL参数支持');
console.log('4. 分页导航UI');

// 输出每个语言版本的代码
Object.keys(languageConfigs).forEach(lang => {
  console.log(`\\n=== ${lang.toUpperCase()} 版本代码 ===`);
  console.log(getJavaScriptCode(languageConfigs[lang]));
});
