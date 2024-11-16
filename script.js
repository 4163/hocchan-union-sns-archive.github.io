document.addEventListener('DOMContentLoaded', function () {
  const headerFollow = document.querySelector('.header-follow');
  const header = document.querySelector('.header');
  const mobileNav = document.querySelector('.mobile-nav');
  const randomMobile = document.querySelector('.random-mobile');
  const spacerDiv = document.getElementById("spacer");
  const refreshDiv = document.querySelector(".refresh");
  const loadingDiv = document.querySelector(".loading");
  const refreshImg = refreshDiv.querySelector("img");

  let lastScrollY = window.scrollY, currentTranslateY = 0, lastTimestamp = 0;
  let isSpeedOpacityActive = false;
  let buttonClickLock = false, lastClickTime = 0;
  let startY = 0, isSwipingDown = false, isRefreshing = false;
  let maxSpacerHeight = headerFollow ? headerFollow.offsetHeight : 100;

  // Modify lockState to include logging
  const lockState = {
    opacityAndSpeed: false,
    enable() { 
      this.opacityAndSpeed = true; 
      console.log("Lock activated: opacity and speed adjustments are locked."); 
    },
    disable() { 
      this.opacityAndSpeed = false; 
      console.log("Lock deactivated: opacity and speed adjustments are now unlocked."); 
    },
    isLocked() { return this.opacityAndSpeed; }
  };

  if (headerFollow && header) {
    const followHeight = headerFollow.offsetHeight;
    header.style.height = `${followHeight}px`;
  }

  const maxTweetElement = document.querySelector('meta[name="maxTweetIndex"]');
  const maxTweetIndex = maxTweetElement ? parseInt(maxTweetElement.getAttribute('content'), 10) : 3251;

  const savedScrollPosition = localStorage.getItem('scrollPosition');
  if (savedScrollPosition) {
    window.scrollTo(0, parseInt(savedScrollPosition, 10));
  }

  window.addEventListener('beforeunload', function () {
    localStorage.setItem('scrollPosition', window.scrollY);
  });

  const getRandomPostProfileWithImage = () => {
    let randomIndex, tweetElement, postProfileImage;

    do {
      randomIndex = Math.floor(Math.random() * (maxTweetIndex + 1));
      const randomTweetClass = `.tweet-${String(randomIndex).padStart(4, '0')}`;
      tweetElement = document.querySelector(randomTweetClass);

      if (tweetElement) {
        postProfileImage = tweetElement.querySelector('.post-profile img');
      }

    } while (!postProfileImage);

    return postProfileImage;
  };

  const disableButtons = () => {
    document.querySelectorAll('.top, .bottom, .random, .random-mobile').forEach(button => {
      button.classList.add('disabled');
      button.style.pointerEvents = 'none';
    });
  };

  const enableButtons = () => {
    document.querySelectorAll('.top, .bottom, .random, .random-mobile').forEach(button => {
      button.classList.remove('disabled');
      button.style.pointerEvents = '';
    });
  };

  const mediaQuery = window.matchMedia("(pointer: coarse) and (max-width: 499px)");

  const applyMobileNavStylesIfRequired = () => {
    if (mediaQuery.matches && headerFollow && mobileNav) {
      mobileNav.style.opacity = '1';
      headerFollow.style.transform = `translateY(-${headerFollow.offsetHeight}px)`;
    }
  };

	const smoothScrollToWithHeaderAdjustment = (imageElement) => {
	  if (!imageElement) return;

	  disableButtons();
	  applyMobileNavStylesIfRequired();  // Apply styles conditionally

	  imageElement.scrollIntoView({ behavior: 'auto' });

	  const isCoarsePointerAndNarrowScreen = window.matchMedia('(pointer: coarse) and (max-width: 671px)').matches;

	  const offset = isCoarsePointerAndNarrowScreen
		? -12
		: -(headerFollow ? headerFollow.offsetHeight + 12 : 55);

	  const observer = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) {
		  setTimeout(() => {
			window.scrollBy({
			  top: offset,
			  behavior: 'smooth'
			});
			setTimeout(enableButtons, 300);
		  }, 200);
		  observer.disconnect();
		}
	  }, { threshold: 1.0 });

	  observer.observe(imageElement);
	};

  const smoothScrollTo = (element) => {
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth' });

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
      }
    }, { threshold: 1.0 });

    observer.observe(element);
  };

  function adjustBannerHeight() {
    const banner = document.querySelector('.banner');
    const bannerImg = document.querySelector('.banner img');
    if (mediaQuery.matches && banner && bannerImg && header && headerFollow) {
      banner.style.height = `${bannerImg.offsetHeight}px`;
      header.style.height = `${headerFollow.offsetHeight}px`;
    }
  }

  adjustBannerHeight();
  window.addEventListener("resize", adjustBannerHeight);

  function adjustHeaderFollowPosition(event) {
    if (lockState.isLocked()) return;
    if (mediaQuery.matches && headerFollow) {
      const headerHeight = headerFollow.offsetHeight;
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      const currentTimestamp = event.timeStamp;
      const timeDelta = currentTimestamp - lastTimestamp;
      const scrollSpeed = Math.abs(deltaY / timeDelta);
      const swipeSpeedThreshold = 2;

      if (currentScrollY <= headerHeight) {
        const revealPercentage = 1 - (currentScrollY / headerHeight);
        currentTranslateY = -headerHeight * (1 - revealPercentage);
      } else if (deltaY > 0) {
        currentTranslateY = Math.max(currentTranslateY - deltaY, -headerHeight);
        isSpeedOpacityActive = false;
      } else if (deltaY < 0 && scrollSpeed > swipeSpeedThreshold) {
        currentTranslateY = Math.min(currentTranslateY - deltaY, 0);
        isSpeedOpacityActive = true;
      }

      headerFollow.style.transform = `translateY(${currentTranslateY}px)`;
      adjustMobileNavOpacity(currentScrollY, scrollSpeed, deltaY);
      lastScrollY = currentScrollY;
      lastTimestamp = currentTimestamp;
    }
  }

  window.addEventListener("scroll", adjustHeaderFollowPosition);

  function adjustMobileNavOpacity(scrollY, scrollSpeed, deltaY) {
    if (lockState.isLocked()) {
      mobileNav.style.opacity = '1';
      console.log("Lock active: setting mobileNav opacity to 1.");
      return;
    }
    if (mediaQuery.matches && mobileNav && headerFollow) {
      const headerHeight = headerFollow.offsetHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const distanceFromBottom = documentHeight - (scrollY + viewportHeight);
      const bottomThreshold = 53;
      let opacity;

      if (isSpeedOpacityActive) {
        opacity = 1;
      } else if (scrollY <= headerHeight) {
        const revealPercentage = 1 - (scrollY / headerHeight);
        opacity = 0.3 + revealPercentage * 0.7;
      } else if (distanceFromBottom <= bottomThreshold) {
        const revealPercentage = 1 - (distanceFromBottom / bottomThreshold);
        opacity = 0.3 + revealPercentage * 0.7;
      } else if (deltaY > 0) {
        const scrollPercentage = Math.min(1, Math.abs(currentTranslateY) / headerHeight);
        opacity = 1 - scrollPercentage * 0.7;
      } else {
        opacity = 0.3;
      }

      opacity = Math.max(0.3, Math.min(1, opacity));
      mobileNav.style.opacity = opacity;
      console.log(`MobileNav opacity set to ${opacity}`);
    }
  }

  // Updated touch event listeners
  window.addEventListener("touchstart", (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isSwipingDown = true;
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (window.scrollY === 0) {
      if (isSwipingDown && e.touches[0].clientY > startY) {
        e.preventDefault();  // Prevent pull-to-refresh when at the top
      }
    }
  });

  window.addEventListener("touchend", (e) => {
    if (isSwipingDown && !isRefreshing) {
      isRefreshing = true;
      refreshDiv.style.opacity = "1";
      refreshImg.style.animation = "spin 1s linear infinite";
      refreshDiv.style.transition = "opacity 0.3s ease-out";

      setTimeout(() => {
        refreshDiv.style.opacity = "0";
        refreshImg.style.animation = "";
        isRefreshing = false;
      }, 3000);
    }
  });
});
