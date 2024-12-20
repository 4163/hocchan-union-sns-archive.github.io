document.addEventListener("DOMContentLoaded", () => {
    const mediaQuery = window.matchMedia("(pointer: coarse) and (max-width: 499px)"); /* 671px */
    const headerFollow = document.querySelector('.header-follow');
    const mobileNav = document.querySelector('.mobile-nav');
    const randomMobile = document.querySelector('.random-mobile');
    const spacerDiv = document.getElementById("spacer");
    const refreshDiv = document.querySelector(".refresh");
    const loadingDiv = document.querySelector(".loading");
    const refreshImg = refreshDiv.querySelector("img");

    let lastScrollY = window.scrollY, currentTranslateY = 0, lastTimestamp = 0;
    let isSpeedOpacityActive = false, lockOpacity = false, lockSpeedCheck = false;
    let buttonClickLock = false, lastClickTime = 0;
    let startY = 0, isSwipingDown = false, isRefreshing = false;
    let maxSpacerHeight = headerFollow ? headerFollow.offsetHeight : 100;

    console.log('Header Follow Height:', maxSpacerHeight);

    if (randomMobile) {
        randomMobile.addEventListener('click', () => {
            const currentTime = Date.now();
            if (currentTime - lastClickTime < 1250) return;
            lastClickTime = currentTime;
            buttonClickLock = true;

            if (!lockOpacity && !lockSpeedCheck) {
                lockOpacity = lockSpeedCheck = true;
                mobileNav.style.transition = 'opacity 0.3s ease-in-out';
                mobileNav.style.opacity = '1';
                if (headerFollow) {
                    headerFollow.style.transition = 'transform 0.3s ease-in-out';
                    headerFollow.style.transform = 'translateY(-100%)';
                    headerFollow.style.willChange = 'transform';
                }
                setTimeout(() => {
                    lockOpacity = lockSpeedCheck = buttonClickLock = false;
                }, 1250);
            }
        });
    } else {
        console.log("Element .random-mobile not found");
    }

    function adjustBannerHeight() {
        const banner = document.querySelector('.banner');
        const bannerImg = document.querySelector('.banner img');
        const header = document.querySelector('.header');
        if (mediaQuery.matches && banner && bannerImg && header && headerFollow) {
            banner.style.height = `${bannerImg.offsetHeight}px`;
            header.style.height = `${headerFollow.offsetHeight}px`;
        }
    }

    function adjustHeaderFollowPosition(event) {
        if (lockSpeedCheck) return;
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

    function adjustMobileNavOpacity(scrollY, scrollSpeed, deltaY) {
        if (lockOpacity) {
            mobileNav.style.opacity = '1';
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

            mobileNav.style.opacity = Math.max(0.3, Math.min(1, opacity));
            console.log(`Updated .mobile-nav opacity: ${mobileNav.style.opacity}`);
        }
    }

    // Touch events for pull-to-refresh, enabled only for coarse pointers and narrow screens
    if (mediaQuery.matches) {
        window.addEventListener("touchstart", (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isSwipingDown = true;
            }
        });

        window.addEventListener("touchmove", (e) => {
            if (isSwipingDown && !isRefreshing) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance > 0) {
                    e.preventDefault();
                    spacerDiv.style.height = `${Math.min(pullDistance, maxSpacerHeight)}px`;

                    // Show refresh icon only if scroll position is at the top
                    if (window.scrollY === 0) {
                        refreshDiv.style.display = 'block';
                    } else {
                        refreshDiv.style.display = 'none';
                    }

                    // Rotate the image only when spacer height reaches max height
                    if (pullDistance >= maxSpacerHeight) {
                        refreshImg.style.transition = 'transform 0.3s ease';
                        refreshImg.style.transform = 'rotate(180deg)';
                    } else {
                        refreshImg.style.transform = 'rotate(0deg)';
                    }
                }

                if (pullDistance > maxSpacerHeight) {
                    isRefreshing = true;
                    triggerRefresh();
                }
            }
        }, { passive: false });

        window.addEventListener("touchend", () => {
            isSwipingDown = false;
            if (!isRefreshing) resetRefresh();
        });
    }

	function triggerRefresh() {
		console.log("Refreshing...");
		refreshDiv.style.display = 'block';  // Show refresh icon initially

		// After 300ms, hide refresh and show loading
		setTimeout(() => {
			refreshDiv.style.display = 'none';  // Hide refresh icon
			loadingDiv.style.display = 'block';  // Show loading icon
		}, 300);

		// After another 400ms (700ms total), hide loading, show refresh, and reset rotation with transition
		setTimeout(() => {
			loadingDiv.style.display = 'none';  // Hide loading icon
			refreshDiv.style.display = 'block';  // Show refresh icon

			// Enable rotation transition for smooth reset to 0 degrees
			refreshImg.style.transition = 'transform 0.5s ease';
			refreshImg.style.transform = 'rotate(0deg)';  // Smoothly reset rotation to 0 degrees
		}, 700);

		// After 1000ms total, hide both icons
		setTimeout(resetRefresh, 800);
	}

	function resetRefresh() {
		isRefreshing = false;
		spacerDiv.style.height = "0";
		refreshDiv.style.display = 'none';  // Ensure refresh icon is hidden
		loadingDiv.style.display = 'none';  // Ensure loading icon is hidden
		refreshImg.style.transition = '';  // Remove transition for future interactions
	}

    adjustBannerHeight();
    window.addEventListener("resize", adjustBannerHeight);
    window.addEventListener("scroll", adjustHeaderFollowPosition);
});
