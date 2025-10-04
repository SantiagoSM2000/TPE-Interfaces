// Sidebar and Profile Menu Logic
document.addEventListener('DOMContentLoaded', () => {
  // Helper to wait for dynamically injected elements (header buttons)
  const waitForElement = (selector, timeout = 4000) => {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      let timerId;
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          if (timerId) {
            clearTimeout(timerId);
          }
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      if (timeout) {
        timerId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      }
    });
  };

  // Load sidebar component
  const loadSidebar = async () => {
    try {
      const response = await fetch('components/sidebar.html');
      const html = await response.text();

      const temp = document.createElement('div');
      temp.innerHTML = html;

      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      document.body.insertBefore(fragment, document.body.firstChild);

      const profilePromise = waitForElement('#profile-toggle');
      const toggleReady = await waitForElement('#sidebar-toggle');

      if (toggleReady) {
        initSidebar();
      } else {
        console.warn('Sidebar toggle button not found; sidebar will remain static.');
      }

      const profileReady = await profilePromise;

      if (profileReady) {
        initProfileMenu();
      } else {
        console.warn('Profile toggle button not found; profile menu disabled.');
      }
    } catch (err) {
      console.error('Error loading sidebar:', err);
    }
  };

  // Initialize sidebar functionality
  const initSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (!sidebar) {
      console.error('Sidebar element not found');
      return;
    }
    if (!toggleBtn) {
      console.error('Toggle button not found');
      return;
    }

    console.log('Sidebar and toggle button found');
    toggleBtn.setAttribute('aria-controls', 'sidebar');

    const isMobile = () => window.innerWidth <= 768;

    // Track state: true = sidebar visible, false = sidebar hidden
    let sidebarVisible = !sidebar.classList.contains('is-closed');

    if (isMobile()) {
      sidebarVisible = sidebar.classList.contains('is-open');
    }

    if (sidebarVisible) {
      document.body.classList.add('sidebar-open');
      sidebar.classList.remove('is-closed');
    } else {
      document.body.classList.remove('sidebar-open');
      sidebar.classList.add('is-closed');
      if (overlay) {
        overlay.classList.remove('is-visible');
      }
    }

    const updateToggleIcon = (visible) => {
      if (visible) {
        // Sidebar visible - show hamburger (can click to hide)
        toggleBtn.setAttribute('data-open', 'false');
      } else {
        // Sidebar hidden - show close/X (can click to show)
        toggleBtn.setAttribute('data-open', 'true');
      }
      toggleBtn.setAttribute('aria-expanded', String(visible));
      console.log('Icon updated. Visible:', visible, 'data-open:', toggleBtn.getAttribute('data-open'));
    };

    // Hide sidebar completely
    const hideSidebar = () => {
      console.log('Hiding sidebar');
      sidebar.classList.add('is-closed');
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
      sidebarVisible = false;
      updateToggleIcon(sidebarVisible);
    };

    // Show sidebar (desktop: 64px, mobile: 240px)
    const showSidebar = () => {
      console.log('Showing sidebar');
      sidebar.classList.remove('is-closed');
      
      if (isMobile()) {
        sidebar.classList.add('is-open');
        if (overlay) overlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
        const searchbar = document.querySelector(".search-input");
        setTimeout(function() {
          searchbar.focus();
        }, 1);
        // searchbar.select();
      } else {
        sidebar.classList.remove('is-open');
      }

      document.body.classList.add('sidebar-open');
      sidebarVisible = true;
      updateToggleIcon(sidebarVisible);
    };

    // Toggle sidebar
    const toggleSidebar = () => {
      console.log('Toggle clicked. Current state - visible:', sidebarVisible);
      
      if (sidebarVisible) {
        hideSidebar();
      } else {
        showSidebar();
      }
    };

    // Click handler
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('=== TOGGLE BUTTON CLICKED ===');
      toggleSidebar();
    });

    // Overlay click (mobile only)
    if (overlay) {
      overlay.addEventListener('click', () => {
        console.log('Overlay clicked');
        if (isMobile()) {
          hideSidebar();
        }
      });
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebarVisible) {
        console.log('ESC pressed');
        hideSidebar();
      }
    });

    // Window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        console.log('Window resized. Mobile:', isMobile());
        
        if (!isMobile()) {
          // Desktop: remove mobile classes
          sidebar.classList.remove('is-open');
          if (overlay) overlay.classList.remove('is-visible');
          document.body.style.overflow = '';
        } else {
          // Mobile: if sidebar is visible but not in mobile mode, fix it
          if (sidebarVisible && !sidebar.classList.contains('is-open')) {
            sidebar.classList.add('is-open');
          }
        }
        
        updateToggleIcon(sidebarVisible);
      }, 250);
    });

    // Update active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = sidebar.querySelectorAll('.sidebar-nav a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Initialize icon state
    updateToggleIcon(sidebarVisible);
    console.log('Sidebar initialized successfully. Initial state:', sidebarVisible ? 'visible' : 'hidden');
  };

  // Initialize profile menu
  const initProfileMenu = () => {
    const profileToggle = document.getElementById('profile-toggle');
    const profileMenu = document.getElementById('profile-menu');
    const profileOverlay = document.getElementById('profile-overlay');
    const profileClose = document.getElementById('profile-menu-close');

    if (!profileToggle || !profileMenu) return;

    // Open profile menu
    const openProfileMenu = () => {
      profileMenu.classList.add('is-open');
      profileOverlay.classList.add('is-visible');
    };

    // Close profile menu
    const closeProfileMenu = () => {
      profileMenu.classList.remove('is-open');
      profileOverlay.classList.remove('is-visible');
    };

    // Toggle profile menu
    const toggleProfileMenu = () => {
      const isOpen = profileMenu.classList.contains('is-open');
      if (isOpen) {
        closeProfileMenu();
      } else {
        openProfileMenu();
      }
    };

    // Event listeners
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfileMenu();
    });

    if (profileClose) {
      profileClose.addEventListener('click', closeProfileMenu);
    }

    if (profileOverlay) {
      profileOverlay.addEventListener('click', closeProfileMenu);
    }

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && profileMenu.classList.contains('is-open')) {
        closeProfileMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (profileMenu.classList.contains('is-open') && 
          !profileMenu.contains(e.target) && 
          !profileToggle.contains(e.target)) {
        closeProfileMenu();
      }
    });
  };

  // Start loading
  loadSidebar();
});