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